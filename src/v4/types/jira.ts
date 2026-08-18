import type {
  IssueTypeRef,
  SprintRef,
} from './external';

/**
 * V4-native DTOs returned by the Jira data hook (`useJira`). Components consume
 * these instead of `jira.js` SDK models or the legacy `Jira*Payload` types, so
 * the SDK shape never leaks past the hook boundary.
 */

export type BoardOption = {
  id: number;
  name: string;
};

/** The estimation field resolved for a board. */
export type PointField = {
  id: string;
  name: string;
};

export type SprintOption = {
  id: number;
  name: string;
  state?: string;
};

/**
 * A single Jira issue mapped into an app-friendly shape — enough to preview in
 * search results and to import into a session as an `Issue.external`.
 */
export type IssueDetail = {
  key: string;
  summary: string;
  url?: string;
  iconUrl?: string;
  isParent: boolean;
  type: IssueTypeRef;
  sprint?: SprintRef;
};

/** An issue selected for import, carrying everything needed to seed a session Issue. */
export type ImportableIssue = IssueDetail & {
  estimationFieldId?: string;
};
