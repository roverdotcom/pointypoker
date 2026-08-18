import styled from 'styled-components';

import { ThemedProps } from '@components/common';

const Label = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
  font-size: 0.9rem;
  font-weight: 600;
`;

type RoomLabelProps = {
  name: string | null;
};

const RoomLabel = ({ name }: RoomLabelProps) => (
  <Label>{name ?? 'Room'}</Label>
);

export default RoomLabel;
