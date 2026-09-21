import {
  test as base,
  expect,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';

/** Locator that resolves once a room view has finished mounting. */
const roomReady = (page: Page) => page.getByTestId('ticket-title-display');

/**
 * Fill the "what do we call you?" name form and submit. Works on any page that
 * is currently showing the user-setup card (fresh context, or a deep link to a
 * room before a name has been chosen).
 */
const signIn = async (page: Page, name: string): Promise<void> => {
  const input = page.getByPlaceholder('your name');
  await input.waitFor();
  await input.fill(name);
  await input.press('Enter');
  // The name input disappears once auth resolves and the app advances.
  await input.waitFor({ state: 'detached' });
};

/**
 * From a signed-in landing page, create a fresh room and return its slug.
 */
const createRoom = async (page: Page): Promise<string> => {
  await page.getByRole('button', { name: 'start a session' }).click();
  await page.waitForURL((url) => url.pathname.length > 1);
  await roomReady(page).waitFor();
  return decodeURIComponent(new URL(page.url()).pathname.slice(1));
};

/**
 * Open the app as a brand new host: navigate, sign in, create a room.
 * Returns the room slug.
 */
const host = async (page: Page, name: string): Promise<string> => {
  await page.goto('/');
  await signIn(page, name);
  return createRoom(page);
};

/**
 * Open a second participant in a brand-new browser context (its own storage +
 * anonymous auth identity), deep-linking into an existing room and signing in.
 * Returns the participant's page.
 */
const join = async (
  browser: Browser,
  name: string,
  slug: string,
): Promise<Page> => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/${slug}`);
  await signIn(page, name);
  await roomReady(page).waitFor();
  return page;
};

/**
 * Seed Jira fixture mode into localStorage before the app boots. Must be called
 * before `page.goto`. Makes the app report Jira as connected and serve canned
 * board/sprint/issue data (see src/utils/jiraFixtures).
 */
const enableJiraFixtures = async (
  page: Page,
  scenarioId = 'populated',
): Promise<void> => {
  await page.addInitScript((scenario) => {
    window.localStorage.setItem('useJiraFixtures', JSON.stringify(true));
    window.localStorage.setItem('jiraFixtureScenario', JSON.stringify(scenario));
  }, scenarioId);
};

/**
 * Create a plain (non-Jira) ticket via the ticket-title control. Clicks the
 * placeholder to reveal the input, types the title, and waits out the 1s debounce.
 */
const createTicket = async (page: Page, title: string): Promise<void> => {
  // The title control shows a placeholder for the first ticket and the current
  // ticket's name thereafter; the testid is stable across both.
  await page.getByTestId('ticket-title-display').click();
  const input = page.locator('#ticket-title');
  await input.waitFor();
  await input.fill(title);
  // handleChange debounces for 1s before writing the ticket.
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('ticket-title-display')).toHaveText(title);
};

/** Click a vote button by its point value. */
const castVote = async (page: Page, value: string | number): Promise<void> => {
  await page.getByTestId(`vote-${value}`).click();
};

/** Open the header hamburger menu. */
const openMenu = async (page: Page): Promise<void> => {
  await page.getByTestId('menu-button').click();
  await expect(page.locator('#menu')).toBeVisible();
};

/** Open the Preferences modal via the menu and optionally select a pane. */
const openPreferences = async (
  page: Page,
  pane?: 'General' | 'Appearance' | 'Integrations',
): Promise<void> => {
  await openMenu(page);
  await page.getByText('preferences', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible();
  if (pane) {
    await page.locator(`[aria-label="${pane}"]`).click();
  }
};

/** Close the currently-open modal via its close button. */
const closeModal = async (page: Page): Promise<void> => {
  await page.getByTestId('modal-close').click();
};

/**
 * Selects a list option (board / sprint / group / field) by dispatching a
 * click at the element's real on-screen coordinates.
 *
 * A plain `locator.dispatchEvent('click')` synthesizes a `MouseEvent` whose
 * `clientX`/`clientY` default to `(0, 0)`. The Jira import modal treats a
 * click outside its bounds as a request to close itself
 * (`src/modules/modal/index.tsx`'s `handleBackdropClick`), and — because the
 * synthetic click bubbles all the way up to that backdrop handler — a
 * `(0, 0)` click reads as "outside" and closes the modal out from under the
 * test. `dispatchEvent` is still used (rather than `.click()`) because
 * selecting an option often unmounts it immediately, and `.click()`'s
 * actionability retries race that removal.
 */
const selectOption = async (locator: Locator): Promise<void> => {
  const box = await locator.boundingBox();
  await locator.dispatchEvent('click', {
    clientX: (box?.x ?? 0) + (box?.width ?? 0) / 2,
    clientY: (box?.y ?? 0) + (box?.height ?? 0) / 2,
  });
};

export type AppHelpers = {
  signIn: typeof signIn;
  createRoom: typeof createRoom;
  host: typeof host;
  join: typeof join;
  enableJiraFixtures: typeof enableJiraFixtures;
  createTicket: typeof createTicket;
  castVote: typeof castVote;
  roomReady: typeof roomReady;
  openMenu: typeof openMenu;
  openPreferences: typeof openPreferences;
  closeModal: typeof closeModal;
  selectOption: typeof selectOption;
};

type Fixtures = {
  app: AppHelpers;
};

export const test = base.extend<Fixtures>({
  app: async ({}, use) => {
    await use({
      signIn,
      createRoom,
      host,
      join,
      enableJiraFixtures,
      createTicket,
      castVote,
      roomReady,
      openMenu,
      openPreferences,
      closeModal,
      selectOption,
    });
  },
});

export { expect };
