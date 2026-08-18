import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ModalContextValue,
  ModalKey,
  ParamsFor,
} from '@v4/types/modal';

import ModalHost from './ModalHost';

const ModalContext = createContext<ModalContextValue | null>(null);

const useModal = (): ModalContextValue => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }

  return context;
};

/**
 * Typed accessor for the params passed to the currently open modal. A modal
 * component reads its own deep-link params without prop-drilling, e.g.
 * `const { section } = useModalParams<ModalKey.PREFERENCES>()`.
 */
const useModalParams = <K extends ModalKey>(): ParamsFor<K> => {
  const { activeParams } = useModal();

  return activeParams as ParamsFor<K>;
};

const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [activeParams, setActiveParams] = useState<unknown>(undefined);

  const openModal = useCallback(<K extends ModalKey>(key: K, params?: ParamsFor<K>) => {
    setActiveModal(key);
    setActiveParams(params);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setActiveParams(undefined);
  }, []);

  // Global Escape-to-close: a single listener for every modal, instead of
  // each overlay wiring up its own.
  useEffect(() => {
    if (activeModal === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, closeModal]);

  const value = useMemo<ModalContextValue>(() => ({
    activeModal,
    activeParams,
    closeModal,
    openModal,
  }), [
    activeModal,
    activeParams,
    closeModal,
    openModal,
  ]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalHost />
    </ModalContext.Provider>
  );
};

export {
  ModalProvider,
  useModal,
  useModalParams,
};
