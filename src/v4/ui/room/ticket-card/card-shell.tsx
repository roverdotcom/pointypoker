import styled from 'styled-components';

import { ThemedProps } from '@components/common';

const CardShell = styled.div<ThemedProps>`
  background-color: ${({ theme }: ThemedProps) => theme.primary.accent2};
  border: 1px solid ${({ theme }: ThemedProps) => theme.primary.accent6};
  border-radius: 1rem;
  box-shadow: 0 0.5rem 2rem rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  min-height: 28rem;
  padding: 2rem;
  width: min(90vw, 52rem);
`;

export default CardShell;
