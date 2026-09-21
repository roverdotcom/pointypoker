import { BoardType } from './jira';

/**
 * A group of issues offered for import. Scrum boards produce one group per
 * future sprint; Kanban boards produce a single synthetic group.
 *
 * Group membership is always decided by which API call returned an issue —
 * never by reading `issue.fields.sprint`, because Jira backlog responses can
 * carry closed-sprint metadata that would scatter issues into phantom groups.
 */
export type IssueGroup = {
  id: number | 'backlog';
  name: string;
  state?: string;
};

export type GroupedIssues<TIssue> = {
  groupId: IssueGroup['id'];
  issues: TIssue[];
}[];

/** Which call produced a Kanban board's issues, which decides the label. */
export type BacklogSource = 'backlog' | 'board';

/**
 * Grouped issues plus the paging metadata the selection step needs to decide
 * whether to request another page. Dropping `total` / `maxResults` here would
 * leave the caller unable to paginate.
 */
export type GroupedIssuesPage<TIssue> = {
  groups: GroupedIssues<TIssue>;
  maxResults: number;
  startAt: number;
  total: number;
  /** Which Kanban source produced these issues; undefined for Scrum. */
  source?: BacklogSource;
};

/** A board reference that may predate board-type persistence. */
export type BoardRef = {
  id: number;
  type?: BoardType;
};

export const BACKLOG_GROUP_ID = 'backlog' as const;

export const buildBacklogGroup = (source: BacklogSource): IssueGroup => ({
  id: BACKLOG_GROUP_ID,
  name: source === 'backlog' ? 'Backlog' : 'Board',
});

type SprintBearing = { fields?: { sprint?: { id?: number } } };

/** Buckets Scrum issues by sprint id, preserving first-seen group order. */
export const groupScrumIssues = <TIssue extends SprintBearing>(
  issues: TIssue[],
): GroupedIssues<TIssue> => {
  const order: number[] = [];
  const buckets = new Map<number, TIssue[]>();

  issues.forEach((issue) => {
    const sprintId = issue.fields?.sprint?.id;
    if (sprintId === undefined) return;

    if (!buckets.has(sprintId)) {
      buckets.set(sprintId, []);
      order.push(sprintId);
    }
    buckets.get(sprintId)!.push(issue);
  });

  return order.map((groupId) => ({
    groupId,
    issues: buckets.get(groupId)!,
  }));
};
