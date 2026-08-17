import type { AvailableLogDate } from '@/services/logs';

export interface OlderPageRequest {
  period: AvailableLogDate;
  periodIndex: number;
  offset?: number;
}

export function getOlderPageRequest(
  availableDates: AvailableLogDate[],
  periodIndex: number,
  nextOffset: number | undefined,
): OlderPageRequest | null {
  const targetPeriodIndex = nextOffset === undefined ? periodIndex + 1 : periodIndex;
  const period = availableDates[targetPeriodIndex];
  if (!period) {
    return null;
  }

  return {
    period,
    periodIndex: targetPeriodIndex,
    offset: targetPeriodIndex === periodIndex ? nextOffset : undefined,
  };
}
