import { getPointOptions, PointingTypes } from '@modules/room/utils';
import { PointScheme } from '@v4/types/estimation';

const EXCLUSIONS = new Set([
  '?',
  '∞',
  '☕',
]);

type CalculationInput = {
  votes: Record<string, string | number>;
  pointScheme?: PointScheme;
};

type CalculationResult = {
  average: number | null;
  distribution: Record<string, number>;
  suggestedValue: string | number | null;
  warning?: string;
};

/**
 * Computes average, suggested value, and distribution from a raw vote map.
 * Operates on v4 data shapes — no dependency on legacy Ticket type.
 */
const calculate = ({ votes, pointScheme }: CalculationInput): CalculationResult => {
  const distribution: Record<string, number> = {};
  const numericVotes: number[] = [];
  let excludedCount = 0;

  for (const v of Object.values(votes)) {
    const key = String(v);
    distribution[key] = (distribution[key] ?? 0) + 1;

    if (EXCLUSIONS.has(key)) {
      excludedCount += 1;
    } else {
      numericVotes.push(typeof v === 'number' ? v : parseFloat(key));
    }
  }

  const isTshirt = pointScheme?.scheme === PointingTypes.tshirt;

  // T-shirt sizes can't be averaged numerically
  if (isTshirt) {
    return {
      average: null,
      distribution,
      suggestedValue: suggestTshirt(votes, pointScheme),
      warning: 'T-Shirt sizes cannot be averaged.',
    };
  }

  // Numeric average
  const validVotes = numericVotes.filter((n) => !Number.isNaN(n));
  const average = validVotes.length > 0
    ? validVotes.reduce((sum, n) => sum + n, 0) / validVotes.length
    : null;

  let warning: string | undefined;

  if (excludedCount >= validVotes.length && excludedCount > 0) {
    warning = 'Too many people didn\'t pick a number';
  } else if (excludedCount > 0) {
    warning = 'Some people didn\'t pick a number';
  }

  const roundedAverage = average !== null && average % 1 !== 0
    ? parseFloat(average.toFixed(2))
    : average;

  return {
    average: roundedAverage,
    distribution,
    suggestedValue: suggestNumeric(roundedAverage, pointScheme),
    warning,
  };
};

/**
 * Finds the nearest point value in the configured sequence for a numeric average.
 */
const suggestNumeric = (average: number | null, pointScheme?: PointScheme): number | null => {
  if (average === null || average === 0) return null;

  const { sequence } = getPointOptions(pointScheme?.scheme, pointScheme);
  const numericSequence = sequence
    .map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  if (numericSequence.length === 0) return null;

  const roundUp = numericSequence.findIndex((p) => p >= average);

  if (roundUp === -1) return numericSequence[numericSequence.length - 1];
  if (roundUp === 0) return numericSequence[0];

  const lower = numericSequence[roundUp - 1];
  const upper = numericSequence[roundUp];
  const middle = (upper - lower) / 2;

  return (average - lower) >= middle ? upper : lower;
};

/**
 * Suggests a T-shirt size by averaging index positions in the sequence.
 */
const suggestTshirt = (votes: Record<string, string | number>, pointScheme?: PointScheme): string | null => {
  const { sequence } = getPointOptions(pointScheme?.scheme, pointScheme);
  const indices: number[] = [];

  for (const v of Object.values(votes)) {
    const key = String(v);
    if (EXCLUSIONS.has(key)) continue;

    const idx = sequence.indexOf(key);
    if (idx !== -1) indices.push(idx);
  }

  if (indices.length === 0) return null;

  const avg = indices.reduce((sum, i) => sum + i, 0) / indices.length;
  const roundUp = Math.ceil(avg);
  const roundDown = Math.floor(avg);
  const middle = (roundUp - roundDown) / 2;
  const mark = avg - roundDown;
  const index = mark >= middle ? roundUp : roundDown;

  return (sequence[index] as string) ?? null;
};

export { calculate };
export type { CalculationInput, CalculationResult };
