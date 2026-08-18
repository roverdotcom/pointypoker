import { useCallback } from 'react';

import {
  JiraAuthData,
  JiraResourceData,
} from '@modules/integrations/jira/types';
import { ROUTE_PATHS } from '@routes/constants';
import { getJiraJsFixtures } from '@utils/jiraFixtures';
import useStore from '@utils/store';
import {
  toBoardOption,
  toIssueDetail,
  toSprintOption,
  type RawBoard,
  type RawIssue,
  type RawSprint,
} from '@v4/api/core/jira/mappers';
import { exchangeToken } from '@v4/api/core/jira/oauth';
import { useJiraContext } from '@v4/api/providers/jira-provider';
import {
  BoardOption,
  ImportableIssue,
  IssueDetail,
  PointField,
  SprintOption,
} from '@v4/types/jira';

const ATLASSIAN_API_URL = 'https://api.atlassian.com';

const useJira = () => {
  const {
    client,
    isConnected,
    isConfigured,
  } = useJiraContext();
  const {
    jiraResources,
    userId,
    setJiraAccess,
    setJiraResources,
    useFixtures,
    fixtureScenario,
  } = useStore(({ preferences, setPreference }) => ({
    fixtureScenario: preferences.jiraFixtureScenario,
    jiraResources: preferences.jiraResources,
    setJiraAccess: (access: JiraAuthData | null) => setPreference('jiraAccess', access),
    setJiraResources: (resources: JiraResourceData | null) => setPreference('jiraResources', resources),
    useFixtures: !!preferences.useJiraFixtures,
    userId: preferences.user?.id ?? null,
  }));

  const baseUrl = jiraResources?.url ?? '';

  const buildJiraUrl = useCallback((ticketKey: string) => `${baseUrl}/browse/${ticketKey}`, [baseUrl]);

  /**
   * Auth
   */

  const launchOAuth = useCallback(() => {
    if (!userId) return;

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: import.meta.env.VITE_JIRA_CLIENT_ID,
      prompt: 'consent',
      redirect_uri: `${window.location.origin}${ROUTE_PATHS.JIRA_REDIRECT}`,
      response_type: 'code',
      scope: [
        'offline_access', // Requests a refresh token with auth
        'read:board-scope.admin:jira-software', // board config
        'read:board-scope:jira-software', // boards, board issues
        'read:issue:jira-software', // issue
        'read:issue-details:jira', // board issues
        'read:project:jira', // boards, board config, fields
        'read:sprint:jira-software', // board sprints
        'read:jira-work', // fields
        'write:jira-work', // issue update
        'manage:jira-configuration', // enables icon fetching
      ].join(' '),
      state: userId,
    });

    const features = 'width=800,height=1000,scrollbars=yes,resizable=yes';
    window.open(
      `https://auth.atlassian.com/authorize?${params}`,
      'targetWindow',
      features,
    );
  }, [userId]);

  const connectWithCode = useCallback(async (code: string) => {
    const tokenData = await exchangeToken(code, false);

    // Fetch accessible resources before persisting anything to avoid half-connected state
    const resourcesUrl = `${ATLASSIAN_API_URL}/oauth/token/accessible-resources`;
    const response = await fetch(resourcesUrl, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });

    if (!response.ok) throw new Error('Failed to fetch accessible resources');

    const resources = await response.json();
    if (!resources.length) throw new Error('No Jira resources found');

    // Only persist once both token and resources are validated
    setJiraAccess(tokenData);
    setJiraResources(resources[0]);
  }, [setJiraAccess, setJiraResources]);

  const revokeAccess = useCallback(() => {
    setJiraAccess(null);
    setJiraResources(null);
  }, [setJiraAccess, setJiraResources]);

  /**
   * Internal helpers (SDK/fixture shapes stay inside the hook)
   */

  const getBoardConfiguration = useCallback(async (boardId: number) => {
    if (useFixtures) return getJiraJsFixtures(fixtureScenario).getBoardConfiguration(boardId);
    if (!client) throw new Error('Jira client not initialized');

    return client.agile.board.getConfiguration({ boardId });
  }, [
    client,
    useFixtures,
    fixtureScenario,
  ]);

  const getIssueFields = useCallback(async () => {
    if (useFixtures) return getJiraJsFixtures(fixtureScenario).getIssueFields();
    if (!client) throw new Error('Jira client not initialized');

    return client.v3.fields.getFields();
  }, [
    client,
    useFixtures,
    fixtureScenario,
  ]);

  /**
   * Data fetching — returns V4 DTOs, never SDK/legacy shapes.
   */

  const getBoards = useCallback(async (maxResults = 25, name?: string): Promise<BoardOption[]> => {
    const result = useFixtures
      ? await getJiraJsFixtures(fixtureScenario).getBoards(maxResults, name)
      : await (client
        ? client.agile.board.getAllBoards({
          maxResults,
          name,
        })
        : Promise.reject(new Error('Jira client not initialized')));

    return (result.values ?? []).map((board) => toBoardOption(board as RawBoard));
  }, [
    client,
    useFixtures,
    fixtureScenario,
  ]);

  const getSprintsForBoard = useCallback(async (boardId: number, startAt = 0): Promise<SprintOption[]> => {
    const result = useFixtures
      ? await getJiraJsFixtures(fixtureScenario).getSprintsForBoard(boardId, startAt)
      : await (client
        ? client.agile.board.getAllSprints({
          boardId,
          startAt,
          state: 'future',
        })
        : Promise.reject(new Error('Jira client not initialized')));

    return (result.values ?? []).map((sprint) => toSprintOption(sprint as RawSprint));
  }, [
    client,
    useFixtures,
    fixtureScenario,
  ]);

  const getIssuesForBoard = useCallback(async (
    boardId: number,
    pointField?: PointField | null,
    startAt = 0,
  ): Promise<ImportableIssue[]> => {
    if (useFixtures) {
      const result = await getJiraJsFixtures(fixtureScenario).getIssuesForBoard(
        boardId,
        pointField,
        startAt,
      );
      return (result.issues ?? []).map((issue) => toIssueDetail(issue as RawIssue, baseUrl));
    }

    if (!client) throw new Error('Jira client not initialized');

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
      jql += ` AND ${pointField.name} = EMPTY`;
      fields.push(pointField.id);
    }

    const result = await client.agile.board.getIssuesForBoard({
      boardId,
      fields,
      jql,
      maxResults: 100,
      startAt,
    });

    return (result.issues ?? []).map((issue) => toIssueDetail(issue as RawIssue, baseUrl));
  }, [
    client,
    baseUrl,
    useFixtures,
    fixtureScenario,
  ]);

  const getIssueDetail = useCallback(async (key: string,pointField?: PointField | null): Promise<IssueDetail> => {
    if (useFixtures) {
      const issue = await getJiraJsFixtures(fixtureScenario).getIssueDetail(key);
      return toIssueDetail(issue as RawIssue, baseUrl);
    }

    if (!client) throw new Error('Jira client not initialized');

    const fields = [
      'id',
      'key',
      'sprint',
      'summary',
      'issuetype',
      'components',
      'team',
    ];
    if (pointField) fields.push(pointField.id);

    const issue = await client.v3.issues.getIssue({
      fields,
      issueIdOrKey: key,
    });

    return toIssueDetail(issue as RawIssue, baseUrl);
  }, [
    client,
    baseUrl,
    useFixtures,
    fixtureScenario,
  ]);

  const getPointFieldFromBoardId = useCallback(async (boardId: number): Promise<PointField | undefined> => {
    const [config, fields] = await Promise.all([getBoardConfiguration(boardId), getIssueFields()]);

    const estimationFieldId = config.estimation?.field?.fieldId;
    const match = (fields as PointField[]).find((field) => field.id === estimationFieldId);

    if (!match) return undefined;

    return {
      id: match.id,
      name: match.name,
    };
  }, [getBoardConfiguration, getIssueFields]);

  /**
   * Write
   */

  const writePointValue = useCallback(async (
    issueKey: string,
    value: number,
    fieldId: string,
  ) => {
    if (useFixtures) return getJiraJsFixtures(fixtureScenario).writePointValue();
    if (!client) throw new Error('Jira client not initialized');

    return client.v3.issues.editIssue({
      fields: { [fieldId]: value },
      issueIdOrKey: issueKey,
    });
  }, [
    client,
    useFixtures,
    fixtureScenario,
  ]);

  return {
    buildJiraUrl,
    connectWithCode,
    getBoards,
    getIssueDetail,
    getIssuesForBoard,
    getPointFieldFromBoardId,
    getSprintsForBoard,
    isConfigured,
    isConnected,
    launchOAuth,
    revokeAccess,
    writePointValue,
  };
};

export default useJira;
