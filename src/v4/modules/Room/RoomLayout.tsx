import { AnimatePresence } from 'motion/react';

import styled from 'styled-components';

import useTickets from '@v4/api/hooks/use-tickets';

import ControlBar from './ControlBar';
import { RoomUIProvider, useRoomUI } from './RoomUIContext';
import TicketCard from './TicketCard';
import EmptyState from './TicketCard/EmptyState';
import Timeline from './Timeline';

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const RoomContent = () => {
  const { currentIssue } = useTickets();
  const { isTimelineOpen } = useRoomUI();

  return (
    <LayoutWrapper>
      <AnimatePresence mode="wait">
        {currentIssue ? (
          <TicketCard key={currentIssue.id} />
        ) : (
          <EmptyState key="empty" />
        )}
      </AnimatePresence>

      <ControlBar />

      <AnimatePresence>
        {isTimelineOpen && <Timeline key="timeline" />}
      </AnimatePresence>
    </LayoutWrapper>
  );
};

const RoomLayout = () => (
  <RoomUIProvider>
    <RoomContent />
  </RoomUIProvider>
);

export default RoomLayout;
