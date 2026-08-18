export { default as initFirebase, type FirebaseHandles } from './app';
export { default as createDataClient, type DataClient } from './firestore';
export {
  watchAuthState,
  signInAnon,
  signOutUser,
} from './auth';
