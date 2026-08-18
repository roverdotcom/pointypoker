import { div as MotionDiv } from 'motion/react-client';

import styled from 'styled-components';

import { ThemedProps } from '@components/common';
import ZIndex from '@components/common/constants';
import useTickets from '@v4/api/hooks/use-tickets';

import { useRoomUI } from '../RoomUIContext';
import TimelineDivider from './TimelineDivider';
import TimelineItem from './TimelineItem';

const PanelWrapper = styled.div<ThemedProps>`
  background-color: ${({ theme }: ThemedProps) => theme.primary.accent2};
  border-left: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent6};
  bottom: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  right: 0;
  top: 0;
  width: min(90vw, 24rem);
  z-index: ${ZIndex.MODAL};
`;

const Header = styled.div<ThemedProps>`
  align-items: center;
  border-bottom: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent6};
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.25rem;
`;

const Title = styled.h3<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent12};
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button<ThemedProps>`
  background: transparent;
  border: none;
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent10};
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
`;

const EmptyMessage = styled.p<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent9};
  font-size: 0.9rem;
  padding: 2rem 1.25rem;
  text-align: center;
`;

const Timeline = () => {
  const { closeTimeline } = useRoomUI();
  const { upcomingIssues, historyIssues } = useTickets();

  const isEmpty = upcomingIssues.length === 0 && historyIssues.length === 0;

  return (
    <MotionDiv
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      initial={{ x: '100%' }}
      style={{
        bottom: 0,
        position: 'fixed',
        right: 0,
        top: 0,
      }}
      transition={{
        damping: 30,
        stiffness: 300,
        type: 'spring',
      }}
    >
      <PanelWrapper>
        <Header>
          <Title>Timeline</Title>
          <CloseButton onClick={closeTimeline}>
            &times;
          </CloseButton>
        </Header>

        <List>
          {isEmpty ? (
            <EmptyMessage>No tickets in the queue yet</EmptyMessage>
          ) : (
            <>
              {upcomingIssues.map((issue) => (
                <TimelineItem
                  key={issue.id}
                  issue={issue}
                  status="upcoming"
                />
              ))}
              <TimelineDivider label="now" />
              {historyIssues.map((issue) => (
                <TimelineItem
                  key={issue.id}
                  issue={issue}
                  status="completed"
                />
              ))}
            </>
          )}
        </List>
      </PanelWrapper>
    </MotionDiv>
  );
};

export default Timeline;
