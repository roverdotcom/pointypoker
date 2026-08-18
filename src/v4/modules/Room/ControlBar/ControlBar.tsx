import { div as MotionDiv } from 'motion/react-client';
import { useMemo } from 'react';

import styled from 'styled-components';

import { ThemedProps } from '@components/common';
import ZIndex from '@components/common/constants';
import useSession from '@v4/api/hooks/use-session';
import useTickets from '@v4/api/hooks/use-tickets';

import { useRoomUI } from '../RoomUIContext';
import ProgressBar from './ProgressBar';
import RoomLabel from './RoomLabel';

const BarContainer = styled.div<ThemedProps>`
  align-items: center;
  backdrop-filter: blur(12px);
  background-color: ${({ theme }: ThemedProps) => theme.primary.accent3};
  border: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent6};
  border-radius: 1rem;
  box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.3);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  max-width: min(90vw, 52rem);
  padding: 0.5rem 1.5rem;
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  z-index: ${ZIndex.CONTROL_BAR};
`;

const Section = styled.div`
  align-items: center;
  display: flex;
  gap: 0.5rem;
`;

const CenterSection = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

const IconButton = styled.button<ThemedProps>`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
  cursor: pointer;
  display: flex;
  font-size: 0.8rem;
  font-weight: 500;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }: ThemedProps) => theme.primary.accent4};
  }
`;

const ControlBar = () => {
  const { sessionName, leaveSession } = useSession();
  const {
    historyIssues,
    upcomingIssues,
    currentIssue,
  } = useTickets();
  const { openSpotlight, toggleTimeline } = useRoomUI();

  const hasQueue = upcomingIssues.length > 0 || historyIssues.length > 0;
  const total = useMemo(() => {
    return historyIssues.length + upcomingIssues.length + (currentIssue ? 1 : 0);
  }, [
    historyIssues.length,
    upcomingIssues.length,
    currentIssue,
  ]);

  return (
    <MotionDiv
      animate={{
        opacity: 1,
        y: 0,
      }}
      initial={{
        opacity: 0,
        y: 60,
      }}
      style={{ width: '100%' }}
      transition={{
        delay: 0.2,
        duration: 0.4,
        ease: [
          0.4,
          0,
          0.2,
          1,
        ],
      }}
    >
      <BarContainer>
        <Section>
          <IconButton onClick={openSpotlight}>
            + Add
          </IconButton>
          <IconButton onClick={toggleTimeline}>
            Timeline
          </IconButton>
        </Section>

        <CenterSection>
          <RoomLabel name={sessionName} />
          {hasQueue && (
            <ProgressBar
              completed={historyIssues.length}
              total={total}
            />
          )}
        </CenterSection>

        <Section>
          <IconButton onClick={leaveSession}>
            Leave
          </IconButton>
        </Section>
      </BarContainer>
    </MotionDiv>
  );
};

export default ControlBar;
