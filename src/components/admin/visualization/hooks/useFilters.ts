import { useMemo } from 'react';
import { SurveyResponse } from '@/types';
import { AggregatedSeries } from '../types';
import { useVisualization } from '../context';

export const useFilters = (responses: SurveyResponse[]) => {
  const { filters } = useVisualization();
  const { startDate, endDate, search } = filters;

  // Filter responses by date range
  const filteredResponses = useMemo(() => {
    if (!startDate && !endDate) return responses;
    const start = startDate ? new Date(`${startDate}T00:00:00`) : undefined; // local start of day
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : undefined; // local end of day
    
    return responses.filter((r) => {
      const submitted = new Date(r.submittedAt);
      if (start && submitted < start) return false;
      if (end && submitted > end) return false;
      return true;
    });
  }, [responses, startDate, endDate]);

  // Generate submissions by day for sparkline
  const submissionsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredResponses.forEach((r) => {
      const d = new Date(r.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const keys = Object.keys(counts).sort();
    return keys.map((k) => ({ x: k, y: counts[k] }));
  }, [filteredResponses]);

  // Get today's count
  const todayCount = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const found = submissionsByDay.find((d) => d.x === todayKey);
    return found ? found.y : 0;
  }, [submissionsByDay]);

  // Search filter for series
  const seriesMatchesSearch = (s: AggregatedSeries, context?: { section?: string; subsection?: string }) => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return true;
    
    const haystacks: Array<string | undefined> = [
      s.label,
      s.fieldId,
      context?.section,
      context?.subsection,
      ...Object.keys(s.counts || {}),
    ];
    
    return haystacks.some((h) => (h ? String(h).toLowerCase().includes(searchTerm) : false));
  };

  // Quick range functions
  const applyQuickRange = (range: 'all' | '7d' | '30d' | 'month' | 'custom') => {
    if (range === 'all') {
      return { startDate: '', endDate: '' };
    }
    
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start = new Date(end);
    
    if (range === '7d') {
      start.setDate(end.getDate() - 6);
    } else if (range === '30d') {
      start.setDate(end.getDate() - 29);
    } else if (range === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else {
      return { startDate: '', endDate: '' };
    }
    
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  };

  return {
    filteredResponses,
    submissionsByDay,
    todayCount,
    seriesMatchesSearch,
    applyQuickRange,
    filters
  };
};