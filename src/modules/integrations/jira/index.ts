import { useCallback } from 'react';

import { useAuthorizedUser } from '@modules/user';
import { ROUTE_PATHS } from '@routes/constants';
import createApiClient, { getJiraApiClient } from '@utils/axios';
import { getLegacyFixtures } from '@utils/jiraFixtures';
import { blobToBase64 } from '@utils/room';
import useStore from '@utils/store';

import {
  InitialAuth,
  JiraAuthData,
  JiraAuthPayload,
  JiraBoardConfig,
  JiraDataPayload,
  JiraField,
  JiraFieldPayload,
  JiraIssuesDataPayload,
  JiraIssueSearchPayload,
  RefreshAuth,
} from './types';
import {
  ATLASSIAN_URL,
  buildUrl,
  JIRA_SUBDOMAINS,
  URL_ACTIONS,
} from './utils';

/**
 * Jira service
 *
 * Methods:
 * - Get issue detail
 * - Assign points to issue
 * - Batch assign points to issues
 */

const API_URL = `https://${ JIRA_SUBDOMAINS.API }.${ ATLASSIAN_URL }`;

const useJira = () => {
  const { userId } = useAuthorizedUser();
  const {
    access,
    isConnected,
    isConfigured,
    isExpired,
    resources,
    setAccess,
    useFixtures,
    fixtureScenario,
  } = useStore(({ preferences, setPreference }) => {
    const {
      jiraAccess,
      jiraResources,
      jiraPreferences,
      useJiraFixtures,
      jiraFixtureScenario,
    } = preferences;
    return {
      access: jiraAccess,
      fixtureScenario: jiraFixtureScenario,
      // Fixture mode takes precedence over token state without clearing tokens.
      isConfigured: !!useJiraFixtures || (!!jiraAccess && !!jiraResources && !!jiraPreferences?.defaultBoard),
      isConnected: !!useJiraFixtures || (!!jiraAccess && !!jiraResources),
      isExpired: Date.now() >= (preferences?.jiraAccess?.expires_at ?? 0),
      resources: jiraResources,
      setAccess: (access: JiraAuthData) => setPreference('jiraAccess', access),
      useFixtures: !!useJiraFixtures,
    };
  });

  const fixtures = useFixtures ? getLegacyFixtures(fixtureScenario) : null;

  const buildJiraUrl = (ticketKey: string) => `${resources?.url ?? ''}/browse/${ticketKey}`;

  /**
   * Auth methods
   */

  /**
   * Kicks off the OAuth flow for Jira by opening a new window to JIRA's OAuth page
   */
  const launchJiraOAuth = () => {
    if (!userId) return;

    const options = {
      height: 1000,
      location: 'no',
      menubar: 'no',
      resizable: 'yes',
      scrollbars: 'yes',
      status: 'no',
      toolbar: 'no',
      width: 800,
    };

    const optionsString = Object.entries(options).map(([key, value]) => `${key}=${value}`).join(', ');

    const url = buildUrl(URL_ACTIONS.AUTHORIZE, { userId });

    return window.open(
      url,
      'targetWindow',
      optionsString,
    );
  };

  /**
   * Calls the Jira auth API to get an access token.
   *
   * @param authorization the authorization or refresh code to get the access token
   * @param isRefresh whether or not we are passing a refresh token. Required by the Jira API.
   * @returns Axios API Client
   */
  const getAccessTokenFromApi = async (authorization: string, isRefresh = false) => {
    const url = `https://${JIRA_SUBDOMAINS.AUTH}.${ATLASSIAN_URL}`;
    const data: Partial<JiraAuthPayload> = {
      client_id: import.meta.env.VITE_JIRA_CLIENT_ID,
      client_secret: import.meta.env.VITE_JIRA_CLIENT_SECRET,
      grant_type: isRefresh ? 'refresh_token' : 'authorization_code',
    };

    if (!isRefresh) {
      (data as InitialAuth).code = authorization;
      (data as InitialAuth).redirect_uri = `${ window.location.origin }${ ROUTE_PATHS.JIRA_REDIRECT }`;
    } else {
      (data as RefreshAuth).refresh_token = authorization;
    }

    const accessClient = createApiClient({
      baseURL: url,
      headers: { 'Content-Type': 'application/json' },
    });

    try {
      const response = await accessClient.post(`/${URL_ACTIONS.OAUTH}`, data);
      return response.data;
    } catch (error) {

      // @ts-expect-error - Jira's error response is not typed, so we have to ignore it
      throw new Error(error);
    }
  };

  const getJiraAccessToken = useCallback(async (authorizationCode?: string | null) => {
    let finalToken = authorizationCode;
    let isRefresh = false;

    if (access && !finalToken) {
      if (!isExpired) {
        return access.access_token;
      } else {
        isRefresh = true;
        finalToken = access.refresh_token;
      }
    }

    if (finalToken) {
      const response = await getAccessTokenFromApi(finalToken, isRefresh);
      response.expires_at = Date.now() + response.expires_in * 1000;
      setAccess(response);

      return response.access_token;
    }

    return null;
  }, [
    access,
    isExpired,
    setAccess,
  ]);

  const getAccessibleResources = useCallback(async (code?: string | null) => {
    if (useFixtures) {
      return getLegacyFixtures(fixtureScenario).getAccessibleResources();
    }

    const finalAccessToken = code;

    const accessToken = await getJiraAccessToken(finalAccessToken);
    if (accessToken) {
      const client = getJiraApiClient(API_URL, accessToken);

      return client
        .get(`/${URL_ACTIONS.GET_RESOURCES}`)
        .then((res) => {
          if (res.data.length === 0) {
            throw new Error('No resources found');
          }
          return res.data[ 0 ];
        })
        .catch((error) => {
          throw new Error(error);
        });
    }
  }, [
    getJiraAccessToken,
    useFixtures,
    fixtureScenario,
  ]);

  /**
   * Query methods
  */

  const getBoards = async (maxResults = 25, name?: string) => {
    if (fixtures) return fixtures.getBoards(maxResults, name);

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const path = buildUrl(URL_ACTIONS.GET_BOARDS, { resourceId: resources?.id });

    return client({
      method: 'GET',
      params: {
        maxResults,
        name,
        orderBy: 'name',
      },
      url: path,
    })
      .then((res): JiraDataPayload => res.data)
      .catch((error) => {
        throw new Error(error);
      });
  };

  const getBoardConfiguration = async (boardId: string | number) => {
    if (fixtures) return fixtures.getBoardConfiguration(boardId);

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const path = buildUrl(URL_ACTIONS.GET_BOARD_CONFIGURATION, {
      boardId,
      resourceId: resources?.id,
    });

    return client({
      method: 'GET',
      url: path,
    })
      .then((res): JiraBoardConfig => res.data)
      .catch((error) => {
        throw new Error(error);
      });
  };

  const getIssueFields = async () => {
    if (fixtures) return fixtures.getIssueFields();

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const path = buildUrl(URL_ACTIONS.GET_FIELDS, { resourceId: resources?.id });

    return client({
      method: 'GET',
      params: { orderBy: 'name' },
      url: path,
    })
      .then((res): JiraFieldPayload[] => res.data)
      .catch((error) => {
        throw new Error(error);
      });
  };

  const getSprintsForBoard = async (boardId: string | number, startAt = 0) => {
    if (fixtures) return fixtures.getSprintsForBoard(boardId, startAt);

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const path = buildUrl(URL_ACTIONS.GET_SPRINTS, {
      boardId,
      resourceId: resources?.id,
    });

    return client({
      method: 'GET',
      params: {
        startAt,
        state: 'future',
      },
      url: path,
    })
      .then((res): JiraDataPayload => res.data)
      .catch((error) => {
        throw new Error(error);
      });
  };

  const getIssuesForBoard = async (
    boardId: string | number,
    pointField?: JiraField | null,
    startAt = 0,
  ) => {
    if (fixtures) return fixtures.getIssuesForBoard(
      boardId,
      pointField,
      startAt,
    );

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const path = buildUrl(URL_ACTIONS.GET_ISSUES_NO_JQL, {
      boardId,
      resourceId: resources?.id,
    });

    const fields = [
      'id',
      'key',
      'sprint',
      'summary',
      'issuetype',
      'components',
      'team',
    ];
    let jql = 'Sprint IN futureSprints() AND resolution IS EMPTY';

    if (pointField) {
      jql += ` AND ${ pointField.name } = EMPTY`;
      fields.push(pointField.id);
    }

    return client({
      method: 'GET',
      params: {
        fields: fields.join(','),
        jql,
        maxResults: 100,
        startAt,
      },
      url: path,
    })
      .then((res): JiraIssuesDataPayload => res.data)
      .catch((error) => {
        throw new Error(error);
      });
  };

  const getIssueDetail = async (key: string, pointField?: JiraField | null) => {
    if (fixtures) return fixtures.getIssueDetail(key);

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const path = buildUrl(URL_ACTIONS.ISSUE, {
      issueId: key,
      resourceId: resources?.id,
    });

    const fields = [
      'id',
      'key',
      'sprint',
      'summary',
      'issuetype',
      'components',
      'team',
    ];

    if (pointField) {
      fields.push(pointField.id);
    }

    return client({
      method: 'GET',
      params: { fields: fields.join(',') },
      url: path,
    })
      .then((res): JiraIssueSearchPayload => res.data)
      .catch((error) => {
        throw new Error(error);
      });
  };

  const getAvatars = async (avatarData: { [key: string]: number }) => {
    if (fixtures) return fixtures.getAvatars(avatarData);

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const promises = Object.entries(avatarData).map(([issueType, avatarId]) => {
      const path = buildUrl(URL_ACTIONS.GET_AVATAR, {
        avatarId,
        resourceId: resources?.id,
      });

      return client({
        method: 'GET',
        params: { size: 'large' },
        responseType: 'blob',
        url: path,
      })
        .then(async (res) => {
          const base64Data = await blobToBase64(res.data);
          return {
            blobData: base64Data,
            contentType: res.data.type,
          };
        })
        .then((data) => ({ [ issueType ]: { ...data } }))
        .catch((error) => {
          throw new Error(error);
        });
    });

    // Combine all promises into a single object
    return Promise.all(promises)
      .then((results) => results.reduce((acc, curr) => ({
        ...acc,
        ...curr,
      }), {}));
  };

  const getPointFieldFromBoardId = async (boardId: number) => {
    try {
      const boardConfig = await getBoardConfiguration(boardId);
      const issueFields = await getIssueFields();
      const estimationField = issueFields.find((field) => field.id === boardConfig.estimation?.field?.fieldId);

      if (estimationField) {
        return ({
          id: estimationField.id,
          name: estimationField.name,
        });
      }
    } catch (error) {
      console.error('WHOOPS', error);
    }
  };

  const writePointValue = async (
    issue: string,
    value: number,
    fieldId: string,
  ) => {
    if (fixtures) return fixtures.writePointValue();

    const accessToken = await getJiraAccessToken();
    const client = getJiraApiClient(API_URL, accessToken);
    const path = buildUrl(URL_ACTIONS.ISSUE, {
      issueId: issue,
      resourceId: resources?.id,
    });

    return client({
      data: { fields: { [ fieldId ]: value } },
      method: 'PUT',
      url: path,
    })
      .then((res) => res.data)
      .catch((error) => {
        throw new Error(error);
      });
  };

  return {
    buildJiraUrl,
    getAccessibleResources,
    getAccessTokenFromApi,
    getAvatars,
    getBoardConfiguration,
    getBoards,
    getIssueDetail,
    getIssueFields,
    getIssuesForBoard,
    getPointFieldFromBoardId,
    getSprintsForBoard,
    isConfigured,
    isConnected,
    jiraAccessibleResources: resources,
    launchJiraOAuth,
    writePointValue,
  };
};

export default useJira;
