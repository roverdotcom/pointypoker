import { useContext } from 'react';

import { type DataClient } from '@v4/api/core/firebase/firestore';
import { Context as DataContext } from '@v4/api/providers/data-provider';

const useData = (): DataClient => {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
};

export default useData;
