import {
  JiraBoardConfig,
  JiraDataPayload,
  JiraField,
  JiraFieldPayload,
  JiraIssuesDataPayload,
  JiraIssueSearchPayload,
  JiraResourceData,
  JiraSprint,
} from '@modules/integrations/jira/types';

import {
  FIXTURE_AVATAR_BASE64,
  FIXTURE_AVATAR_CONTENT_TYPE,
  FixtureIssue,
  FixtureSeed,
  FixtureSprint,
  resolveIssue,
  resolvePointField,
} from './scenarios';

type AvatarBlob = {
  blobData: string;
  contentType: string;
};

type WriteResult = {
  id: string;
  key: string;
};

/**
 * Adapters mapping a shape-neutral `FixtureSeed` into the v3 hand-rolled
 * `Jira*Payload` return types. Each function mirrors a method on the v3
 * `useJira` hook and returns a Promise so it can be dropped in as a direct
 * replacement for the real axios call.
 */

const basePayload = (
  startAt: number,
  total: number,
  pageSize: number,
) => ({
  isLast: startAt + pageSize >= total,
  maxResults: pageSize,
  startAt,
  total,
});

const toJiraSprint = (sprint: FixtureSprint): JiraSprint => ({
  goal: sprint.goal,
  id: sprint.id,
  name: sprint.name,
  originBoardId: sprint.originBoardId,
  self: `https://api.atlassian.com/rest/agile/1.0/sprint/${sprint.id}`,
  state: sprint.state,
});

const toIssuePayload = (seed: FixtureSeed,issue: FixtureIssue): JiraIssueSearchPayload => {
  const sprint = issue.sprintId === null
    ? undefined
    : seed.sprints.find((s) => s.id === issue.sprintId);
  const pointField = resolvePointField(seed);

  const fields: JiraIssueSearchPayload['fields'] = {
    issuetype: {
      avatarId: issue.issueType.avatarId,
      description: issue.issueType.description,
      icon: {
        blobData: FIXTURE_AVATAR_BASE64,
        contentType: FIXTURE_AVATAR_CONTENT_TYPE,
      },
      iconUrl: issue.issueType.iconUrl,
      id: issue.issueType.id,
      name: issue.issueType.name,
    },
    ...(sprint ? { sprint: toJiraSprint(sprint) } : {}),
    summary: issue.summary,
  };

  if (pointField) {
    fields[pointField.id] = issue.points;
  }

  return {
    expand: 'schema,names',
    fields,
    id: issue.id,
    key: issue.key,
    self: `https://api.atlassian.com/rest/api/2/issue/${issue.id}`,
  };
};

export const buildLegacyFixtures = (seed: FixtureSeed) => ({
  getAccessibleResources: async (): Promise<JiraResourceData> => seed.resource,

  getAvatars: async (avatarData: { [key: string]: number }): Promise<{ [key: string]: AvatarBlob }> =>
    Object.keys(avatarData).reduce((acc, issueType) => ({
      ...acc,
      [issueType]: {
        blobData: FIXTURE_AVATAR_BASE64,
        contentType: FIXTURE_AVATAR_CONTENT_TYPE,
      },
    }), {}),

  getBacklogForBoard: async (
    boardId: string | number,
    pointField?: JiraField | null,
    startAt = 0,
  ): Promise<JiraIssuesDataPayload> => {
    const board = seed.boards.find((b) => b.id === Number(boardId));
    const backlog = board?.hasBacklog === false
      ? []
      : seed.issues.filter((issue) => issue.sprintId === null);
    const issues = pointField
      ? backlog.filter((issue) => issue.points === null)
      : backlog;

    return {
      ...basePayload(
        startAt,
        issues.length,
        100,
      ),
      issues: issues
        .slice(startAt, startAt + 100)
        .map((issue) => toIssuePayload(seed, issue)),
    };
  },

  getBoardConfiguration: async (boardId: string | number): Promise<JiraBoardConfig> => ({
    id: Number(boardId),
    name: seed.boards.find((b) => b.id === Number(boardId))?.name ?? 'Fixture Board',
    type: seed.boards.find((b) => b.id === Number(boardId))?.type ?? 'scrum',
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
  }),

  getBoards: async (maxResults = 25, name?: string): Promise<JiraDataPayload> => {
    const filtered = name
      ? seed.boards.filter((b) => b.name.toLowerCase().includes(name.toLowerCase()))
      : seed.boards;
    const page = filtered.slice(0, maxResults);

    return {
      ...basePayload(
        0,
        filtered.length,
        maxResults,
      ),
      values: page.map((board) => ({
        id: board.id,
        name: board.name,
        self: `https://api.atlassian.com/rest/agile/1.0/board/${board.id}`,
        type: board.type,
      })),
    };
  },

  getIssueDetail: async (key: string): Promise<JiraIssueSearchPayload> =>
    toIssuePayload(seed, resolveIssue(seed, key)),

  getIssueFields: async (): Promise<JiraFieldPayload[]> =>
    seed.fields.map((field) => ({
      clauseNames: [field.id],
      id: field.id,
      name: field.name,
      schema: { type: field.custom ? 'number' : 'string' },
    })),

  getIssuesForBoard: async (
    _boardId: string | number,
    pointField?: JiraField | null,
    startAt = 0,
  ): Promise<JiraIssuesDataPayload> => {
    // Mirror the real JQL: only unpointed issues when a point field is provided.
    const issues = pointField
      ? seed.issues.filter((issue) => issue.points === null)
      : seed.issues;
    const maxResults = 100;
    const page = issues.slice(startAt, startAt + maxResults);

    return {
      ...basePayload(
        startAt,
        issues.length,
        maxResults,
      ),
      issues: page.map((issue) => toIssuePayload(seed, issue)),
    };
  },

  getSprintsForBoard: async (boardId: string | number,startAt = 0): Promise<JiraDataPayload> => {
    const sprints = seed.sprints.filter((s) => s.originBoardId === Number(boardId));
    return {
      ...basePayload(
        startAt,
        sprints.length,
        50,
      ),
      values: sprints.map(toJiraSprint),
    };
  },

  writePointValue: async (): Promise<WriteResult> => {
    const issue = seed.issues[0];
    return {
      id: issue?.id ?? 'fixture',
      key: issue?.key ?? 'FIX-000',
    };
  },
});
