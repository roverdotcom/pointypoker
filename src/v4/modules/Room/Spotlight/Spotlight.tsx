import { div as MotionDiv } from 'motion/react-client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import styled from 'styled-components';

import { ThemedProps } from '@components/common';
import useJira from '@v4/api/hooks/use-jira';
import useTickets from '@v4/api/hooks/use-tickets';
import { useModal } from '@v4/ui/modal';

import SpotlightActions from './SpotlightActions';
import SpotlightInput from './SpotlightInput';
import SpotlightResults, { SpotlightResult } from './SpotlightResults';

const JIRA_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/i;

const Panel = styled.div<ThemedProps>`
  background-color: ${({ theme }: ThemedProps) => theme.primary.accent2};
  border: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent6};
  border-radius: 0.75rem;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.4);
  max-height: 60vh;
  overflow: hidden;
  width: min(90vw, 36rem);
`;

const Spotlight = () => {
  const { closeModal } = useModal();
  const { createIssue } = useTickets();
  const { isConnected, getIssueDetail } = useJira();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotlightResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isJiraQuery = useMemo(() => JIRA_KEY_PATTERN.test(query.trim()), [query]);

  useEffect(() => {
    if (!isConnected || !isJiraQuery) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const issue = await getIssueDetail(query.trim());
        if (issue) {
          setResults([
            {
              iconUrl: issue.iconUrl,
              isParent: issue.isParent,
              key: issue.key || query.trim(),
              name: issue.summary || issue.key || query.trim(),
            },
          ]);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    query,
    isConnected,
    isJiraQuery,
    getIssueDetail,
  ]);

  const handleCreate = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    await createIssue(trimmed);
    closeModal();
  }, [
    query,
    createIssue,
    closeModal,
  ]);

  const handleSelectResult = useCallback(async (result: SpotlightResult) => {
    await createIssue(result.name);
    closeModal();
  }, [createIssue, closeModal]);

  // The modal host provides the backdrop, Escape-to-close, and click-outside.
  // Spotlight only renders its own panel (anchored near the top).
  return (
    <MotionDiv
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        y: -20,
      }}
      initial={{
        opacity: 0,
        scale: 0.95,
        y: -20,
      }}
      onClick={(e) => e.stopPropagation()}
      style={{
        alignSelf: 'flex-start',
        marginTop: '20vh',
      }}
      transition={{ duration: 0.2 }}
    >
      <Panel>
        <SpotlightInput
          onChange={setQuery}
          onSubmit={handleCreate}
          value={query}
        />

        {results.length > 0 && !isSearching ? (
          <SpotlightResults
            onSelect={handleSelectResult}
            results={results}
          />
        ) : (
          <SpotlightActions
            isJiraConnected={isConnected}
            onCreateTicket={handleCreate}
            onOpenJiraWizard={() => {}}
            query={query}
          />
        )}
      </Panel>
    </MotionDiv>
  );
};

export default Spotlight;
