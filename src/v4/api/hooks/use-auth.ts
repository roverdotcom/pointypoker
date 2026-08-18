import { useContext } from 'react';

import {
  Context as AuthContext,
  type AuthContextValue,
} from '@v4/api/providers/auth-provider';

const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;
