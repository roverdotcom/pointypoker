import { div as MotionDiv } from 'motion/react-client';

import styled from 'styled-components';

import { ThemedProps } from '@components/common';

import { useRoomUI } from '../room-ui-context';

const Wrapper = styled.div<ThemedProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 3rem;
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent11};
`;

const Title = styled.h2<ThemedProps>`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
`;

const Subtitle = styled.p`
  font-size: 1rem;
  margin: 0;
  opacity: 0.7;
`;

const AddButton = styled.button<ThemedProps>`
  background: ${({ theme }: ThemedProps) => theme.primary.accent4};
  border: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent7};
  border-radius: 0.5rem;
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
  cursor: pointer;
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }: ThemedProps) => theme.primary.accent5};
  }
`;

const EmptyState = () => {
  const { openSpotlight } = useRoomUI();

  return (
    <MotionDiv
      initial={{
        filter: 'blur(0.5rem)',
        opacity: 0,
        transform: 'translateY(12px)',
      }}
      animate={{
        filter: 'blur(0rem)',
        opacity: 1,
        transform: 'translateY(0px)',
      }}
      exit={{
        filter: 'blur(0.5rem)',
        opacity: 0,
        transform: 'translateY(-12px)',
      }}
      transition={{ duration: 0.25 }}
    >
      <Wrapper>
        <Title>No ticket in play</Title>
        <Subtitle>Add a ticket to get started</Subtitle>
        <AddButton onClick={openSpotlight}>
          Add Ticket
        </AddButton>
      </Wrapper>
    </MotionDiv>
  );
};

export default EmptyState;
