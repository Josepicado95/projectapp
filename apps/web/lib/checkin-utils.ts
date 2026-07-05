export type CheckInPoint = { date: string; energy: number; mood: number; stress: number; sleep: number };

/**
 * Collapses a list of check-ins — assumed ordered oldest-to-newest, one entry
 * per submission — to at most one entry per calendar day, keeping the latest
 * check-in of each day. Used by the "day of week" bar strips, which need one
 * value per day regardless of how many check-ins happened that day.
 */
export function toDailyLatest(checkIns: CheckInPoint[]): CheckInPoint[] {
  const byDay = new Map<string, CheckInPoint>();
  for (const c of checkIns) {
    byDay.set(c.date, c); // re-setting an existing key updates its value but keeps its original iteration position
  }
  return Array.from(byDay.values());
}
