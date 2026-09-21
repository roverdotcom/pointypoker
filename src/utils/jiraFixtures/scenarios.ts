import {
  JiraAuthData,
  JiraResourceData,
} from '@modules/integrations/jira/types';
import { BoardType } from '@v4/types/jira';

/**
 * Shape-neutral fixture data for Jira mock mode.
 *
 * A `FixtureSeed` is the single source of truth for a scenario. The `toLegacy`
 * and `toJiraJs` adapters map one seed into the two different return-type
 * contracts (v3 hand-rolled `Jira*Payload` types vs. the `jira.js` SDK models),
 * so the same canned data drives both integrations.
 */

export type FixtureIssueType = {
  id: string;
  name: string;
  avatarId: number;
  iconUrl: string;
  description: string;
};

export type FixtureSprint = {
  id: number;
  name: string;
  state: string;
  goal: string;
  originBoardId: number;
};

export type FixtureBoard = {
  id: number;
  name: string;
  type: BoardType;
  /** Kanban boards only: false means the backlog feature is disabled. */
  hasBacklog?: boolean;
};

export type FixtureIssue = {
  id: string;
  key: string;
  summary: string;
  issueType: FixtureIssueType;
  /** `null` means the issue sits in the backlog rather than a sprint. */
  sprintId: number | null;
  points: number | null;
};

export type FixtureField = {
  id: string;
  name: string;
  custom: boolean;
};

export type FixtureSeed = {
  resource: JiraResourceData;
  auth: JiraAuthData;
  boards: FixtureBoard[];
  /** The estimation field id returned by a board's configuration. */
  estimationFieldId?: string;
  fields: FixtureField[];
  sprints: FixtureSprint[];
  issues: FixtureIssue[];
};

export type FixtureScenario = {
  id: string;
  label: string;
  description: string;
  seed: FixtureSeed;
};

/**
 * A base64-encoded 1x1 transparent PNG, used as the issue-type avatar blob so
 * fixtures never reach out to Atlassian's avatar endpoint.
 */
export const FIXTURE_AVATAR_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
export const FIXTURE_AVATAR_CONTENT_TYPE = 'image/png';

const RESOURCE: JiraResourceData = {
  avatarUrl: 'https://fixture.atlassian.net/avatar.png',
  id: 'fixture-cloud-id',
  name: 'Fixture Site',
  scopes: ['read:jira-work', 'write:jira-work'],
  url: 'https://fixture.atlassian.net',
};

const AUTH: JiraAuthData = {
  access_token: 'fixture-access-token',
  // Far in the future so nothing ever treats the fixture token as expired.
  expires_at: Date.now() + 1000 * 60 * 60 * 24 * 365,
  expires_in: 3600,
  refresh_token: 'fixture-refresh-token',
  scope: 'read:jira-work write:jira-work',
  token_type: 'Bearer',
};

const ISSUE_TYPES: Record<string, FixtureIssueType> = {
  bug: {
    avatarId: 10303,
    description: 'A problem which impairs product function',
    iconUrl: 'https://fixture.atlassian.net/issuetype/bug.png',
    id: '10004',
    name: 'Bug',
  },
  story: {
    avatarId: 10315,
    description: 'A user story',
    iconUrl: 'https://fixture.atlassian.net/issuetype/story.png',
    id: '10001',
    name: 'Story',
  },
  task: {
    avatarId: 10318,
    description: 'A task that needs to be done',
    iconUrl: 'https://fixture.atlassian.net/issuetype/task.png',
    id: '10002',
    name: 'Task',
  },
};

const ISSUE_TYPE_CYCLE = [
  ISSUE_TYPES.story,
  ISSUE_TYPES.bug,
  ISSUE_TYPES.task,
];

const POINT_FIELD: FixtureField = {
  custom: true,
  id: 'customfield_10016',
  name: 'Story Points',
};

const BASE_FIELDS: FixtureField[] = [
  {
    custom: false,
    id: 'summary',
    name: 'Summary',
  },
  {
    custom: false,
    id: 'issuetype',
    name: 'Issue Type',
  },
  {
    custom: false,
    id: 'sprint',
    name: 'Sprint',
  },
  POINT_FIELD,
];

const SUMMARIES = [
  'Add dark mode toggle to settings',
  'Fix flaky login redirect',
  'Migrate room store to v4 schema',
  'Improve empty-state copy on the setup page',
  'Handle Jira token refresh race condition',
  'Add keyboard shortcuts for voting',
  'Paginate the ticket queue',
  'Cache board configuration between imports',
  'Write vote distribution to Firestore',
  'Polish the results reveal animation',
];

const ISSUE_POINTS = [
  1,
  2,
  3,
  5,
  8,
];

/**
 * Generates a run of issues for a sprint, cycling issue types and alternating
 * pointed / unpointed so scenarios exercise both states.
 */
const makeIssues = (
  count: number,
  sprintId: number,
  boardId: number,
): FixtureIssue[] =>
  Array.from({ length: count }, (_, i) => {
    const points = i % 3 === 0 ? null : ISSUE_POINTS[i % ISSUE_POINTS.length];
    return {
      id: `${10000 + boardId * 100 + i}`,
      issueType: ISSUE_TYPE_CYCLE[i % ISSUE_TYPE_CYCLE.length],
      key: `FIX-${boardId}${String(i + 1).padStart(2, '0')}`,
      points,
      sprintId,
      summary: SUMMARIES[i % SUMMARIES.length],
    };
  });

const kanbanBoards: FixtureBoard[] = [
  {
    hasBacklog: true,
    id: 4,
    name: 'Support Kanban Board',
    type: 'kanban',
  },
];

/**
 * Backlog issues carry no sprint. Alternates pointed / unpointed so the
 * `pointField = EMPTY` filter is exercised.
 */
const makeBacklogIssues = (count: number, boardId: number): FixtureIssue[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${20000 + boardId * 100 + i}`,
    issueType: ISSUE_TYPE_CYCLE[i % ISSUE_TYPE_CYCLE.length],
    key: `KAN-${String(i + 1).padStart(2, '0')}`,
    points: i % 3 === 0 ? null : ISSUE_POINTS[i % ISSUE_POINTS.length],
    sprintId: null,
    summary: SUMMARIES[i % SUMMARIES.length],
  }));

const boards: FixtureBoard[] = [
  {
    id: 1,
    name: 'Web App Board',
    type: 'scrum',
  },
  {
    id: 2,
    name: 'Platform Board',
    type: 'scrum',
  },
  {
    id: 3,
    name: 'Design Board',
    type: 'scrum',
  },
];

const futureSprint = (
  id: number,
  boardId: number,
  name: string,
): FixtureSprint => ({
  goal: 'Ship the next increment',
  id,
  name,
  originBoardId: boardId,
  state: 'future',
});

const populatedSeed: FixtureSeed = {
  auth: AUTH,
  boards,
  estimationFieldId: POINT_FIELD.id,
  fields: BASE_FIELDS,
  issues: makeIssues(
    8,
    101,
    1,
  ),
  resource: RESOURCE,
  sprints: [
    futureSprint(
      101,
      1,
      'Web App Sprint 42',
    ),
  ],
};

const emptyBoardSeed: FixtureSeed = {
  ...populatedSeed,
  issues: [],
  sprints: [],
};

const largeSprintSeed: FixtureSeed = {
  ...populatedSeed,
  issues: makeIssues(
    40,
    201,
    1,
  ),
  sprints: [
    futureSprint(
      201,
      1,
      'Web App Sprint 43 (large)',
    ),
  ],
};

const missingPointFieldSeed: FixtureSeed = {
  ...populatedSeed,
  // Board configuration points at a field that is not present in `fields`, so
  // point-field resolution returns undefined.
  estimationFieldId: 'customfield_99999',
  fields: BASE_FIELDS.filter((field) => field.id !== POINT_FIELD.id),
  issues: makeIssues(
    6,
    301,
    1,
  ),
  sprints: [
    futureSprint(
      301,
      1,
      'Web App Sprint 44 (no estimate field)',
    ),
  ],
};

const kanbanBacklogSeed: FixtureSeed = {
  auth: AUTH,
  boards: kanbanBoards,
  estimationFieldId: POINT_FIELD.id,
  fields: BASE_FIELDS,
  issues: makeBacklogIssues(6, 4),
  resource: RESOURCE,
  sprints: [],
};

const hugeBacklogSeed: FixtureSeed = {
  ...kanbanBacklogSeed,
  // 120 issues against a 100-item page size, so paging needs two requests.
  issues: makeBacklogIssues(120, 4),
};

const kanbanNoBacklogSeed: FixtureSeed = {
  ...kanbanBacklogSeed,
  boards: [
    {
      hasBacklog: false,
      id: 4,
      name: 'Support Kanban Board',
      type: 'kanban',
    },
  ],
};

const kanbanNoEstimationSeed: FixtureSeed = {
  ...kanbanBacklogSeed,
  // No estimation block at all — the Kanban case the spec's point-field
  // resolution ladder exists for.
  estimationFieldId: undefined,
  // BASE_FIELDS contains 'Story Points', which Task 6's name detection would
  // resolve automatically — so the picker would never appear. Replace it with
  // two ambiguously-named numeric fields so detection deliberately gives up.
  fields: [
    ...BASE_FIELDS.filter((field) => field.id !== POINT_FIELD.id),
    {
      custom: true,
      id: 'customfield_10101',
      name: 'Team Estimate',
    },
    {
      custom: true,
      id: 'customfield_10102',
      name: 'Complexity',
    },
  ],
};

export const SCENARIOS: Record<string, FixtureScenario> = {
  'empty-board': {
    description: 'Boards exist but have no future sprints or issues.',
    id: 'empty-board',
    label: 'Empty board',
    seed: emptyBoardSeed,
  },
  'huge-backlog': {
    description: 'A Kanban board with a 120-issue backlog, spanning two pages.',
    id: 'huge-backlog',
    label: 'Huge backlog',
    seed: hugeBacklogSeed,
  },
  'kanban-backlog': {
    description: 'A Kanban board with no sprints and a mixed pointed / unpointed backlog.',
    id: 'kanban-backlog',
    label: 'Kanban backlog',
    seed: kanbanBacklogSeed,
  },
  'kanban-no-backlog': {
    description: 'A Kanban board with the backlog feature disabled; work lives in board columns.',
    id: 'kanban-no-backlog',
    label: 'Kanban without backlog',
    seed: kanbanNoBacklogSeed,
  },
  'kanban-no-estimation': {
    description: 'A Kanban board whose configuration has no estimation field.',
    id: 'kanban-no-estimation',
    label: 'Kanban without estimation',
    seed: kanbanNoEstimationSeed,
  },
  'large-sprint': {
    description: 'A single board with a future sprint of 40 issues.',
    id: 'large-sprint',
    label: 'Large sprint',
    seed: largeSprintSeed,
  },
  'missing-point-field': {
    description: 'Board estimation field cannot be resolved to a Jira field.',
    id: 'missing-point-field',
    label: 'Missing point field',
    seed: missingPointFieldSeed,
  },
  populated: {
    description: 'A few boards, one future sprint, mixed pointed / unpointed issues.',
    id: 'populated',
    label: 'Populated sprint',
    seed: populatedSeed,
  },
};

export const DEFAULT_SCENARIO_ID = 'populated';

export const resolveSeed = (scenarioId?: string | null): FixtureSeed =>
  (scenarioId && SCENARIOS[scenarioId]?.seed) || SCENARIOS[DEFAULT_SCENARIO_ID].seed;

/** Resolves the field a board's estimation config points at, if it exists. */
export const resolvePointField = (seed: FixtureSeed): FixtureField | undefined =>
  seed.fields.find((field) => field.id === seed.estimationFieldId);

/**
 * Finds an issue by key, or synthesizes a placeholder when the scenario has no
 * issues (e.g. the `empty-board` scenario) so single-issue lookups never crash.
 */
export const resolveIssue = (seed: FixtureSeed, key: string): FixtureIssue =>
  seed.issues.find((issue) => issue.key === key) ?? seed.issues[0] ?? {
    id: '90000',
    issueType: ISSUE_TYPES.story,
    key: key || 'FIX-000',
    points: null,
    sprintId: seed.sprints[0]?.id ?? null,
    summary: 'Fixture placeholder issue',
  };
