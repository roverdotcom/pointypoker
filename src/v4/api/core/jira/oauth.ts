import axios from 'axios';

import { JiraAuthData } from '@modules/integrations/jira/types';
import { ROUTE_PATHS } from '@routes/constants';

const AUTH_URL = 'https://auth.atlassian.com';
const TOKEN_PATH = '/oauth/token';

type TokenRequestBase = {
  client_id: string;
  client_secret: string;
  grant_type: string;
};

type InitialTokenRequest = TokenRequestBase & {
  code: string;
  redirect_uri: string;
};

type RefreshTokenRequest = TokenRequestBase & {
  refresh_token: string;
};

/**
 * Exchanges an authorization code or refresh token for a new access token.
 * Atlassian uses rotating refresh tokens — always store the returned refresh_token.
 *
 * @todo Find a secrets solution
 */
const exchangeToken = async (authorization: string,isRefresh = false): Promise<JiraAuthData> => {
  const base: TokenRequestBase = {
    client_id: import.meta.env.VITE_JIRA_CLIENT_ID,
    client_secret: import.meta.env.VITE_JIRA_CLIENT_SECRET,
    grant_type: isRefresh ? 'refresh_token' : 'authorization_code',
  };

  const payload: InitialTokenRequest | RefreshTokenRequest = isRefresh
    ? {
      ...base,
      refresh_token: authorization,
    }
    : {
      ...base,
      code: authorization,
      redirect_uri: `${window.location.origin}${ROUTE_PATHS.JIRA_REDIRECT}`,
    };

  const response = await axios.post<JiraAuthData>(
    `${AUTH_URL}${TOKEN_PATH}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } },
  );

  return {
    ...response.data,
    expires_at: Date.now() + response.data.expires_in * 1000,
  };
};

export { exchangeToken };
