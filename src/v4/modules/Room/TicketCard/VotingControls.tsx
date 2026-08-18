import {
  useCallback,
  useEffect,
  useMemo,
} from 'react';

import styled, { css } from 'styled-components';

import { ThemedProps } from '@components/common';
import { getPointOptions } from '@modules/room/utils';
import useStore from '@utils/store';
import useSession from '@v4/api/hooks/use-session';

const VotingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SectionLabel = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent10};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const VoteButton = styled.button<ThemedProps & { $isSelected: boolean }>`
  background: ${({ $isSelected, theme }: ThemedProps & { $isSelected: boolean }) => (
    $isSelected ? theme.primary.accent9 : theme.primary.accent3
  )};
  border: 1px solid ${({ $isSelected, theme }: ThemedProps & { $isSelected: boolean }) => (
    $isSelected ? theme.primary.accent10 : theme.primary.accent7
  )};
  border-radius: 0.5rem;
  color: ${({ $isSelected, theme }: ThemedProps & { $isSelected: boolean }) => (
    $isSelected ? theme.primary.accent1 : theme.primary.accent11
  )};
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  min-width: 3rem;
  padding: 0.5rem 0.75rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  ${({ $isSelected, theme }: ThemedProps & { $isSelected: boolean }) => !$isSelected && css`
    &:hover {
      background: ${theme.primary.accent4};
      border-color: ${theme.primary.accent8};
    }
  `}
`;

const ObserverMessage = styled.p<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent10};
  font-style: italic;
  margin: 0;
  padding: 1rem 0;
  text-align: center;
`;

type VotingControlsProps = {
  onClear: () => void;
  onVote: (value: string) => void;
};

const VotingControls = ({ onClear, onVote }: VotingControlsProps) => {
  const { isObserver, pointScheme } = useStore(({ preferences }) => ({
    isObserver: preferences.isObserver ?? false,
    pointScheme: preferences.pointScheme,
  }));

  const { session } = useSession();
  const userId = useStore((state) => state.preferences.user?.id);
  const myVote = userId ? session?.estimations?.[userId]?.value ?? null : null;

  const { exclusions, sequence } = useMemo(() => getPointOptions(pointScheme?.scheme, pointScheme), [pointScheme]);

  const handleVote = useCallback((value: string) => {
    if (String(myVote) === value) {
      onClear();
    } else {
      onVote(value);
    }
  }, [
    myVote,
    onClear,
    onVote,
  ]);

  useEffect(() => {
    if (isObserver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      const match = sequence.find((opt) => String(opt) === key);
      if (match !== undefined) {
        e.preventDefault();
        handleVote(String(match));
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    sequence,
    handleVote,
    isObserver,
  ]);

  if (isObserver) {
    return <ObserverMessage>You are observing this session</ObserverMessage>;
  }

  return (
    <VotingWrapper>
      <SectionLabel>Vote</SectionLabel>
      <ButtonRow>
        {sequence.map((option) => (
          <VoteButton
            key={String(option)}
            $isSelected={String(myVote) === String(option)}
            onClick={() => handleVote(String(option))}
          >
            {option}
          </VoteButton>
        ))}
      </ButtonRow>
      {exclusions.length > 0 && (
        <>
          <SectionLabel>Other</SectionLabel>
          <ButtonRow>
            {exclusions.map((option) => (
              <VoteButton
                key={String(option)}
                $isSelected={String(myVote) === String(option)}
                onClick={() => handleVote(String(option))}
              >
                {option}
              </VoteButton>
            ))}
          </ButtonRow>
        </>
      )}
    </VotingWrapper>
  );
};

export default VotingControls;
