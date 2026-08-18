import {
  createContext,
  useMemo,
  type JSX,
  type PropsWithChildren,
} from 'react';

import createDataClient, { type DataClient } from '@v4/api/core/firebase/firestore';
import useFirebase from '@v4/api/hooks/use-firebase';

export const Context = createContext<DataClient | null>(null);

const DataProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const { storageClient } = useFirebase();

  const client = useMemo<DataClient>(() => createDataClient(storageClient),[storageClient]);

  return (
    <Context.Provider value={client}>
      {children}
    </Context.Provider>
  );
};

export default DataProvider;
