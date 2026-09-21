import { BoardType } from '@v4/types/jira';
import { QueuedTicket, Ticket } from '@yappy/types/legacy/room';

/**
 * Auth
 */
export type InitialAuth = {
  code: string;
  redirect_uri: string;
};

export type RefreshAuth = {
  refresh_token: string;
};

export type JiraAuthPayload = {
  grant_type: string;
  client_id: string;
  client_secret: string;
} & (InitialAuth | RefreshAuth);

export type JiraAuthData = {
  access_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  refresh_token: string;
  scope: string;
};

export type JiraResourceData = {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
};

/**
 * Boards
 */
export type JiraBoardPayloadValue = {
  id: number;
  name: string;
  self: string;
  type?: BoardType;
};

export type JiraBoard = {
  id: number;
  name: string;
  apiUrl: string;
};

export type JiraBoardConfig = {
  estimation?: {
    field: {
      displayName: string;
      fieldId: string;
    };
    type: string;
  };
  name: string;
  id: number;
  type?: string;
};

/**
 * Fields
 */
export type JiraFieldPayload = {
  id: string;
  name: string;
  clauseNames: string[];
  scope?: {
    type: string;
    project?: {
      id: string;
    }
  },
  schema: {
    type: string;
  }
};

export type JiraField = {
  id: string;
  name: string;
};

/**
 * Issues
 */
type IssueType = {
  avatarId: number;
  description: string;
  iconUrl: string;
  id: string;
  name: string;
  icon: {
    contentType: string;
    blobData: string;
  }
};

export type JiraIssueSearchPayload = {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: {
    [key: string]: any;
    sprint: JiraSprint;
    issuetype: IssueType;
    summary: string;
  }
};

// Issues are tickets from Jira's API.
// Tickets are issues that are in this app's context.
type JiraTicketBase = {
  url: string;
  sprint: JiraSprint;
  estimationFieldId: string;
  type: IssueType
  wasPointed?: boolean;
  currentBoardId?: number;
};

// A ticket from Jira in the queue prior to pointing
export type QueuedJiraTicket = QueuedTicket & JiraTicketBase;

// A ticket from Jira in the queue during or after pointing
export type JiraTicketFromQueue = Ticket & QueuedJiraTicket;

// A ticket from Jira that was not previously in the queue
export type JiraTicket = Ticket & JiraTicketBase;

/**
 * Sprints
 */
export type JiraSprint = {
  id: number,
  self: string,
  state: string,
  name: string,
  originBoardId: number,
  goal: string
};

export type JiraSprintWithIssues = JiraSprint & {
  issues?: JiraIssueSearchPayload[];
};

/**
 * Other Data
 */
export type BasePayload = {
  maxResults: number;
  startAt: number;
  isLast: boolean;
  total: number;
};

export type JiraDataPayload = BasePayload & {
  values: JiraBoardPayloadValue[] | JiraSprint[]
};

export type JiraIssuesDataPayload = BasePayload & {
  issues: JiraIssueSearchPayload[]
};

export type JiraPreferences = {
  defaultBoard?: JiraBoardPayloadValue | null;
  pointField?: JiraField | null;
};
