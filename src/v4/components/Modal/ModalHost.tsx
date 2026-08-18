import { AnimatePresence } from 'motion/react';
import { div as AnimatedContainer } from 'motion/react-client';
import { useId } from 'react';
import { createPortal } from 'react-dom';

import ZIndex from '@components/common/constants';
import { FocusTrap } from '@mantine/core';
import { useMobile } from '@utils/hooks/mobile';
import useTheme from '@utils/styles/colors';

import { useModal } from './ModalContext';
import ModalShell from './ModalShell';
import { MODAL_REGISTRY } from './registry';
import { DEFAULT_MODAL_SIZE, resolveDimension } from '@v4/types/modal';

// Signature perspective/blur entry shared with the legacy modal and the setup route.
const HIDDEN_STATE = {
  filter: 'blur(1rem)',
  opacity: 0,
  transform: 'perspective(500px) rotateX(-10deg) translateZ(-90px) translateY(20px)',
};

const VISIBLE_STATE = {
  filter: 'blur(0rem)',
  opacity: 1,
  transform: 'perspective(500px) rotateX(0deg) translateZ(0px) translateY(0px)',
};

const ModalHost = () => {
  const { activeModal, closeModal } = useModal();
  const { isNarrow } = useMobile();
  const { theme } = useTheme();
  const titleId = useId();

  const definition = activeModal !== null ? MODAL_REGISTRY[activeModal] : null;

  const handleBackdropClick = () => {
    if (definition?.closeOnBackdrop !== false) {
      closeModal();
    }
  };

  const renderBody = () => {
    if (!definition) {
      return null;
    }

    const Content = definition.component;

    // hideBackground: render the component raw. It owns its own chrome,
    // entry animation, and click-stop behavior (e.g. Spotlight's Panel).
    if (definition.hideBackground) {
      return <Content />;
    }

    const size = {
      ...DEFAULT_MODAL_SIZE,
      ...definition.size,
    };
    const width = resolveDimension(size.width, isNarrow);
    const height = resolveDimension(size.height, isNarrow);
    const minWidth = resolveDimension(size.minWidth, isNarrow);

    return (
      <FocusTrap active>
        <AnimatedContainer
          animate={{
            ...VISIBLE_STATE,
            height,
            width,
          }}
          aria-labelledby={definition.title ? titleId : undefined}
          aria-modal="true"
          exit={{
            ...HIDDEN_STATE,
            height,
            width,
          }}
          initial={{
            ...HIDDEN_STATE,
            height,
            width,
          }}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          style={{ minWidth }}
          transition={{ duration: 0.3 }}
        >
          <ModalShell
            onClose={closeModal}
            showCloseButton={definition.showCloseButton}
            subtitle={definition.subtitle}
            title={definition.title}
            titleId={titleId}
          >
            <Content />
          </ModalShell>
        </AnimatedContainer>
      </FocusTrap>
    );
  };

  const overlay = (
    <AnimatePresence>
      {definition ? (
        <AnimatedContainer
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={handleBackdropClick}
          style={{
            alignItems: 'center',
            backdropFilter: 'blur(0.75rem)',
            backgroundColor: theme.transparent.accent1,
            display: 'flex',
            height: '100vh',
            justifyContent: 'center',
            left: 0,
            position: 'fixed',
            top: 0,
            width: '100vw',
            zIndex: ZIndex.MODAL_OVERLAY,
          }}
          transition={{ duration: 0.3 }}
        >
          {renderBody()}
        </AnimatedContainer>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
};

export default ModalHost;
