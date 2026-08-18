import { AnimatePresence } from 'motion/react';

import styled from 'styled-components';

import useTickets from '@v4/api/hooks/use-tickets';

import ControlBar from './control-bar';
import { RoomUIProvider, useRoomUI } from './room-ui-context';
import TicketCard from './ticket-card';
import EmptyState from './ticket-card/empty-state';
import Timeline from './timeline';

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
