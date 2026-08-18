import {
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';

/**
 * Low-level anonymous-auth wrappers over the Firebase SDK. Pure: no React, no
 * store — the provider owns state and derives status from these primitives.
 */
export const watchAuthState = (auth: Auth,callback: (user: FirebaseUser | null) => void): (() => void) => onAuthStateChanged(auth, callback);

export const signInAnon = async (auth: Auth): Promise<FirebaseUser> => {
  const { user } = await signInAnonymously(auth);
  return user;
};

export const signOutUser = (auth: Auth): Promise<void> => firebaseSignOut(auth);
