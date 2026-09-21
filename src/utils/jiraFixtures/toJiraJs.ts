import { AgileModels } from 'jira.js/agile';
import { Version3Models } from 'jira.js/version3';

import { JiraField } from '@modules/integrations/jira/types';

import {
  FixtureIssue,
  FixtureSeed,
  FixtureSprint,
  resolveIssue,
  resolvePointField,
} from './scenarios';

/**
 * Adapters mapping a shape-neutral `FixtureSeed` into the `jira.js` SDK return
 * types consumed by the v4 hook. Objects are built to be structurally faithful
 * and cast to the SDK model types (whose deep shapes are almost entirely
 * optional), so fixtures satisfy the same contracts as real client calls.
 */

const toSprint = (sprint: FixtureSprint): AgileModels.Sprint => ({
  goal: sprint.goal,
  id: sprint.id,
  name: sprint.name,
  originBoardId: sprint.originBoardId,
  self: `https://api.atlassian.com/rest/agile/1.0/sprint/${sprint.id}`,
  state: sprint.state,
});

const toIssueFields = (seed: FixtureSeed, issue: FixtureIssue) => {
  const sprint = issue.sprintId === null
    ? undefined
    : seed.sprints.find((s) => s.id === issue.sprintId);
  const pointField = resolvePointField(seed);

  const fields: Record<string, unknown> = {
    issuetype: {
      avatarId: issue.issueType.avatarId,
      description: issue.issueType.description,
      iconUrl: issue.issueType.iconUrl,
      id: issue.issueType.id,
      name: issue.issueType.name,
      subtask: false,
    },
    ...(sprint ? { sprint: toSprint(sprint) } : {}),
    summary: issue.summary,
  };

  if (pointField) {
    fields[pointField.id] = issue.points;
  }

  return fields;
};

const toAgileIssue = (seed: FixtureSeed, issue: FixtureIssue) => ({
  fields: toIssueFields(seed, issue),
  id: issue.id,
  key: issue.key,
  self: `https://api.atlassian.com/rest/agile/1.0/issue/${issue.id}`,
});

export const buildJiraJsFixtures = (seed: FixtureSeed) => ({
  getBacklogForBoard: async (
    boardId: number,
    pointField?: JiraField | null,
    startAt = 0,
  ): Promise<AgileModels.SearchResults> => {
    const board = seed.boards.find((b) => b.id === Number(boardId));
    const backlog = board?.hasBacklog === false
      ? []
      : seed.issues.filter((issue) => issue.sprintId === null);
    const issues = pointField
      ? backlog.filter((issue) => issue.points === null)
      : backlog;
    const maxResults = 100;

    return {
      expand: 'schema,names',
      issues: issues
        .slice(startAt, startAt + maxResults)
        .map((issue) => toAgileIssue(seed, issue)) as AgileModels.SearchResults['issues'],
      maxResults,
      startAt,
      total: issues.length,
    };
  },

  getBoardConfiguration: async (boardId: number): Promise<AgileModels.GetConfiguration> => ({
    ...(seed.estimationFieldId
      ? {
        estimation: {
          field: {
            displayName: resolvePointField(seed)?.name ?? 'Story Points',
            fieldId: seed.estimationFieldId,
          },
          type: 'field',
        },
      }
      : {}),
    id: Number(boardId),
    name: seed.boards.find((b) => b.id === Number(boardId))?.name ?? 'Fixture Board',
    self: `https://api.atlassian.com/rest/agile/1.0/board/${boardId}/configuration`,
    type: seed.boards.find((b) => b.id === Number(boardId))?.type ?? 'scrum',
  }),

  getBoards: async (maxResults = 25, name?: string): Promise<AgileModels.GetAllBoards> => {
    const filtered = name
      ? seed.boards.filter((b) => b.name.toLowerCase().includes(name.toLowerCase()))
      : seed.boards;
    const page = filtered.slice(0, maxResults);

    return {
      isLast: true,
      maxResults,
      startAt: 0,
      total: filtered.length,
      values: page.map((board) => ({
        id: board.id,
        name: board.name,
        self: `https://api.atlassian.com/rest/agile/1.0/board/${board.id}`,
        type: board.type,
      })) as AgileModels.Board[],
    };
  },

  getIssueDetail: async (key: string): Promise<Version3Models.Issue> => {
    const issue = resolveIssue(seed, key);
    return {
      fields: toIssueFields(seed, issue),
      id: issue.id,
      key: issue.key,
      self: `https://api.atlassian.com/rest/api/3/issue/${issue.id}`,
    } as unknown as Version3Models.Issue;
  },

  getIssueFields: async (): Promise<Version3Models.FieldDetails[]> =>
    seed.fields.map((field) => ({
      clauseNames: [field.id],
      custom: field.custom,
      id: field.id,
      key: field.id,
      name: field.name,
      navigable: true,
      orderable: true,
      schema: { type: field.custom ? 'number' : 'string' },
      searchable: true,
    })) as Version3Models.FieldDetails[],

  getIssuesForBoard: async (
    _boardId: number,
    pointField?: JiraField | null,
    startAt = 0,
  ): Promise<AgileModels.SearchResults> => {
    const issues = pointField
      ? seed.issues.filter((issue) => issue.points === null)
      : seed.issues;
    const maxResults = 100;
    const page = issues.slice(startAt, startAt + maxResults);

    return {
      expand: 'schema,names',
      issues: page.map((issue) => toAgileIssue(seed, issue)) as AgileModels.SearchResults['issues'],
      maxResults,
      startAt,
      total: issues.length,
    };
  },

  getSprintsForBoard: async (boardId: number, startAt = 0) => {
    const sprints = seed.sprints.filter((s) => s.originBoardId === Number(boardId));
    return {
      isLast: true,
      maxResults: 50,
      startAt,
      total: sprints.length,
      values: sprints.map(toSprint),
    };
  },

  writePointValue: async (): Promise<void> => undefined,
});
