import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { JiraAuthData } from '@modules/integrations/jira/types';
import useStore from '@utils/store';
import JiraClient from '@v4/api/core/jira/client';
import { exchangeToken } from '@v4/api/core/jira/oauth';

type JiraContextValue = {
  client: JiraClient | null;
  isConfigured: boolean;
  isConnected: boolean;
};

const JiraContext = createContext<JiraContextValue | null>(null);

const useJiraContext = (): JiraContextValue => {
  const context = useContext(JiraContext);

  if (!context) {
    throw new Error('useJiraContext must be used within a JiraProvider');
  }

  return context;
};

const JiraProvider = ({ children }: { children: ReactNode }) => {
  const {
    jiraAccess,
    jiraPreferences,
    jiraResources,
    setAccess,
    useFixtures,
  } = useStore(({ preferences, setPreference }) => ({
    jiraAccess: preferences.jiraAccess,
    jiraPreferences: preferences.jiraPreferences,
    jiraResources: preferences.jiraResources,
    setAccess: (access: JiraAuthData) => setPreference('jiraAccess', access),
    useFixtures: !!preferences.useJiraFixtures,
  }));

  const isRefreshing = useRef(false);

  // Refresh expired token before building the client
  useEffect(() => {
    if (!jiraAccess || isRefreshing.current) return;
    const now = Date.now();
    if (now < jiraAccess.expires_at) return;

    isRefreshing.current = true;
    exchangeToken(jiraAccess.refresh_token, true)
      .then(setAccess)
      .catch(console.error)
      .finally(() => {
        isRefreshing.current = false;
      });
  }, [jiraAccess, setAccess]);

  const client = useMemo(() => {
    if (!jiraAccess || !jiraResources) return null;

    const host = `https://api.atlassian.com/ex/jira/${jiraResources.id}`;
    return new JiraClient({
      authentication: { oauth2: { accessToken: jiraAccess.access_token } },
      host,
    });
  }, [jiraAccess, jiraResources]);

  const value: JiraContextValue = useMemo(() => ({
    client,
    // Fixture mode reports connected/configured even when no real client exists.
    isConfigured: useFixtures || (!!client && !!jiraPreferences?.defaultBoard),
    isConnected: useFixtures || !!client,
  }), [
    client,
    jiraPreferences?.defaultBoard,
    useFixtures,
  ]);

  return (
    <JiraContext.Provider value={value}>
      {children}
    </JiraContext.Provider>
  );
};

export { useJiraContext };
export default JiraProvider;
