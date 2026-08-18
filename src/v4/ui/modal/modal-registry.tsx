import Spotlight from '@v4/ui/room/spotlight';
import { ModalDefinition, ModalKey } from '@v4/types/modal';

/**
 * Placeholder for a modal whose content has not been migrated to v4 yet.
 * Each will be replaced by its real component in the follow-up phase.
 */
const Placeholder = ({ label }: { label: string }) => (
  <div
    style={{
      opacity: 0.6,
      padding: '1rem',
    }}
  >
    {label} — coming soon
  </div>
);

const PreferencesPlaceholder = () => <Placeholder label="Preferences" />;
const JiraImportPlaceholder = () => <Placeholder label="Import from Jira" />;
const JiraReauthPlaceholder = () => <Placeholder label="Jira Integration Update" />;
const ReportPiiPlaceholder = () => <Placeholder label="Report PII" />;
const FeedbackPlaceholder = () => <Placeholder label="Feedback" />;

/**
 * The single source of per-modal configuration. Adding a modal = adding an
 * entry here (component + title + size + hideBackground) plus a `ModalKey`.
 */
export const MODAL_REGISTRY: Record<ModalKey, ModalDefinition> = {
  [ModalKey.PREFERENCES]: {
    component: PreferencesPlaceholder,
    size: {
      height: '60%',
      width: '50%',
    },
    subtitle: 'Changes save automatically',
    title: 'Preferences',
  },
  [ModalKey.JIRA_IMPORT]: {
    component: JiraImportPlaceholder,
    size: {
      height: '75%',
      width: '60%',
    },
    title: 'Import from Jira',
  },
  [ModalKey.JIRA_REAUTH]: {
    component: JiraReauthPlaceholder,
    size: {
      height: 'auto',
      minWidth: '480px',
      width: '35%',
    },
    title: 'Jira Integration Update',
  },
  [ModalKey.REPORT_PII]: {
    component: ReportPiiPlaceholder,
    size: {
      height: 'auto',
      minWidth: '520px',
      width: '40%',
    },
    title: 'Report PII',
  },
  [ModalKey.FEEDBACK]: {
    component: FeedbackPlaceholder,
    size: {
      height: 'auto',
      minWidth: '420px',
      width: '30%',
    },
    title: 'Feedback',
  },
  [ModalKey.SPOTLIGHT]: {
    component: Spotlight,
    hideBackground: true,
  },
};
