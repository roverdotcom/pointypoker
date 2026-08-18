import styled from 'styled-components';

import { ThemedProps } from '@components/common';

const ActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActionRow = styled.button<ThemedProps>`
  align-items: center;
  background: transparent;
  border: none;
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
  cursor: pointer;
  display: flex;
  font-size: 0.95rem;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  text-align: left;
  transition: background 0.1s ease;
  width: 100%;

  &:hover {
    background: ${({ theme }: ThemedProps) => theme.primary.accent4};
  }
`;

const ActionLabel = styled.span`
  flex: 1;
`;

const Hint = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent9};
  font-size: 0.8rem;
`;

type SpotlightActionsProps = {
  isJiraConnected: boolean;
  onCreateTicket: () => void;
  onOpenJiraWizard: () => void;
  query: string;
};

const SpotlightActions = ({
  isJiraConnected,
  onCreateTicket,
  onOpenJiraWizard,
  query,
}: SpotlightActionsProps) => (
  <ActionsWrapper>
    {query.trim() && (
      <ActionRow onClick={onCreateTicket}>
        <ActionLabel>
          Create ticket:
          {' '}
          <strong>{query.trim()}</strong>
        </ActionLabel>
        <Hint>Enter</Hint>
      </ActionRow>
    )}
    {isJiraConnected && (
      <ActionRow onClick={onOpenJiraWizard}>
        <ActionLabel>Import from Jira...</ActionLabel>
      </ActionRow>
    )}
  </ActionsWrapper>
);

export default SpotlightActions;
