import styled from 'styled-components';

import { ThemedProps } from '@components/common';

const DividerWrapper = styled.div`
  align-items: center;
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
`;

const Line = styled.div<ThemedProps>`
  background: ${({ theme }: ThemedProps) => theme.primary.accent7};
  flex: 1;
  height: 1px;
`;

const Pill = styled.span<ThemedProps>`
  background: ${({ theme }: ThemedProps) => theme.primary.accent4};
  border-radius: 1rem;
  color: ${({ theme }: ThemedProps) => theme.primary.accent9};
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.125rem 0.625rem;
  text-transform: uppercase;
`;

type TimelineDividerProps = {
  label: string;
};

const TimelineDivider = ({ label }: TimelineDividerProps) => (
  <DividerWrapper>
    <Line />
    <Pill>{label}</Pill>
    <Line />
  </DividerWrapper>
);

export default TimelineDivider;
