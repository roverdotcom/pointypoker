import { Timestamp } from 'firebase/firestore';

import { PointingSchemes } from '@modules/room/utils';

type Estimation = {
  id: string;
  issueID: string;
  userId: string;
  value: string;
  timestamp: Timestamp;
};

export const PointingSchemeOptions = [
  PointingSchemes.fibonacci,
  PointingSchemes.sequential,
  PointingSchemes.tshirt,
] as const;

type PointScheme = {
  scheme: typeof PointingSchemeOptions[number];
  min?: number;
  max?: number;
  includeHalfPoints?: boolean;
  halfPointMax?: number;
};

export default Estimation;
export type { PointScheme };
