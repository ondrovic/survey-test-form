import { useMemo } from 'react';
import { SurveyConfig } from '@/types';
import { getOrderedSectionContent } from '@/utils/section-content.utils';
import { AggregatedSeries } from '../types';

export const useSectionData = (config: SurveyConfig | undefined, series: AggregatedSeries[]) => {
  // Map for quick lookup by fieldId
  const fieldIdToSeries = useMemo(() => {
    const map: Record<string, AggregatedSeries> = {};
    for (const s of series) map[s.fieldId] = s;
    return map;
  }, [series]);

  // Section ordering to mirror builder/form
  const orderedSections = useMemo(() => {
    const list = (config?.sections || []).slice();
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  }, [config?.sections]);

  const sectionNames = useMemo(() => orderedSections.map((s) => s.title), [orderedSections]);
  
  const subsectionsBySection = useMemo(() => {
    const map: Record<string, Array<{ id: string; title: string }>> = {};
    orderedSections.forEach((sec) => {
      map[sec.title] = (sec.subsections || []).map((ss) => ({ id: ss.id, title: ss.title }));
    });
    return map;
  }, [orderedSections]);

  // Available fields for filtering/hiding
  const availableFields = useMemo(() => {
    const items: Array<{ id: string; label: string }> = [];

    orderedSections.forEach((section) => {
      const contentItems = getOrderedSectionContent(section);

      contentItems.forEach((ci) => {
        if (ci.type === 'field') {
          const field: any = ci.data;
          const s = fieldIdToSeries[field.id];
          if (s) {
            const label = `${section.title} • ${s.label}`;
            items.push({ id: s.fieldId, label });
          }
        } else {
          const subsection: any = ci.data;
          (subsection.fields || []).forEach((f: any) => {
            const s = fieldIdToSeries[f.id];
            if (s) {
              const label = `${section.title} • ${subsection.title} • ${s.label}`;
              items.push({ id: s.fieldId, label });
            }
          });
        }
      });
    });

    return items;
  }, [orderedSections, fieldIdToSeries]);

  return {
    orderedSections,
    fieldIdToSeries,
    sectionNames,
    subsectionsBySection,
    availableFields
  };
};