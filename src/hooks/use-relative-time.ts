import { getTimeAgo } from "@/utils/date.utils";
import { useEffect, useMemo, useState } from "react";

/**
 * Returns a relative "time ago" string for a given date and updates it over time
 * with an appropriate cadence to minimize re-renders.
 */
export const useRelativeTime = (
  date: Date | string | null | undefined
): string | null => {
  const [, setTick] = useState(0);

  // Compute update interval based on age to avoid excessive re-renders
  const intervalMs = useMemo(() => {
    if (!date) return 0;
    const ageMs = Date.now() - new Date(date).getTime();
    if (ageMs < 60_000) return 1_000; // update every second for < 1 min
    if (ageMs < 60 * 60_000) return 30_000; // every 30s for < 1 hour
    return 5 * 60_000; // every 5 minutes beyond that
  }, [date]);

  useEffect(() => {
    if (!intervalMs) return;
    const id = setInterval(() => setTick((v) => v + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  if (!date) return null;
  return getTimeAgo(date);
};
