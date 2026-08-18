import styled from 'styled-components';

import { ThemedProps } from '@components/common';
import Issue from '@v4/types/issue';

const ItemRow = styled.div<ThemedProps & { $isCompleted: boolean }>`
  align-items: center;
  display: flex;
  gap: 0.75rem;
  opacity: ${({ $isCompleted }) => ($isCompleted ? 0.7 : 1)};
  padding: 0.625rem 1.25rem;
`;

const TypeIcon = styled.img`
  border-radius: 0.125rem;
  height: 1rem;
  width: 1rem;
`;

const IssueName = styled.span<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
  flex: 1;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PointValue = styled.span<ThemedProps>`
  background: ${({ theme }: ThemedProps) => theme.primary.accent4};
  border-radius: 0.375rem;
  color: ${({ theme }: ThemedProps) => theme.primary.accent11};
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
`;

type TimelineItemProps = {
  issue: Issue;
  status: 'completed' | 'upcoming';
};

const TimelineItem = ({ issue, status }: TimelineItemProps) => {
  const isCompleted = status === 'completed';
  const value = issue.overrideValue ?? issue.calculatedValue;
  const iconSrc = issue.external?.type?.icon
    ? `data:${issue.external.type.icon.contentType};base64,${issue.external.type.icon.data}`
    : null;

  return (
    <ItemRow $isCompleted={isCompleted}>
      {iconSrc && <TypeIcon alt="" src={iconSrc} />}
      <IssueName>{issue.name}</IssueName>
      {isCompleted && value !== undefined && (
        <PointValue>{value}</PointValue>
      )}
    </ItemRow>
  );
};

export default TimelineItem;
