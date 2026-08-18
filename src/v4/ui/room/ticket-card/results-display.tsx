import styled from 'styled-components';

import { ThemedProps } from '@components/common';
import { CalculationResult } from '@v4/utilities/vote-calculations';

const ResultsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
`;

const StatBlock = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatValue = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent12};
  font-size: 2rem;
  font-weight: 700;
`;

const StatLabel = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent10};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const DistributionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
`;

const DistChip = styled.div<ThemedProps>`
  align-items: center;
  background: ${({ theme }: ThemedProps) => theme.primary.accent3};
  border: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent6};
  border-radius: 0.5rem;
  display: flex;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
`;

const DistValue = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent12};
  font-size: 0.9rem;
  font-weight: 600;
`;

const DistCount = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.greyscale.accent10};
  font-size: 0.8rem;
`;

const Warning = styled.p<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.warning.accent10};
  font-size: 0.85rem;
  margin: 0;
  text-align: center;
`;

type ResultsDisplayProps = {
  calculation: CalculationResult;
};

const ResultsDisplay = ({ calculation }: ResultsDisplayProps) => {
  const {
    average,
    distribution,
    suggestedValue,
    warning,
  } = calculation;

  const distributionEntries = Object.entries(distribution)
    .sort(([a], [b]) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

  return (
    <ResultsWrapper>
      <StatsRow>
        {average !== null && (
          <StatBlock>
            <StatValue>{average.toFixed(1)}</StatValue>
            <StatLabel>Average</StatLabel>
          </StatBlock>
        )}
        {suggestedValue !== null && (
          <StatBlock>
            <StatValue>{suggestedValue}</StatValue>
            <StatLabel>Suggested</StatLabel>
          </StatBlock>
        )}
      </StatsRow>

      {warning && <Warning>{warning}</Warning>}

      {distributionEntries.length > 0 && (
        <DistributionRow>
          {distributionEntries.map(([value, count]) => (
            <DistChip key={value}>
              <DistValue>{value}</DistValue>
              <DistCount>
                {count}
                {' '}
                vote
                {count !== 1 ? 's' : ''}
              </DistCount>
            </DistChip>
          ))}
        </DistributionRow>
      )}
    </ResultsWrapper>
  );
};

export default ResultsDisplay;
