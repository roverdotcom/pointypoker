import { test, expect } from './support/fixtures';

/**
 * Exercises the Jira import flow against the app's built-in fixture mode
 * (src/utils/jiraFixtures) — no real Atlassian OAuth. The "populated" scenario
 * exposes a "Web App Board" with "Web App Sprint 42" containing issues
 * FIX-101…FIX-108.
 */
test.describe('Jira import (fixture mode)', () => {
  test('importing a sprint populates the queue and sets the first ticket', async ({ page, app }) => {
    // Seed fixture mode before the app boots.
    await app.enableJiraFixtures(page, 'populated');
    await app.host(page, 'Ada');

    // Fixture mode reports Jira as connected, so the import menu item appears.
    await app.openMenu(page);
    await page.getByText('import from Jira').click();
    await expect(page.getByRole('heading', { name: 'Import from Jira' })).toBeVisible();

    // Step 1: choose a board. Selecting it immediately unmounts the option list,
    // so dispatch the click directly to avoid Playwright's post-click retry race.
    await page.locator('#board-option-picker').fill('Web App');
    await page.getByText('Web App Board').dispatchEvent('click');

    // Step 2: choose a sprint (fetched for the board).
    await expect(page.getByRole('heading', { name: 'Select a sprint' })).toBeVisible();
    await page.getByText('Web App Sprint 42').dispatchEvent('click');

    // Step 3: review and add to the queue.
    await expect(page.getByRole('heading', { name: 'Review tickets' })).toBeVisible();
    await page.getByRole('button', { name: /Add to queue/ }).click();

    // Modal closes; the first imported issue becomes the current ticket.
    await expect(page.getByRole('heading', { name: 'Import from Jira' })).toHaveCount(0);
    await expect(app.roomReady(page)).toHaveText('Add dark mode toggle to settings');

    // The queue tab only renders when the ticket queue is non-empty, so its
    // appearance confirms the sprint's issues were imported into the queue.
    const panel = page.locator('#wrapper');
    await expect(panel.getByRole('heading', { name: 'queue' })).toBeVisible();
    // At least one imported FIX-1xx issue is present in the queue list.
    await expect(panel.getByRole('link', { name: /^FIX-1\d\d/ })).not.toHaveCount(0);
  });

  test('importing a kanban backlog populates the queue', async ({ page, app }) => {
    // The "kanban-backlog" scenario exposes a single Kanban board ("Support
    // Kanban Board") whose backlog holds 6 issues (KAN-01…KAN-06), 2 of them
    // unpointed — only the unpointed ones are importable.
    await app.enableJiraFixtures(page, 'kanban-backlog');
    await app.host(page, 'Ada');

    await app.openMenu(page);
    await page.getByText('import from Jira').click();
    await expect(page.getByRole('heading', { name: 'Import from Jira' })).toBeVisible();

    await page.locator('#board-option-picker').fill('Support');
    await app.selectOption(page.getByText('Support Kanban Board'));

    // Kanban boards present a single synthetic group instead of sprints. The
    // group's id is always "backlog" regardless of its "Backlog"/"Board" label.
    const group = page.getByTestId('group-option-backlog');
    await expect(group).toContainText('Backlog');
    await app.selectOption(group);

    await expect(page.getByRole('heading', { name: 'Review tickets' })).toBeVisible();
    await page.getByRole('button', { name: /Add to queue/ }).click();

    const panel = page.locator('#wrapper');
    await expect(panel.getByRole('heading', { name: 'queue' })).toBeVisible();
    await expect(panel.getByRole('link', { name: /^KAN-\d\d/ })).not.toHaveCount(0);
  });

  test('renders a kanban issue without a sprint clause', async ({ page, app }) => {
    // Regression guard: Kanban issues carry no sprint, so the review row's
    // metadata line must render the key and issue type only, never
    // "… in undefined" (or any other sprint name).
    await app.enableJiraFixtures(page, 'kanban-backlog');
    await app.host(page, 'Ada');

    await app.openMenu(page);
    await page.getByText('import from Jira').click();
    await page.locator('#board-option-picker').fill('Support');
    await app.selectOption(page.getByText('Support Kanban Board'));
    await app.selectOption(page.getByTestId('group-option-backlog'));

    await expect(page.getByRole('heading', { name: 'Review tickets' })).toBeVisible();

    // KAN-01 is the first unpointed backlog issue and is a Story.
    const firstRow = page.getByText(/^KAN-01/);
    await expect(firstRow).toHaveText('KAN-01  •  Story');
    // No row anywhere in the review list carries an " in <sprint>" clause.
    await expect(page.getByText(/\bin\b/)).toHaveCount(0);
  });

  test('falls back to board issues when the backlog is disabled', async ({ page, app }) => {
    // "kanban-no-backlog" is the same board with `hasBacklog: false`, so the
    // board-issues endpoint is used instead and the group label reads "Board".
    await app.enableJiraFixtures(page, 'kanban-no-backlog');
    await app.host(page, 'Ada');

    await app.openMenu(page);
    await page.getByText('import from Jira').click();
    await page.locator('#board-option-picker').fill('Support');
    await app.selectOption(page.getByText('Support Kanban Board'));

    await expect(page.getByRole('heading', { name: 'Select issues to import' })).toBeVisible();
    const group = page.getByTestId('group-option-backlog');
    await expect(group).toContainText('Board');
    await expect(group).not.toContainText('Backlog');
    await app.selectOption(group);

    await expect(page.getByRole('heading', { name: 'Review tickets' })).toBeVisible();
    await page.getByRole('button', { name: /Add to queue/ }).click();

    const panel = page.locator('#wrapper');
    await expect(panel.getByRole('heading', { name: 'queue' })).toBeVisible();
    await expect(panel.getByRole('link', { name: /^KAN-\d\d/ })).not.toHaveCount(0);
  });

  test('prompts for a point field when the board has no estimation config', async ({ page, app }) => {
    // "kanban-no-estimation" has no estimation block, and its only numeric
    // custom fields are ambiguously named ("Team Estimate", "Complexity"),
    // so name-based detection deliberately fails and the picker appears.
    await app.enableJiraFixtures(page, 'kanban-no-estimation');
    await app.host(page, 'Ada');

    await app.openMenu(page);
    await page.getByText('import from Jira').click();
    await page.locator('#board-option-picker').fill('Support');
    await app.selectOption(page.getByText('Support Kanban Board'));

    await expect(page.getByRole('heading', { name: 'Select a point field' })).toBeVisible();
    // Exact match: the helper text ("...your team estimates in") otherwise
    // collides with the field option's own label under substring matching.
    await app.selectOption(page.getByText('Team Estimate', { exact: true }));

    // The flow advances to group selection once a field is chosen.
    await expect(page.getByRole('heading', { name: 'Select issues to import' })).toBeVisible();
    await expect(page.getByTestId('group-option-backlog')).toContainText('Backlog');
  });

  test('shows an empty state for a kanban board with no backlog issues', async ({ page, app }) => {
    await app.enableJiraFixtures(page, 'kanban-empty');
    await app.host(page, 'Ada');

    await app.openMenu(page);
    await page.getByText('import from Jira').click();
    await page.locator('#board-option-picker').fill('Support');
    await app.selectOption(page.getByText('Support Kanban Board'));

    // The empty state renders positively, alongside the (unclickable) group
    // row — a disappeared spinner alone would also describe a blank screen.
    // The label reads "Board", not "Backlog": source detection probes the
    // backlog endpoint and falls back to board issues when it comes back
    // empty, since a genuinely empty backlog is indistinguishable from a
    // disabled one from that probe alone.
    await expect(page.getByTestId('group-option-backlog')).toContainText('Board');
    await expect(page.getByText('No issues to import')).toBeVisible();
    await expect(page.getByText(/Loading/)).toHaveCount(0);
  });

  test('imports a backlog larger than one page', async ({ page, app }) => {
    await app.enableJiraFixtures(page, 'huge-backlog');
    await app.host(page, 'Ada');

    await app.openMenu(page);
    await page.getByText('import from Jira').click();
    await page.locator('#board-option-picker').fill('Support');
    await app.selectOption(page.getByText('Support Kanban Board'));

    // The group's count proves both pages were fetched before selection: all
    // 120 issues are unpointed, so a single 100-item page would under-report.
    const group = page.getByTestId('group-option-backlog');
    await expect(group).toContainText('Backlog');
    await expect(group).toContainText('120');

    await app.selectOption(group);
    await expect(page.getByRole('heading', { name: 'Review tickets' })).toBeVisible();
    await page.getByRole('button', { name: /Add to queue/ }).click();

    const panel = page.locator('#wrapper');
    await expect(panel.getByRole('heading', { name: 'queue' })).toBeVisible();
    // All 120 issues were imported, not merely the first page's worth.
    await expect(panel.getByRole('link', { name: /^KAN-\d+$/ })).toHaveCount(120);
  });

  test('resolves board type for a stored board saved without one', async ({ page, app }) => {
    await app.enableJiraFixtures(page, 'kanban-backlog');
    // Seed a defaultBoard with no `type`, as a pre-upgrade user would have.
    // `usePreferenceSync` stores each preference under its own localStorage
    // key (see src/modules/preferences/hooks.ts), so `jiraPreferences` — not a
    // wrapping "preferences" blob — is the key to seed.
    await page.addInitScript(() => {
      window.localStorage.setItem('jiraPreferences', JSON.stringify({
        defaultBoard: {
          id: 4,
          name: 'Support Kanban Board',
          self: 'https://api.atlassian.com/rest/agile/1.0/board/4',
        },
      }));
    });
    await app.host(page, 'Ada');

    await app.openMenu(page);
    await page.getByText('import from Jira').click();

    // No board picked: the stored default is used, and its type is recovered
    // from board configuration rather than defaulting to Scrum — a Scrum
    // misroute would show "Select a sprint" instead.
    await expect(page.getByRole('heading', { name: 'Select issues to import' })).toBeVisible();
    await expect(page.getByTestId('group-option-backlog')).toContainText('Backlog');
  });
});
