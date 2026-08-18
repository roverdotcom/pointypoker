import { div as MotionDiv } from 'motion/react-client';

import styled from 'styled-components';

import { ThemedProps } from '@components/common';

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ResultRow = styled.button<ThemedProps>`
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

const TicketKey = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.info.accent9};
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 6rem;
`;

const TicketName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TypeIcon = styled.img`
  border-radius: 0.125rem;
  height: 1rem;
  width: 1rem;
`;

export type SpotlightResult = {
  iconUrl?: string;
  isParent?: boolean;
  key: string;
  name: string;
};

type SpotlightResultsProps = {
  onSelect: (result: SpotlightResult) => void;
  results: SpotlightResult[];
};

const SpotlightResults = ({ onSelect, results }: SpotlightResultsProps) => (
  <ResultsList>
    {results.map((result, index) => (
      <MotionDiv
        key={result.key}
        animate={{
          filter: 'blur(0rem)',
          opacity: 1,
          transform: 'translateY(0px)',
        }}
        initial={{
          filter: 'blur(0.25rem)',
          opacity: 0,
          transform: 'translateY(-8px)',
        }}
        transition={{
          delay: index * 0.05,
          duration: 0.2,
        }}
      >
        <ResultRow onClick={() => onSelect(result)}>
          {result.iconUrl && <TypeIcon alt="" src={result.iconUrl} />}
          <TicketKey>{result.key}</TicketKey>
          <TicketName>{result.name}</TicketName>
        </ResultRow>
      </MotionDiv>
    ))}
  </ResultsList>
);

export default SpotlightResults;
