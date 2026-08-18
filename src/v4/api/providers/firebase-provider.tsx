import {
  createContext,
  useEffect,
  useState,
  type JSX,
  type PropsWithChildren,
} from 'react';

import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';

import initFirebase from '@v4/api/core/firebase/app';

type FirebaseContext = {
  authClient: Auth | null;
  firebaseApp: FirebaseApp | null;
  storageClient: Firestore | null;
  isAppInitialized: boolean;
};

export const Context = createContext<FirebaseContext>({
  authClient: null,
  firebaseApp: null,
  isAppInitialized: false,
  storageClient: null,
});

const FirebaseProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  const [authClient, setAuthClient] = useState<Auth | null>(null);
  const [storageClient, setStorageClient] = useState<Firestore | null>(null);
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  useEffect(() => {
    if (isAppInitialized) return;

    const {
      app,
      auth,
      firestore,
    } = initFirebase();

    setFirebaseApp(app);
    setStorageClient(firestore);
    setAuthClient(auth);
    setIsAppInitialized(true);
  }, [isAppInitialized]);

  return (
    <Context.Provider
      value={{
        authClient,
        firebaseApp,
        isAppInitialized,
        storageClient,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default FirebaseProvider;
