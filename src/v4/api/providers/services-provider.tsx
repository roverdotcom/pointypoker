import { ReactNode } from 'react';

import AuthProvider from './auth-provider';
import DataProvider from './data-provider';
import FirebaseProvider from './firebase-provider';
import JiraProvider from './jira-provider';

const ServicesProvider = ({ children }: { children: ReactNode }) => (
  <FirebaseProvider>
    <DataProvider>
      <AuthProvider>
        <JiraProvider>
          {children}
        </JiraProvider>
      </AuthProvider>
    </DataProvider>
  </FirebaseProvider>
);

export default ServicesProvider;
