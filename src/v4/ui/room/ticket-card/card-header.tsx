import styled from 'styled-components';

import { ThemedProps } from '@components/common';
import Issue from '@v4/types/issue';

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const IssueName = styled.h2<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.primary.accent12};
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
`;

const TypeIcon = styled.img`
  border-radius: 0.25rem;
  height: 1.25rem;
  width: 1.25rem;
`;

const ExternalLink = styled.a<ThemedProps>`
  color: ${({ theme }: ThemedProps) => theme.info.accent9};
  font-size: 0.85rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

type CardHeaderProps = {
  issue: Issue;
};

const CardHeader = ({ issue }: CardHeaderProps) => {
  const external = issue.external;
  const iconSrc = external?.type?.icon
    ? `data:${external.type.icon.contentType};base64,${external.type.icon.data}`
    : null;

  return (
    <Header>
      {iconSrc && <TypeIcon src={iconSrc} alt="" />}
      <IssueName>{issue.name}</IssueName>
      {external?.url && (
        <ExternalLink
          href={external.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          View in Jira
        </ExternalLink>
      )}
    </Header>
  );
};

export default CardHeader;
