import { div as MotionDiv } from 'motion/react-client';

import styled, { useTheme } from 'styled-components';

import { ThemedProps } from '@components/common';

const Track = styled.div<ThemedProps>`
  background: ${({ theme }: ThemedProps) => theme.greyscale.accent4};
  border-radius: 0.25rem;
  height: 0.25rem;
  overflow: hidden;
  width: 100%;
`;

type ProgressBarProps = {
  completed: number;
  total: number;
};

const ProgressBar = ({ completed, total }: ProgressBarProps) => {
  const theme = useTheme();
  const percent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Track>
      <MotionDiv
        animate={{ width: `${percent}%` }}
        initial={{ width: 0 }}
        style={{
          background: theme.success.accent9,
          borderRadius: '0.25rem',
          height: '100%',
        }}
        transition={{
          duration: 0.4,
          ease: [
            0.4,
            0,
            0.2,
            1,
          ],
        }}
      />
    </Track>
  );
};

export default ProgressBar;
