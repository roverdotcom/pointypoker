import { ROUTE_PATHS } from '@routes/constants';

type UrlOptions = {
  avatarId?: number;
  boardId?: string | number;
  issueId?: string;
  resourceId?: string;
  userId?: string;
};

export const ATLASSIAN_URL = 'atlassian.com';

const JIRA_PRE_PATH = '/ex/jira';

enum API_SPACE {
  AGILE_1 = 'rest/agile/1.0',
  API_2 = 'rest/api/2',
}

export enum URL_ACTIONS {
  // OAUTH
  AUTHORIZE = 'authorize',
  OAUTH = 'oauth/token',
  GET_RESOURCES = 'oauth/token/accessible-resources',

  // JIRA AGILE API
  GET_BOARDS = 'get-boards',
  GET_BOARD_CONFIGURATION = 'get-board-configuration',
  GET_SPRINTS = 'get-sprints',
  GET_ISSUES_NO_JQL = 'get-issues-no-jql',
  GET_BACKLOG = 'get-backlog',

  // JIRA API V2
  GET_FIELDS = 'get-fields',
  ISSUE = 'issue',
  GET_AVATAR = 'get-avatar',
}

export enum JIRA_SUBDOMAINS {
  API = 'api',
  AUTH = 'auth',
}

export const jiraPermissionScopes = [
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
];

const buildUrl = (action: URL_ACTIONS, options?: UrlOptions) => {
  const {
    avatarId,
    boardId,
    issueId,
    resourceId,
    userId,
  } = options || {};
  let url = '';

  switch (action) {
  // OAUTH
    case URL_ACTIONS.AUTHORIZE: {
      if (!userId) {
        throw new Error('User ID is required for this action');
      }

      const params = new URLSearchParams({
        audience: `${JIRA_SUBDOMAINS.API}.${ATLASSIAN_URL}`,
        client_id: import.meta.env.VITE_JIRA_CLIENT_ID,
        prompt: 'consent',
        redirect_uri: `${window.location.origin}${ROUTE_PATHS.JIRA_REDIRECT}`,
        response_type: 'code',
        scope: jiraPermissionScopes.join(' '),
        state: userId,
      });

      url = `https://${JIRA_SUBDOMAINS.AUTH}.${ATLASSIAN_URL}/${URL_ACTIONS.AUTHORIZE}?${params.toString()}`;
      break;
    }
    case URL_ACTIONS.OAUTH:
      url = `https://${JIRA_SUBDOMAINS.AUTH}.${ATLASSIAN_URL}/${URL_ACTIONS.OAUTH}`;
      break;
    case URL_ACTIONS.GET_RESOURCES:
      url = `https://${JIRA_SUBDOMAINS.API}.${ATLASSIAN_URL}/${URL_ACTIONS.GET_RESOURCES}`;
      break;

    // JIRA AGILE API
    case URL_ACTIONS.GET_BOARDS:
      url = `${JIRA_PRE_PATH}/${resourceId}/${API_SPACE.AGILE_1}/board`;
      break;
    case URL_ACTIONS.GET_BOARD_CONFIGURATION:
      url = `${JIRA_PRE_PATH}/${resourceId}/${API_SPACE.AGILE_1}/board/${boardId}/configuration`;
      break;
    case URL_ACTIONS.GET_SPRINTS:
      url = `${JIRA_PRE_PATH}/${resourceId}/${API_SPACE.AGILE_1}/board/${boardId}/sprint`;
      break;
    case URL_ACTIONS.GET_ISSUES_NO_JQL:
      url = `${JIRA_PRE_PATH}/${resourceId}/${API_SPACE.AGILE_1}/board/${boardId}/issue`;
      break;
    case URL_ACTIONS.GET_BACKLOG:
      url = `${JIRA_PRE_PATH}/${resourceId}/${API_SPACE.AGILE_1}/board/${boardId}/backlog`;
      break;

    // JIRA API V2
    case URL_ACTIONS.GET_FIELDS:
      url = `${JIRA_PRE_PATH}/${resourceId}/${API_SPACE.API_2}/field`;
      break;
    case URL_ACTIONS.ISSUE:
      url = `${JIRA_PRE_PATH}/${resourceId}/${API_SPACE.API_2}/issue/${issueId}`;
      break;
    case URL_ACTIONS.GET_AVATAR:
      url = `${ JIRA_PRE_PATH }/${ resourceId }/${ API_SPACE.API_2 }/universal_avatar/view/type/issuetype/avatar/${avatarId}`;
      break;
    default:
      return '';
  }

  return url;
};

export { buildUrl };
