
import { isV4Experience } from '@utils';
import V4Switcher from '@v4/ui/routes/v4-switcher';

import LegacySwitcher from './legacySwitcher';

/**
 * This is a hybrid module that renders the v4 experience or the legacy
 * component that switches between user and room setup. After the v4 rollout,
 * V4Switcher will replace this component altogether.
 */
const Switcher = () => {
  if (!isV4Experience()) {
    return <LegacySwitcher />;
  }

  return <V4Switcher />;
};

export default Switcher;
