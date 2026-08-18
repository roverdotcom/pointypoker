import styled from 'styled-components';

import { ThemedProps } from '@components/common';

const ActionsRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 1.5rem;
`;

const ActionButton = styled.button<ThemedProps & { $variant?: 'primary' | 'default' }>`
  background: ${({ $variant, theme }: ThemedProps & { $variant?: string }) => (
    $variant === 'primary' ? theme.primary.accent9 : theme.primary.accent3
  )};
  border: 1px solid ${({ $variant, theme }: ThemedProps & { $variant?: string }) => (
    $variant === 'primary' ? theme.primary.accent10 : theme.primary.accent7
  )};
  border-radius: 0.5rem;
  color: ${({ $variant, theme }: ThemedProps & { $variant?: string }) => (
    $variant === 'primary' ? theme.primary.accent1 : theme.primary.accent11
  )};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

type CardActionsProps = {
  areAllVotesCast: boolean;
  onAdvance: () => void;
  onReveal: () => void;
  onSkip: () => void;
  shouldShowVotes: boolean;
};

const CardActions = ({
  areAllVotesCast,
  onAdvance,
  onReveal,
  onSkip,
  shouldShowVotes,
}: CardActionsProps) => (
  <ActionsRow>
    <ActionButton onClick={onSkip}>
      Skip
    </ActionButton>

    {shouldShowVotes ? (
      <ActionButton $variant="primary" onClick={onAdvance}>
        Accept &amp; Next
      </ActionButton>
    ) : (
      <ActionButton
        $variant="primary"
        onClick={onReveal}
      >
        {areAllVotesCast ? 'Reveal Votes' : 'Force Reveal'}
      </ActionButton>
    )}
  </ActionsRow>
);

export default CardActions;
