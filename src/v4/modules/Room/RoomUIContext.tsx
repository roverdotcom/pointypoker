import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ModalKey, useModal } from '@v4/ui/modal';

type RoomUIContextValue = {
  closeTimeline: () => void;
  isTimelineOpen: boolean;
  openSpotlight: () => void;
  toggleTimeline: () => void;
};

const RoomUIContext = createContext<RoomUIContextValue | null>(null);

const useRoomUI = (): RoomUIContextValue => {
  const context = useContext(RoomUIContext);

  if (!context) {
    throw new Error('useRoomUI must be used within a RoomUIProvider');
  }

  return context;
};

const RoomUIProvider = ({ children }: { children: ReactNode }) => {
  const {
    activeModal,
    openModal,
    closeModal,
  } = useModal();
  const [isTimelineOpen, setTimelineOpen] = useState(false);

  const openSpotlight = useCallback(() => {
    openModal(ModalKey.SPOTLIGHT);
    setTimelineOpen(false);
  }, [openModal]);

  const toggleTimeline = useCallback(() => {
    setTimelineOpen((prev) => !prev);
  }, []);

  const closeTimeline = useCallback(() => {
    setTimelineOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();

        if (activeModal === ModalKey.SPOTLIGHT) {
          closeModal();
        } else {
          openSpotlight();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    activeModal,
    closeModal,
    openSpotlight,
  ]);

  const value = useMemo(() => ({
    closeTimeline,
    isTimelineOpen,
    openSpotlight,
    toggleTimeline,
  }), [
    closeTimeline,
    isTimelineOpen,
    openSpotlight,
    toggleTimeline,
  ]);

  return (
    <RoomUIContext.Provider value={value}>
      {children}
    </RoomUIContext.Provider>
  );
};

export { useRoomUI, RoomUIProvider };
