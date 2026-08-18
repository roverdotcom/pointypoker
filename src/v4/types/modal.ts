import { ComponentType } from 'react';

/**
 * Every modal the v4 system can host. Opening a modal is done by key
 * (`openModal(ModalKey.PREFERENCES)`); per-modal configuration lives in the
 * registry, co-located with the modal itself.
 */
export enum ModalKey {
  PREFERENCES,
  JIRA_IMPORT,
  JIRA_REAUTH,
  REPORT_PII,
  FEEDBACK,
  SPOTLIGHT,
}

/**
 * A responsive dimension: either a single value applied at all widths, or a
 * value with an override used when the viewport is narrow (`useMobile`).
 */
export type ModalDimension =
  | string
  | {
    default: string;
    narrow?: string;
  };

export type ModalSize = {
  width?: ModalDimension;
  height?: ModalDimension;
  minWidth?: ModalDimension;
};

export type ModalDefinition = {
  /** Rendered content. Self-sources its own data from the store/context. */
  component: ComponentType;
  /** Header title. Ignored when `hideBackground` is true. */
  title?: string;
  /** Header subtitle. Ignored when `hideBackground` is true. */
  subtitle?: string;
  /** Merged over `DEFAULT_MODAL_SIZE`. */
  size?: ModalSize;
  /** When true, render the component raw with no Card shell/header. */
  hideBackground?: boolean;
  /** Close when the backdrop is clicked. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** Show the "×" close button in the header. Defaults to true. Ignored when `hideBackground`. */
  showCloseButton?: boolean;
};

/** Sections of the Preferences modal, for deep-linking (Level A). */
export enum PreferencesSection {
  GENERAL,
  APPEARANCE,
  INTEGRATIONS,
}

/**
 * Per-modal deep-link params. A modal that supports being opened at a
 * sub-view declares its params shape here so `openModal` stays type-safe.
 * Keys not listed take no params.
 */
export type ModalParams = {
  [ModalKey.PREFERENCES]: { section?: PreferencesSection };
};

/** Resolves an optional params shape for a given key (undefined when none declared). */
export type ParamsFor<K extends ModalKey> = K extends keyof ModalParams
  ? ModalParams[K]
  : undefined;

export type ModalContextValue = {
  activeModal: ModalKey | null;
  /** Params passed to the currently open modal; read via `useModalParams`. */
  activeParams: unknown;
  openModal: <K extends ModalKey>(key: K, params?: ParamsFor<K>) => void;
  closeModal: () => void;
};

/** Mirrors the legacy default so modals that omit `size` look unchanged. */
export const DEFAULT_MODAL_SIZE: Required<ModalSize> = {
  height: {
    default: '60%',
    narrow: '90%',
  },
  minWidth: {
    default: '720px',
    narrow: '90%',
  },
  width: {
    default: '50%',
    narrow: '90%',
  },
};

/** Picks the right value for a dimension given the current narrow state. */
export const resolveDimension = (dimension: ModalDimension | undefined, isNarrow: boolean): string | undefined => {
  if (dimension === undefined) {
    return undefined;
  }

  if (typeof dimension === 'string') {
    return dimension;
  }

  return isNarrow && dimension.narrow !== undefined ? dimension.narrow : dimension.default;
};
