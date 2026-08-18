import {
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

/**
 * A stable abstraction over Firestore read/write/listen. This is the single
 * seam through which v4 touches remote storage — a natural point to swap in a
 * mock/fixture data source later (mirrors the Jira client). Pure: no React,
 * no store; built from a Firestore handle by `createDataClient`.
 */
export type DataClient = {
  read: <T>(collection: string, id: string) => Promise<T | null>;
  watch: <T>(
    collection: string,
    id: string,
    callback: (data: T | null, error?: string) => void,
  ) => Unsubscribe | null;
  write: <T extends object>(collection: string, id: string, data: T) => Promise<void>;
  patch: (collection: string, id: string, data: Record<string, unknown>) => Promise<void>;
  removeField: (collection: string, id: string, fieldPath: string) => Promise<void>;
};

const createDataClient = (storageClient: Firestore | null): DataClient => ({
  patch: async (
    collection: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> => {
    if (!storageClient) return;
    await updateDoc(doc(
      storageClient,
      collection,
      id,
    ), data);
  },

  read: async <T>(collection: string, id: string): Promise<T | null> => {
    if (!storageClient) return null;
    const snapshot = await getDoc(doc(
      storageClient,
      collection,
      id,
    ));
    return snapshot.exists() ? (snapshot.data() as T) : null;
  },

  removeField: async (
    collection: string,
    id: string,
    fieldPath: string,
  ): Promise<void> => {
    if (!storageClient) return;
    await updateDoc(doc(
      storageClient,
      collection,
      id,
    ), { [fieldPath]: deleteField() });
  },

  watch: <T>(
    collection: string,
    id: string,
    callback: (data: T | null, error?: string) => void,
  ): Unsubscribe | null => {
    if (!storageClient) return null;
    return onSnapshot(
      doc(
        storageClient,
        collection,
        id,
      ),
      (snapshot) => callback(snapshot.exists() ? (snapshot.data() as T) : null),
      (error) => callback(null, error.message),
    );
  },

  write: async <T extends object>(collection: string, id: string, data: T): Promise<void> => {
    if (!storageClient) return;
    await setDoc(doc(
      storageClient,
      collection,
      id,
    ), data);
  },
});

export default createDataClient;
