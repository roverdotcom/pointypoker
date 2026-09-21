import { useCallback, useState } from 'react';

import { arrayUnion } from 'firebase/firestore';
import styled, { css } from 'styled-components';

import ArrowSvg from '@assets/icons/arrow-right.svg?react';
import ReplaceSvg from '@assets/icons/arrows-counter-clockwise.svg?react';
import AppendSvg from '@assets/icons/queue.svg?react';
import PrependSvg from '@assets/icons/queue-prepend.svg?react';
import { Button } from '@components/common';
import { fadeDownEntrance } from '@components/common/animations';
import { useJira } from '@modules/integrations';
import {
  JiraField,
  JiraIssueSearchPayload,
  QueuedJiraTicket,
} from '@modules/integrations/jira/types';
import { Separator } from '@modules/preferences/panes/common';
import { useTickets } from '@modules/room/hooks';
import { PointingSchemes } from '@modules/room/utils';
import { updateRoom } from '@services/firebase';
import { useMobile } from '@utils/hooks/mobile';
import useStore from '@utils/store';
import { ThemedProps } from '@utils/styles/colors/types';
import { Room } from '@yappy/types';
import { RoomUpdateObject } from '@yappy/types/legacy/room';

import { InformationWrapper, SectionWrapper } from './common';

export enum EXISTING_QUEUE_ACTIONS {
  PREPEND,
  APPEND,
  REPLACE,
}

type Props = {
  existingQueue: Room['ticketQueue'];
  issues: JiraIssueSearchPayload[];
  pointField: JiraField;
  selectedBoardId: number;
};

type QueueControlProps = {
  alignRight: boolean;
};

const IssuesWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 80%;
  overflow: auto;
  border-radius: 0.5rem;
`;

const QueueControlWrapper = styled.div<QueueControlProps & ThemedProps>`
  ${({ alignRight, isNarrow }) => css`
    justify-content: ${alignRight ? 'flex-end' : 'space-between'};
    flex-direction: ${isNarrow ? 'column' : 'row'};
    align-items: center;
  `};

  display: flex;
  width: 80%;
`;

const IssueWrapper = styled.div<{ delayFactor: number }>`
  ${({ delayFactor, theme }: { delayFactor: number } & ThemedProps) => css`
    animation: ${fadeDownEntrance } 0.25s ease-out ${ delayFactor}ms forwards;
    background-color: ${theme.greyscale.accent3};
    border: 2px solid ${theme.greyscale.accent6};
    color: ${theme.primary.accent12};
  `};
    
  border-radius: 0.5rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  opacity: 0;
  width: 100%;
`;

const TicketInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  overflow: hidden;
`;

const Title = styled.h4`
  margin-bottom: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const TicketSprintInfo = styled.p`
  ${({ theme }: ThemedProps) => css`
    color: ${theme.greyscale.accent11};
  `};

  font-size: 0.75rem;
  margin: 0;
`;

const TicketTypeIcon = styled.img`
  height: 2rem;
  width: 2rem;
  margin-right: 0.5rem;
  border-radius: 0.25rem;
`;

const ArrowIcon = styled(ArrowSvg)`
  height: 1.5rem;
  width: 1.5rem;
  margin-left: 0.5rem;
`;

const PrependIcon = styled(PrependSvg)`
  height: 1.5rem;
  width: 1.5rem;
  margin-right: 0.5rem;
`;

const AppendIcon = styled(AppendSvg)`
  height: 1.5rem;
  width: 1.5rem;
  margin-right: 0.5rem;
`;

const ReplaceIcon = styled(ReplaceSvg)`
  height: 1.5rem;
  width: 1.5rem;
  margin-right: 0.5rem;
`;

const QueueActionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
`;

const QueueActionRadioButton = styled.div<{ isSelected: boolean }>`
  ${({ isSelected, theme }: { isSelected: boolean } & ThemedProps) => css`
    background-color: ${theme[isSelected ? 'info' : 'greyscale'].accent3};
    color: ${theme[isSelected ? 'info' : 'greyscale'].accent11};
    border: 2px solid ${theme[isSelected ? 'info' : 'greyscale'].accent6};
  `}

  cursor: pointer;
  display: flex;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-right: 0.5rem;
  margin-top: 0.5rem;

  transition: 
    background-color 250ms ease-out,
    color 250ms ease-out,
    border 250ms ease-out;
  
  > label {
    cursor: pointer;
  }

  > input {
    display: none;
  }
`;

const TicketReview = ({
  existingQueue,
  issues,
  pointField,
  selectedBoardId,
}: Props) => {
  const [queueAction, setQueueAction] = useState<EXISTING_QUEUE_ACTIONS | null>(null);
  const {
    closeModal,
    pointScheme,
    roomName,
  } = useStore(({
    preferences,
    room,
    closeModal,
  }) => ({
    closeModal,
    pointScheme: preferences.pointScheme ?? { scheme: PointingSchemes.fibonacci },
    roomName: room?.name,
  }));
  const {
    currentTicket,
    completedTickets = [],
    handleCreatePredefinedTicket,
    shouldShowVotes,
  } = useTickets();
  const { isNarrow } = useMobile();
  const { buildJiraUrl } = useJira();
  const ticketsInQueue = !!existingQueue.length;

  const handleAddTicketsToQueue = useCallback(async () => {
    if (!roomName) {
      return;
    }

    const updateObj: RoomUpdateObject = {};
    const newIssues = issues.map(({
      key,
      fields: {
        summary,
        issuetype,
        sprint,
      },
    }): QueuedJiraTicket => {
      return {
        currentBoardId: selectedBoardId,
        estimationFieldId: pointField.id,
        id: key,
        name: summary,
        pointOptions: pointScheme,
        sprint,
        type: { ...issuetype },
        url: buildJiraUrl(key),
      };
    });

    if (!currentTicket || !shouldShowVotes) {
      const newCurrentTicket = newIssues[0];
      if (newCurrentTicket) {
        handleCreatePredefinedTicket(newCurrentTicket, true);
      }
    }

    switch (queueAction) {
      case EXISTING_QUEUE_ACTIONS.APPEND:
        updateObj['ticketQueue'] = arrayUnion(...newIssues);
        break;
      case EXISTING_QUEUE_ACTIONS.PREPEND:
        updateObj['ticketQueue'] = [...newIssues, ...existingQueue];
        break;
      case EXISTING_QUEUE_ACTIONS.REPLACE:
      default:
        updateObj['ticketQueue'] = [...newIssues];
        break;
    }

    // Filter out completed tickets that are in newIssues
    const updatedCompletedTickets = completedTickets
      .filter((completed) => !newIssues
        .find((newIssue) => newIssue.id === completed.id) ) || [];

    if (updatedCompletedTickets.length !== completedTickets?.length) {
      updateObj['completedTickets'] = updatedCompletedTickets;
    }

    try {
      await updateRoom(
        roomName,
        updateObj,
        closeModal,
      );
    } catch (error) {
      console.error('Doh!', error);
    }
  }, [
    roomName,
    issues,
    currentTicket,
    shouldShowVotes,
    queueAction,
    completedTickets,
    selectedBoardId,
    pointField.id,
    pointScheme,
    buildJiraUrl,
    handleCreatePredefinedTicket,
    existingQueue,
    closeModal,
  ]);

  const issueList = issues.map(({
    fields: {
      issuetype,
      sprint,
      summary,
    },
    key,
  }, delayMultiplier) => {
    const { icon, name } = issuetype;

    return (
      <IssueWrapper key={key} delayFactor={100 * delayMultiplier}>
        <TicketTypeIcon
          src={icon.blobData}
          alt={name}
          title={name}
        />
        <TicketInfo>
          <Title title={summary}>{summary}</Title>
          <TicketSprintInfo>
            {key}&nbsp;&nbsp;•&nbsp;&nbsp;{issuetype.name}{sprint ? ` in ${sprint.name}` : ''}
          </TicketSprintInfo>
        </TicketInfo>
      </IssueWrapper>
    );
  });

  const queueActionOptions = [
    {
      icon: <ReplaceIcon />,
      label: 'Replace',
      value: EXISTING_QUEUE_ACTIONS.REPLACE,
    },
    {
      icon: <AppendIcon />,
      label: 'Append',
      value: EXISTING_QUEUE_ACTIONS.APPEND,
    },
    {
      icon: <PrependIcon />,
      label: 'Prepend',
      value: EXISTING_QUEUE_ACTIONS.PREPEND,
    },
  ];

  const pointingSchemeString = pointScheme.scheme === PointingSchemes.fibonacci
    ? 'the Fibonacci sequence' : 'sequential numbers';

  return (
    <SectionWrapper>
      <InformationWrapper><h2>Review tickets</h2></InformationWrapper>
      <IssuesWrapper>{issueList}</IssuesWrapper>
      <p style={{ marginBottom: 0 }}>Tickets will be pointed using {pointingSchemeString}.</p>
      <Separator />
      {ticketsInQueue && (
        <p style={{ marginBottom: 0 }}>Tickets are already in the queue. How do you want to add the new tickets?</p>
      )}
      <QueueControlWrapper alignRight={!ticketsInQueue} isNarrow={isNarrow}>
        {ticketsInQueue && (
          <QueueActionWrapper>
            {queueActionOptions.map(({
              label,
              value,
              icon,
            }) => (
              <QueueActionRadioButton
                key={value}
                isSelected={queueAction === value}
                onClick={() => setQueueAction(value)}
              >
                {icon}
                <input
                  type='radio'
                  id={label}
                  name='queueAction'
                  value={value}
                />
                <label htmlFor={label}>{label}</label>
              </QueueActionRadioButton>
            ) )}
          </QueueActionWrapper>
        )}
        <Button
          refresh
          variation='info'
          width={12}
          textSize='small'
          onClick={handleAddTicketsToQueue}
          disabled={ticketsInQueue && queueAction === null}
        >
          {ticketsInQueue ? 'Update' : 'Add to'} queue
          <ArrowIcon />
        </Button>
      </QueueControlWrapper>
    </SectionWrapper>
  );
};

export default TicketReview;
