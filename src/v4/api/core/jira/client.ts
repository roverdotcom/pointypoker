import { BaseClient } from 'jira.js';
import { Board, Sprint } from 'jira.js/agile';
import { IssueFields, Issues } from 'jira.js/version3';

/**
 * The jira.js client, scoped to the resources v4 actually uses. Pure: no React,
 * no store — constructed by the provider from stored credentials.
 */
class JiraClient extends BaseClient {
  agile = {
    board: new Board(this),
    sprint: new Sprint(this),
  };

  v3 = {
    fields: new IssueFields(this),
    issues: new Issues(this),
  };
}

export default JiraClient;
export { JiraClient };
