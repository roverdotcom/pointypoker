import {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import cloneDeep from 'lodash/cloneDeep';
import styled, { css } from 'styled-components';

import Spinner from '@assets/icons/loading-circle.svg?react';
import { fadeDownEntrance, spinAnimation } from '@components/common/animations';
import { useJira } from '@modules/integrations';
import {
  JiraField,
  JiraIssueGroupWithIssues,
  JiraIssueSearchPayload,
} from '@modules/integrations/jira/types';
import { usePrevious } from '@utils';
import { ThemeColorKey, ThemedProps } from '@utils/styles/colors/types';
import {
  BacklogSource,
  BoardRef,
  GroupedIssues,
  IssueGroup,
} from '@v4/types/issueGroup';
import { isKanbanBoard } from '@v4/types/jira';
import { Room } from '@yappy/types';

import { InformationWrapper, SectionWrapper } from './common';

type Props = {
  board?: BoardRef;
  existingQueue: Room[ 'ticketQueue' ];
  setGroup: (groupData: JiraIssueGroupWithIssues) => void;
  pointField: JiraField;
};

type IssuesByGroup = GroupedIssues<JiraIssueSearchPayload>;

type GroupOptionProps = {
  hasIssues: boolean;
  hasNewIssuesWithIssuesInQueue: boolean;
  delayFactor?: number;
} & ThemedProps;

/**
 * Appends each incoming group's issues onto the matching group, deduplicating
 * by issue id. Groups are matched by `groupId` — never by `fields.sprint` —
 * because the API layer already tagged each issue with the group that produced
 * it.
 */
const mergeGroupedIssues = (existing: IssuesByGroup | null, incoming: IssuesByGroup): IssuesByGroup => {
  if (!existing) return incoming;

  const merged = existing.map((entry) => ({ ...entry }));

  incoming.forEach((entry) => {
    const match = merged.find((candidate) => candidate.groupId === entry.groupId);

    if (!match) {
      merged.push({ ...entry });
      return;
    }

    const fresh = entry.issues.filter((issue) => !match.issues.some((seen) => seen.id === issue.id));
    match.issues = [...match.issues, ...fresh];
  });

  return merged;
};

const LoadingWrapper = styled.span<{ size: number }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-right: 0.25rem;

  ${({ size }) => css`
    > svg {
      height: ${size}rem;
      width: ${size}rem;
    }
  `}
`;

const LoadingIcon = styled(Spinner)`
  ${({ theme }: ThemedProps) => css`
    > polyline, circle {
      stroke: ${theme.greyscale.accent11};
    }
  `}

  animation: ${spinAnimation} 1s linear infinite;
`;

const GroupOptionWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 80%;
  overflow: auto;
  border-radius: 0.5rem;
`;

const GroupOption = styled.div<GroupOptionProps>`
  ${({
    delayFactor,
    hasIssues,
    theme,
  }: GroupOptionProps) => css`
    cursor: ${ hasIssues ? 'pointer' : 'default' };
    background-color: ${ theme.greyscale[ hasIssues ? 'accent3' : 'accent2' ] };
    color: ${ theme.greyscale[hasIssues ? 'accent12' : 'accent11'] };
    border-width: 1px;
    border-style: solid;
    border-color: ${ theme.greyscale[hasIssues ? 'accent7' : 'accent3'] };
    animation: ${ fadeDownEntrance } 0.25s ease-out ${ delayFactor }ms forwards;

    &:hover {
      border-color: ${ theme.greyscale[hasIssues ? 'accent12' : 'accent3'] };
    }
  `}

  opacity: 0;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  margin: 0.25rem 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  transition:
    background-color 0.25s ease-out,
    color 0.25s ease-out,
    border 0.25s ease-out;
`;

const EmptyStateMessage = styled.p`
  ${({ theme }: ThemedProps) => css`
    color: ${ theme.greyscale.accent11 };
  `}

  font-size: 0.875rem;
  margin: 0.5rem 0;
  text-align: center;
`;

const PointContainer = styled.span<GroupOptionProps>`
  ${({
    theme,
    hasIssues,
    hasNewIssuesWithIssuesInQueue,
  }: GroupOptionProps) => {
    let colorScheme: ThemeColorKey = hasIssues ? 'success' : 'greyscale';
    if (hasNewIssuesWithIssuesInQueue) {
      colorScheme = 'info';
    }

    return css`
      border: 1px solid ${ theme[colorScheme][ hasIssues ? 'accent8' : 'accent2' ] };
      color: ${ theme[colorScheme][hasIssues ? 'accent9' : 'accent11'] };
      background-color: ${ hasIssues ? theme[colorScheme]['accent2'] : 'none' };
      font-size: 0.75rem;
    `;
  }}

  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;

  transition:
    color 0.25s ease-out,
    border 0.125s ease-out;
`;

const GroupSelection = ({
  board,
  existingQueue,
  setGroup,
  pointField,
}: Props) => {
  const boardId = board?.id;
  const boardType = board?.type;
  const previousBoardId = usePrevious(boardId);
  const [isLoading, setIsLoading] = useState(false);
  const [groupData, setGroupData] = useState<IssueGroup[] | null>(null);
  const [groupedIssues, setGroupedIssues] = useState<GroupedIssues<JiraIssueSearchPayload> | null>(null);
  const {
    getAvatars,
    getImportableIssues,
    getIssueGroupsForBoard,
  } = useJira();

  const issueCount = groupedIssues?.reduce((acc, entry) => acc + entry.issues.length, 0) ?? 0;

  const handleFetchGroupData = useCallback(async () => {
    if (!board) return;

    setIsLoading(true);

    try {
      setGroupData(await getIssueGroupsForBoard(board));
    } catch (error) {
      // TODO: Handle error in the future
      console.error('Error fetching issue groups:', error);
    }
    // `board` is often a fresh object literal, so key this callback on the board's
    // scalar fields instead. Both `id` and `type` are listed: a board whose type
    // resolves after first render must rebuild this callback, or the stale closure
    // would send a Kanban board down the Scrum path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    boardId,
    boardType,
    getIssueGroupsForBoard,
  ]);

  const handleGetAvatars = useCallback(async () => {
    if (!groupedIssues?.some((entry) => entry.issues.length)) {
      return;
    }

    const avatarData = groupedIssues
      .flatMap((entry) => entry.issues)
      .reduce((acc: { [key: string]: number }, issue) => {
        const { issuetype } = issue.fields;
        if (!acc[issuetype.name]) {
          acc[issuetype.name] = issuetype.avatarId;
        }
        return acc;
      }, {});

    try {
      const avatars = await getAvatars(avatarData);

      setGroupedIssues((existing) => (existing ?? []).map((entry) => ({
        ...entry,
        issues: entry.issues.map((issue) => {
          const updatedIssue = cloneDeep(issue);
          updatedIssue.fields.issuetype.icon = { ...avatars[updatedIssue.fields.issuetype.name] };

          return updatedIssue;
        }),
      })));
    } catch (error) {
      console.error('Error fetching avatars:', error);
    }
  }, [getAvatars, groupedIssues]);

  const handleFetchIssueData = useCallback(async (startAt = 0, knownSource?: BacklogSource) => {
    if (!board) return;

    try {
      const page = await getImportableIssues(
        board,
        pointField,
        startAt,
        knownSource,
      );

      setGroupedIssues((existing) => mergeGroupedIssues(existing, page.groups));

      if (startAt + page.maxResults < page.total) {
        handleFetchIssueData(startAt + page.maxResults, page.source);
        return;
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setIsLoading(false);
    }
    // Keyed on the board's scalar fields rather than the object identity, for the
    // same reason as `handleFetchGroupData` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    boardId,
    boardType,
    getImportableIssues,
    pointField,
  ]);

  useEffect(() => {
    if (boardId && previousBoardId !== boardId) {
      setGroupData(null);
      setGroupedIssues(null);
      handleFetchGroupData();
      handleFetchIssueData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, previousBoardId]);

  useEffect(() => {
    if (issueCount) {
      handleGetAvatars();
    }
    // Deliberately keyed on the issue count alone: hydrating avatars replaces
    // every issue object, so depending on `groupedIssues` here would make this
    // effect retrigger itself forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueCount]);

  const groupOptions = useMemo(() => groupData?.map((group, delayFactor) => {
    const apiIssues = groupedIssues?.find((entry) => entry.groupId === group.id)?.issues ?? [];
    const issuesInQueue = existingQueue.filter((ticket) => {
      return apiIssues.some((issue) => issue.key === ticket.id);
    });
    const newIssueCount = apiIssues.length - issuesInQueue.length;
    const hasIssues = !!apiIssues.length && !!newIssueCount;

    const handleSelectGroup = () => {
      const newIssues = apiIssues.filter((issue) => !issuesInQueue.some((ticket) => ticket?.id === issue.key));

      if (newIssues.length) {
        setGroup({
          ...group,
          issues: newIssues,
        });
      }
    };

    const issueCountDisplay = isLoading ? (
      <LoadingWrapper size={1}>
        <LoadingIcon />
      </LoadingWrapper>
    ) : newIssueCount;

    let pointContainerMessage: string | JSX.Element = '';

    if (isLoading) {
      pointContainerMessage = (<>{issueCountDisplay} loading tickets</>);
    } else {
      if (issuesInQueue.length) {
        if (newIssueCount > 0) {
          // Issues in queue, but there are new issues in the group that aren't in the queue
          pointContainerMessage = `${issueCountDisplay} new unpointed ticket${ issuesInQueue.length === 1 ? '' : 's' }`;
        } else {
          // Issues in queue, but they all match issues in the group
          pointContainerMessage = 'Sprint already in queue';
        }
      } else if (newIssueCount > 0) {
        // No issues in queue, issues in the group
        pointContainerMessage = `${issueCountDisplay} unpointed ticket${apiIssues.length === 1 ? '' : 's'}`;
      } else {
        // No issues in queue, no issues in the group
        pointContainerMessage = 'No unpointed tickets';
      }
    }

    return (
      <GroupOption
        key={group.id}
        hasIssues={hasIssues}
        hasNewIssuesWithIssuesInQueue={newIssueCount > 0 && issuesInQueue.length > 0}
        delayFactor={100 * delayFactor}
        onClick={handleSelectGroup}
      >
        {group.name}
        <PointContainer
          hasIssues={hasIssues}
          hasNewIssuesWithIssuesInQueue={newIssueCount > 0 && issuesInQueue.length > 0}
        >
          {pointContainerMessage}
        </PointContainer>
      </GroupOption>
    );
  }), [
    groupData,
    groupedIssues,
    existingQueue,
    isLoading,
    setGroup,
  ]);

  const stepHeading = isKanbanBoard(boardType) ? 'Select issues to import' : 'Select a sprint';

  const loadingIcon = useMemo(() => groupData ? (
    <h2>{stepHeading}</h2>
  ) : (
    <LoadingWrapper size={2}><LoadingIcon /></LoadingWrapper>
  ), [groupData, stepHeading]);

  // An empty Kanban backlog resolves to a single group with no issues; without
  // an explicit message the user is left staring at zero-count rows.
  const emptyState = useMemo(() => {
    if (isLoading || !groupData || issueCount) return null;

    return <EmptyStateMessage>No issues to import</EmptyStateMessage>;
  }, [
    groupData,
    isLoading,
    issueCount,
  ]);

  return (
    <SectionWrapper>
      <InformationWrapper>
        {loadingIcon}
      </InformationWrapper>
      <GroupOptionWrapper>
        {groupOptions}
        {emptyState}
      </GroupOptionWrapper>
    </SectionWrapper>
  );
};

export default GroupSelection;
