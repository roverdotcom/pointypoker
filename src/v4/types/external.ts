import type Issue from './issue';

/**
 * V4-native, provider-agnostic references to data that originates outside the
 * app (e.g. Jira). These intentionally do NOT import from the legacy
 * `@modules/integrations/jira/types` so the v4 model stays self-contained.
 */

export type SprintRef = {
  id: number;
  name: string;
  state?: string;
  goal?: string;
  originBoardId?: number;
};

export type IssueTypeRef = {
  id: string;
  name: string;
  avatarId?: number;
  description?: string;
  iconUrl?: string;
  icon?: {
    contentType: string;
    data: string;
  };
};

export type ExternalReference = {
  /** Origin system, e.g. 'jira'. */
  source: string;
  url: string;
  type: IssueTypeRef;
  sprint?: SprintRef;
  parent?: Issue;
  /** Whether the current estimate has been written back to the source. */
  persistedToRemote: boolean;
};
