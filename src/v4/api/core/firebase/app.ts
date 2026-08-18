import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

/**
 * Low-level Firebase bootstrap. Pure (no React, no store): initializes the app
 * and SDK handles once and memoizes them, so repeated calls (e.g. a provider
 * remount) reuse the same instances instead of re-running `initializeApp`.
 */
export type FirebaseHandles = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

let handles: FirebaseHandles | null = null;

const initFirebase = (): FirebaseHandles => {
  if (handles) return handles;

  const config = {
    apiKey: import.meta.env.VITE_FB_API_KEY,
    appId: import.meta.env.VITE_FB_APP_ID,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  };

  const app = initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (import.meta.env.DEV) {
    console.log('EMULATOR STARTING');
    connectAuthEmulator(auth, 'http://127.0.0.1:4002');
    console.log('AUTH');
    connectFirestoreEmulator(
      firestore,
      '127.0.0.1',
      4001,
    );
    console.log('FIRESTORE');
  }

  handles = {
    app,
    auth,
    firestore,
  };

  return handles;
};

export default initFirebase;
