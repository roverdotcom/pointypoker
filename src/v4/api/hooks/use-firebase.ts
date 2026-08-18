import { useContext } from 'react';

import { Context as FirebaseContext } from '@v4/api/providers/firebase-provider';

const useFirebase = () => {
  const context = useContext(FirebaseContext);

  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
};

export default useFirebase;
