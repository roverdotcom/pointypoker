import {
  BoardOption,
  IssueDetail,
  SprintOption,
} from '@v4/types/jira';

/**
 * Pure mappers from jira.js / fixture response shapes to v4 DTOs. No React, no
 * store. The minimal `Raw*` shapes keep the mapping honest without importing SDK
 * model types.
 */
export type RawBoard = {
  id?: number;
  name?: string;
};

export type RawSprint = {
  id?: number;
  name?: string;
  state?: string;
};

export type RawIssueSprint = {
  goal?: string;
  id?: number;
  name?: string;
  originBoardId?: number;
  state?: string;
};

export type RawIssueType = {
  avatarId?: number;
  iconUrl?: string;
  id?: string;
  name?: string;
};

export type RawIssue = {
  key?: string;
  fields?: {
    issuetype?: RawIssueType;
    sprint?: RawIssueSprint;
    summary?: string;
  };
};

export const toBoardOption = (board: RawBoard): BoardOption => ({
  id: board.id ?? 0,
  name: board.name ?? '',
});

export const toSprintOption = (sprint: RawSprint): SprintOption => ({
  id: sprint.id ?? 0,
  name: sprint.name ?? '',
  state: sprint.state,
});

export const toIssueDetail = (issue: RawIssue, baseUrl: string): IssueDetail => {
  const fields = issue.fields ?? {};
  const issueType = fields.issuetype ?? {};
  const key = issue.key ?? '';
  const sprint = fields.sprint;

  return {
    iconUrl: issueType.iconUrl,
    isParent: (issueType.name ?? '').toLowerCase() === 'epic',
    key,
    sprint: sprint
      ? {
        goal: sprint.goal,
        id: sprint.id ?? 0,
        name: sprint.name ?? '',
        originBoardId: sprint.originBoardId,
        state: sprint.state,
      }
      : undefined,
    summary: fields.summary ?? key,
    type: {
      avatarId: issueType.avatarId,
      iconUrl: issueType.iconUrl,
      id: issueType.id ?? '',
      name: issueType.name ?? '',
    },
    url: baseUrl ? `${baseUrl}/browse/${key}` : undefined,
  };
};
