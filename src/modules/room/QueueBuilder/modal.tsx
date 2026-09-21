import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import styled, { css } from 'styled-components';

import PencilSvg from '@assets/icons/pencil.svg?react';
import UndoSvg from '@assets/icons/undo.svg?react';
import { scaleEntrance } from '@components/common/animations';
import { useJira } from '@modules/integrations';
import {
  JiraBoardPayloadValue,
  JiraField,
  JiraIssueGroupWithIssues,
} from '@modules/integrations/jira/types';
import { useTickets } from '@modules/room/hooks';
import useStore from '@utils/store';
import { ThemedProps } from '@utils/styles/colors/types';

import BoardSelection from './steps/boardSelection';
import GroupSelection from './steps/groupSelection';
import TicketReview from './steps/ticketReview';
// import ModeSelection, { ImportModeSelection } from './steps/modeSelection';

type ConfigOptionProps = {
  selectionComplete: boolean;
} & ThemedProps;

const EditIcon = styled(PencilSvg)`
  height: 1.5rem;
  width: 1.5rem;
  
  ${ ({ theme }: ThemedProps) => css`
    > line, path {
      stroke: ${ theme.primary.accent11 };
    }
  `}
`;

const UndoIcon = styled(UndoSvg)`
  height: 1rem;
  width: 1rem;
  margin-left: 0.25rem;
  
  ${ ({ theme }: ThemedProps) => css`
    > path, polyline {
      stroke: ${ theme.primary.accent11 };
    }
  `}
`;

const ConfigWrapper = styled.div`
  ${({ theme }: ThemedProps) => css`
    color: ${ theme.primary.accent12} ;
  `}

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: 100%;
`;

const ConfigOptionWrapper = styled.div`
  display: flex;
  flex: 1;
  width: 50%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;

  > p {
    margin: 0;
    font-size: 1rem;
    ${({ theme }: ThemedProps) => css`
      color: ${ theme.greyscale.accent11 };
    `}
  }
`;

const ConfigOption = styled.div<ConfigOptionProps>`
  ${({ selectionComplete, theme }: ConfigOptionProps) => {
    const borderType = selectionComplete ? 'solid' : 'dashed';
    const borderColor = selectionComplete ? theme.greyscale.accent6 : theme.greyscale.accent12;

    return css`
      border: 1px ${ borderType } ${ borderColor };
      cursor: ${ selectionComplete ? 'pointer' : 'default' };
  `;
  }};

  ${({ selectionComplete, theme }: ConfigOptionProps) => selectionComplete && css`
    &:hover {
      background-color: ${ theme.greyscale.accent4 };
    }
  `}
  
  display: flex;
  width: 100%;
  height: 3rem;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin: 0.5rem;

  transition: 
    border 0.25s ease-out,
    background-color 0.25s ease-out;
`;

const RevertWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 1rem;

  > p {
    cursor: pointer;
    margin: 0;
    font-size: 0.75rem;
    ${({ theme }: ThemedProps) => css`
      color: ${ theme.greyscale.accent11 };
    `}
  }
`;

const ConfigOptionLabel = styled.p`
  display: flex;
  flex-grow: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const ConfigOptionEditIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin-left: 0.5rem;
  animation: ${scaleEntrance} 300ms;
`;

const ListContentWrapper = styled.div`
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: auto;
  width: 100%;
`;

const QueueModal = () => {
  const defaultBoard = useStore(({ preferences }) => preferences?.jiraPreferences?.defaultBoard);
  const { getPointFieldFromBoardId } = useJira();
  const { queue } = useTickets();
  // const [ importModeSelection, setImportModeSelection ] = useState<ImportModeSelection | null>(null);
  const [overrideBoard, setOverrideBoard] = useState<JiraBoardPayloadValue | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<JiraIssueGroupWithIssues | null>(null);
  const [showOverrideUI, setShowOverrideUI] = useState<boolean>(false);
  const [pointField, setPointField] = useState<JiraField | null>(null);
  const isAnyBoardSelected = useMemo(() => !!defaultBoard || !!overrideBoard, [defaultBoard, overrideBoard]);

  const selectionContent = useMemo(() => {
    if ((!isAnyBoardSelected) || showOverrideUI) {
      return (
        <BoardSelection
          defaultBoard={defaultBoard}
          setOverrideBoard={setOverrideBoard}
          showOverrideUI={showOverrideUI}
          setShowOverrideUI={setShowOverrideUI}
        />
      );
    }

    if (!selectedSprint && pointField) {
      return (
        <GroupSelection
          existingQueue={queue}
          board={{ id: overrideBoard?.id ?? defaultBoard!.id }}
          setGroup={setSelectedSprint}
          pointField={pointField}
        />
      );
    }

    if (selectedSprint?.issues && pointField) {
      return (
        <TicketReview
          existingQueue={queue}
          issues={selectedSprint.issues}
          pointField={pointField}
          selectedBoardId={overrideBoard?.id || defaultBoard!.id}
        />
      );
    }
  }, [
    isAnyBoardSelected,
    showOverrideUI,
    selectedSprint,
    pointField,
    defaultBoard,
    queue,
    overrideBoard?.id,
  ]);

  useEffect(() => {
    if (isAnyBoardSelected) {
      getPointFieldFromBoardId(overrideBoard?.id || defaultBoard!.id)
        .then((result) => setPointField(result.field))
        .catch((error) => {
          console.error('Error resolving point field:', error);
          setPointField(null);
        });
    }
  }, [
    defaultBoard,
    isAnyBoardSelected,
    overrideBoard?.id,
  ]);

  return (
    <>
      <ConfigWrapper>
        <ConfigOptionWrapper>
          <p>Project Board</p>
          <ConfigOption
            onClick={() => {
              setShowOverrideUI(true);
              setOverrideBoard(null);
              setSelectedSprint(null);
            }}
            selectionComplete={(isAnyBoardSelected) && !showOverrideUI}
          >
            <ConfigOptionLabel>
              {
                (showOverrideUI || (!isAnyBoardSelected))
                  ? 'Pending board selection'
                  : overrideBoard?.name ?? defaultBoard?.name
              }
            </ConfigOptionLabel>
            {isAnyBoardSelected && (
              <ConfigOptionEditIcon>
                <EditIcon />
              </ConfigOptionEditIcon>
            )}
          </ConfigOption>
          <RevertWrapper>
            {overrideBoard && defaultBoard && (
              <p
                onClick={() => {
                  setOverrideBoard(null);
                  setSelectedSprint(null);
                }}
              >
                Revert to default board
                <UndoIcon />
              </p>
            )}
          </RevertWrapper>
        </ConfigOptionWrapper>
        <ConfigOptionWrapper>
          <p>Sprint</p>
          <ConfigOption
            onClick={() => setSelectedSprint(null)}
            selectionComplete={!!selectedSprint}
          >
            <ConfigOptionLabel>
              {selectedSprint?.name ?? 'Pending sprint selection'}
            </ConfigOptionLabel>
            {selectedSprint && (
              <ConfigOptionEditIcon>
                <EditIcon
                  onClick={() => {
                    setSelectedSprint(null);
                  }}
                />
              </ConfigOptionEditIcon>
            )}
          </ConfigOption>
          <RevertWrapper />
        </ConfigOptionWrapper>
      </ConfigWrapper>
      <ListContentWrapper>
        {selectionContent}
      </ListContentWrapper>
    </>
  );
};

export default QueueModal;
