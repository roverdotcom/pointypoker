import { ReactNode } from 'react';

import styled, { css } from 'styled-components';

import PlusIcon from '@assets/icons/plus.svg?react';
import { ThemedProps } from '@components/common';
import { Card } from '@mantine/core';
import useTheme from '@utils/styles/colors';

const HeaderWrapper = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  margin-top: 0;
  width: 100%;
`;

const TitlesWrapper = styled.div`
  align-items: baseline;
  display: flex;
  justify-content: flex-start;
`;

const Title = styled.h2`
  margin: 0;
`;

const Subtitle = styled.h4`
  ${({ theme }: ThemedProps) => css`
    color: ${theme.primary.accent11};
  `}

  margin: 0 1rem;
`;

const CloseIcon = styled(PlusIcon)`
  cursor: pointer;
  height: 1.5rem;
  transform: rotate(45deg);
  width: 1.5rem;

  > line {
    stroke: ${({ theme }: ThemedProps) => theme.primary.accent11};
    transition: stroke 300ms;
  }

  &:hover {
    > line {
      stroke: ${({ theme }: ThemedProps) => theme.primary.accent12};
    }
  }
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: auto;
  width: 100%;
`;

type ModalShellProps = {
  children: ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
  subtitle?: string;
  title?: string;
  titleId?: string;
};

/**
 * Background component for Card-backed modals: a Mantine `Card` shell with an
 * optional header (title/subtitle + close button) and a scrollable content
 * region. Used whenever a modal does not set `hideBackground`.
 */
const ModalShell = ({
  children,
  onClose,
  showCloseButton = true,
  subtitle,
  title,
  titleId,
}: ModalShellProps) => {
  const { theme } = useTheme();

  return (
    <Card
      padding="lg"
      radius="lg"
      style={{
        backgroundColor: theme.primary.accent2,
        borderColor: theme.primary.accent6,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        width: '100%',
      }}
      withBorder
    >
      {title ? (
        <HeaderWrapper>
          <TitlesWrapper>
            <Title id={titleId}>{title}</Title>
            {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
          </TitlesWrapper>
          {showCloseButton ? <CloseIcon aria-label="Close" onClick={onClose}
            role="button" /> : null}
        </HeaderWrapper>
      ) : null}
      <Content>{children}</Content>
    </Card>
  );
};

export default ModalShell;
