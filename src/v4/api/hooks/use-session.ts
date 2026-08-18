import { useContext } from 'react';

import {
  Context as SessionContext,
  type SessionContextValue,
} from '@v4/api/providers/session-provider';

const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
};

export default useSession;
