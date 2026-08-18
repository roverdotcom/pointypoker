import { AnimatePresence } from 'motion/react';
import { div as MotionDiv } from 'motion/react-client';

import styled from 'styled-components';

import { ThemedProps } from '@components/common';
import Estimation from '@v4/types/estimation';
import { Participant } from '@yappy/types/user';

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
`;

const Chip = styled.div<ThemedProps & { $hasVoted: boolean }>`
  align-items: center;
  background: ${({ $hasVoted, theme }: ThemedProps & { $hasVoted: boolean }) => (
    $hasVoted ? theme.success.accent3 : theme.greyscale.accent3
  )};
  border: 1px solid ${({ $hasVoted, theme }: ThemedProps & { $hasVoted: boolean }) => (
    $hasVoted ? theme.success.accent7 : theme.greyscale.accent6
  )};
  border-radius: 2rem;
  display: flex;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
`;

const ChipName = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
  font-size: 0.8rem;
  font-weight: 500;
`;

const VoteValue = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent12};
  font-size: 0.8rem;
  font-weight: 700;
`;

const Indicator = styled.span<ThemedProps & { $hasVoted: boolean }>`
  background: ${({ $hasVoted, theme }: ThemedProps & { $hasVoted: boolean }) => (
    $hasVoted ? theme.success.accent9 : theme.greyscale.accent7
  )};
  border-radius: 50%;
  display: inline-block;
  height: 0.5rem;
  width: 0.5rem;
`;

type VoteEntry = {
  estimation: Estimation | null;
  hasVoted: boolean;
  participant: Participant;
};

type VoteStatusProps = {
  shouldShowVotes: boolean;
  voteData: VoteEntry[];
};

const VoteStatus = ({ shouldShowVotes, voteData }: VoteStatusProps) => (
  <StatusRow>
    <AnimatePresence mode="popLayout">
      {voteData.map(({
        estimation,
        hasVoted,
        participant,
      }) => (
        <MotionDiv
          key={participant.id}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.8,
          }}
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          layout
          transition={{ duration: 0.2 }}
        >
          <Chip $hasVoted={hasVoted}>
            <Indicator $hasVoted={hasVoted} />
            <ChipName>{participant.name}</ChipName>
            {shouldShowVotes && estimation?.value && (
              <VoteValue>{estimation.value}</VoteValue>
            )}
          </Chip>
        </MotionDiv>
      ))}
    </AnimatePresence>
  </StatusRow>
);

export default VoteStatus;
