import { Button, LoadingSpinner, ScrollableContent } from '@/components/common';
import { firestoreHelpers } from '@/config/firebase';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { createDescriptiveFieldId } from '@/components/form/utils/transform.utils';
import { SurveyConfig, SurveyResponse } from '@/types';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { baseRoute } from '@/routes';
import { getOrderedSectionContent } from '@/utils/section-content.utils';

interface AggregatedSeries {
  fieldId: string;
  label: string;
  section?: string;
  counts: Record<string, number>;
  total: number;
  type?: 'bar' | 'histogram';
  orderedValues?: string[];
  colors?: Record<string, string | undefined>;
}

function computeAggregations(
  responses: SurveyResponse[],
  config: SurveyConfig | undefined,
  options: {
    ratingScalesById: Record<string, any>;
    ratingScalesByName: Record<string, any>;
    radioSetsById: Record<string, any>;
    radioSetsByName: Record<string, any>;
    selectSetsById: Record<string, any>;
    selectSetsByName: Record<string, any>;
    multiSetsById: Record<string, any>;
    multiSetsByName: Record<string, any>;
  }
) {
  const normalizeKey = (v: string) => String(v ?? '').toLowerCase().trim();
  const normalizeStrict = (v: string) => normalizeKey(v).replace(/[^a-z0-9]+/g, '-');
  const addColorKeys = (colors: Record<string, string | undefined>, value?: string, label?: string, color?: string) => {
    if (!value && !label) return;
    const entries = [value, label].filter(Boolean) as string[];
    for (const e of entries) {
      const n = normalizeKey(e);
      const s = normalizeStrict(e);
      if (color) {
        colors[e] = color;
        colors[n] = color;
        colors[s] = color;
      }
    }
  };
  const defaultColorForValue = (raw: string): string | undefined => {
    const k = normalizeKey(raw);
    if (k === 'high' || k === 'very high' || k === 'critical') return '#ef4444';
    if (k === 'medium' || k === 'moderate') return '#f59e0b';
    if (k === 'low' || k === 'very low') return '#16a34a';
    if (k === 'not important' || k === 'not-important' || k === 'none' || k === 'n/a') return '#6b7280';
    if (k === 'yes' || k === 'true') return '#16a34a';
    if (k === 'no' || k === 'false') return '#ef4444';
    if (k === 'both' || k === 'mixed') return '#0ea5e9';
    return undefined;
  };
  const fieldIdToLabel: Record<string, string> = {};
  const fieldIdToSection: Record<string, string> = {};
  const fieldIdToMeta: Record<string, {
    type?: string;
    ratingScaleId?: string;
    ratingScaleName?: string;
    radioOptionSetId?: string;
    radioOptionSetName?: string;
    selectOptionSetId?: string;
    selectOptionSetName?: string;
    multiSelectOptionSetId?: string;
    multiSelectOptionSetName?: string;
    inlineOptions?: Array<{ value: string; label: string; color?: string }>;
    labelHistory?: Array<{ label: string; changedAt: string; changedBy?: string }>;
  }> = {};
  const fieldIdToDescriptiveId: Record<string, string> = {};
  const fieldIdToPossibleKeys: Record<string, string[]> = {};
  if (config) {
    config.sections.forEach((section) => {
      section.fields.forEach((f) => {
        fieldIdToLabel[f.id] = f.label;
        fieldIdToSection[f.id] = section.title;
        fieldIdToMeta[f.id] = {
          type: f.type,
          ratingScaleId: f.ratingScaleId,
          ratingScaleName: (f as any).ratingScaleName,
          radioOptionSetId: (f as any).radioOptionSetId,
          radioOptionSetName: (f as any).radioOptionSetName,
          selectOptionSetId: (f as any).selectOptionSetId,
          selectOptionSetName: (f as any).selectOptionSetName,
          multiSelectOptionSetId: (f as any).multiSelectOptionSetId,
          multiSelectOptionSetName: (f as any).multiSelectOptionSetName,
          inlineOptions: f.options as any,
          labelHistory: f.labelHistory as any,
        };
        try { fieldIdToDescriptiveId[f.id] = createDescriptiveFieldId(section as any, f as any); } catch {}
        const possible: string[] = [f.id];
        // Slug-based descriptive id (current)
        try { possible.push(createDescriptiveFieldId(section as any, f as any)); } catch {}
        // Pretty label forms often used in exports or earlier versions
        const prettySpace = `${section.title} ${f.label}`;
        const prettyDash = `${section.title} - ${f.label}`;
        possible.push(prettySpace, prettyDash);
        // Also add slug variations using dashes and spaces
        const sectionSlug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const fieldSlug = f.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        possible.push(`${sectionSlug}_${fieldSlug}`, `${sectionSlug}-${fieldSlug}`, `${sectionSlug} ${fieldSlug}`);
        if (Array.isArray(f.labelHistory)) {
          for (const h of f.labelHistory) {
            try {
              const tempField: any = { ...f, label: h.label };
              possible.push(createDescriptiveFieldId(section as any, tempField));
              const prettySpaceH = `${section.title} ${h.label}`;
              const prettyDashH = `${section.title} - ${h.label}`;
              possible.push(prettySpaceH, prettyDashH);
              const fieldSlugH = h.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
              possible.push(`${sectionSlug}_${fieldSlugH}`, `${sectionSlug}-${fieldSlugH}`, `${sectionSlug} ${fieldSlugH}`);
            } catch {}
          }
        }
        fieldIdToPossibleKeys[f.id] = Array.from(new Set(possible));
      });
      section.subsections.forEach((ss) => {
        ss.fields.forEach((f) => {
          fieldIdToLabel[f.id] = f.label;
          fieldIdToSection[f.id] = section.title;
          fieldIdToMeta[f.id] = {
            type: f.type,
            ratingScaleId: f.ratingScaleId,
            ratingScaleName: (f as any).ratingScaleName,
            radioOptionSetId: (f as any).radioOptionSetId,
            radioOptionSetName: (f as any).radioOptionSetName,
            selectOptionSetId: (f as any).selectOptionSetId,
            selectOptionSetName: (f as any).selectOptionSetName,
            multiSelectOptionSetId: (f as any).multiSelectOptionSetId,
            multiSelectOptionSetName: (f as any).multiSelectOptionSetName,
            inlineOptions: f.options as any,
            labelHistory: f.labelHistory as any,
          };
          try { fieldIdToDescriptiveId[f.id] = createDescriptiveFieldId(section as any, f as any); } catch {}
          const possible: string[] = [f.id];
          // Slug-based descriptive id (current)
          try { possible.push(createDescriptiveFieldId(section as any, f as any)); } catch {}
          // Pretty label forms often used in exports or earlier versions
          const prettySpace = `${section.title} ${f.label}`;
          const prettyDash = `${section.title} - ${f.label}`;
          possible.push(prettySpace, prettyDash);
          // Also add slug variations using dashes and spaces
          const sectionSlug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          const fieldSlug = f.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          possible.push(`${sectionSlug}_${fieldSlug}`, `${sectionSlug}-${fieldSlug}`, `${sectionSlug} ${fieldSlug}`);
          if (Array.isArray(f.labelHistory)) {
            for (const h of f.labelHistory) {
              try {
                const tempField: any = { ...f, label: h.label };
                possible.push(createDescriptiveFieldId(section as any, tempField));
                const prettySpaceH = `${section.title} ${h.label}`;
                const prettyDashH = `${section.title} - ${h.label}`;
                possible.push(prettySpaceH, prettyDashH);
                const fieldSlugH = h.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                possible.push(`${sectionSlug}_${fieldSlugH}`, `${sectionSlug}-${fieldSlugH}`, `${sectionSlug} ${fieldSlugH}`);
              } catch {}
            }
          }
          fieldIdToPossibleKeys[f.id] = Array.from(new Set(possible));
        });
      });
    });
  }

  const series: AggregatedSeries[] = [];
  const fieldAggregations: Record<string, Record<string, number>> = {};

  // Initialize aggregation buckets for every known field id
  Object.keys(fieldIdToLabel).forEach((fid) => { fieldAggregations[fid] = {}; });

  for (const resp of responses) {
    const r = resp.responses || {};
    // For every configured field, read value either by raw id or descriptive id
    for (const fid of Object.keys(fieldIdToLabel)) {
      const keys = fieldIdToPossibleKeys[fid] || [fid, fieldIdToDescriptiveId[fid]].filter(Boolean) as string[];
      let value: any = undefined;
      for (const k of keys) {
        if (r[k] !== undefined) { value = r[k]; break; }
      }
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          const vv = String(v ?? '');
          fieldAggregations[fid][vv] = (fieldAggregations[fid][vv] || 0) + 1;
        });
      } else {
        const vv = String(value ?? '');
        fieldAggregations[fid][vv] = (fieldAggregations[fid][vv] || 0) + 1;
      }
    }
  }

  Object.entries(fieldAggregations).forEach(([fieldId, counts]) => {
    const uniqueCount = Object.keys(counts).length;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    const meta = fieldIdToMeta[fieldId] || {};
    const type = meta.type;

    // Build option ordering and colors when available
    let orderedValues: string[] | undefined;
    const colors: Record<string, string | undefined> = {};

    const attachColors = (opts?: Array<{ value: string; label: string; color?: string }>) => {
      if (!opts) return;
      opts.forEach((o) => {
        addColorKeys(colors, o.value, o.label, o.color);
      });
    };

    if (type === 'rating') {
      const scale = (meta.ratingScaleId && options.ratingScalesById[meta.ratingScaleId])
        || (meta.ratingScaleName && options.ratingScalesByName[normalizeKey(meta.ratingScaleName)]);
      if (scale) {
      const opts = [...(scale.options || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      orderedValues = opts.map((o: any) => o.value);
      attachColors(opts);
      }
    } else if (type === 'radio' || type === 'select') {
      const set = (meta.radioOptionSetId && options.radioSetsById[meta.radioOptionSetId])
        || (meta.radioOptionSetName && options.radioSetsByName[normalizeKey(meta.radioOptionSetName)])
        || (meta.selectOptionSetId && options.selectSetsById[meta.selectOptionSetId])
        || (meta.selectOptionSetName && options.selectSetsByName[normalizeKey(meta.selectOptionSetName)]);
      if (set) {
        const opts = [...(set.options || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        orderedValues = opts.map((o: any) => o.value);
        attachColors(opts);
      }
    } else if (type === 'multiselect' || type === 'multiselectdropdown') {
      const set = (meta.multiSelectOptionSetId && options.multiSetsById[meta.multiSelectOptionSetId])
        || (meta.multiSelectOptionSetName && options.multiSetsByName[normalizeKey(meta.multiSelectOptionSetName)]);
      if (set) {
        const opts = [...(set.options || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        orderedValues = opts.map((o: any) => o.value);
        attachColors(opts);
      }
    } else if (meta.inlineOptions && meta.inlineOptions.length > 0) {
      orderedValues = meta.inlineOptions.map((o) => o.value);
      attachColors(meta.inlineOptions);
    }

    // Numeric histogram for number fields
    if (type === 'number') {
      const numericValues: number[] = [];
      Object.entries(counts).forEach(([k, c]) => {
        const v = Number(k);
        if (!Number.isNaN(v)) {
          for (let i = 0; i < c; i++) numericValues.push(v);
        }
      });
      if (numericValues.length > 0) {
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const bucketCount = 10;
        const width = (max - min) || 1;
        const buckets: Record<string, number> = {};
        for (let i = 0; i < bucketCount; i++) {
          const from = min + (i / bucketCount) * width;
          const to = min + ((i + 1) / bucketCount) * width;
          const label = `${Math.round(from)}-${Math.round(to)}`;
          buckets[label] = 0;
        }
        numericValues.forEach((v) => {
          const i = Math.min(bucketCount - 1, Math.floor(((v - min) / width) * bucketCount));
          const from = min + (i / bucketCount) * width;
          const to = min + ((i + 1) / bucketCount) * width;
          const label = `${Math.round(from)}-${Math.round(to)}`;
          buckets[label] = (buckets[label] || 0) + 1;
        });
        series.push({
          fieldId,
          label: fieldIdToLabel[fieldId] || fieldId,
          section: fieldIdToSection[fieldId],
          counts: buckets,
          total,
          type: 'histogram',
        });
        return;
      }
    }

    // Apply default semantic colors where missing
    Object.keys(counts).forEach((k) => {
      const n = normalizeKey(k);
      const s = normalizeStrict(k);
      if (!colors[k] && !colors[n] && !colors[s]) {
        const fallback = defaultColorForValue(k);
        if (fallback) {
          colors[k] = fallback;
          colors[n] = fallback;
          colors[s] = fallback;
        }
      }
    });

    series.push({
      fieldId,
      label: fieldIdToLabel[fieldId] || fieldId,
      section: fieldIdToSection[fieldId],
      counts,
      total,
      type: 'bar',
      orderedValues,
      colors,
    });
  });

  return series;
}

const BarChart: React.FC<{ 
  counts: Record<string, number>; 
  total: number; 
  orderedValues?: string[]; 
  colors?: Record<string, string | undefined>; 
  showPercent?: boolean; 
}> = ({ counts, total, orderedValues, colors, showPercent }) => {
  const baseEntries = Object.entries(counts);
  const entries = orderedValues && orderedValues.length > 0
    ? orderedValues.filter(v => counts[v] !== undefined).map(v => [v, counts[v]] as [string, number])
    : baseEntries.sort((a, b) => b[1] - a[1]);
    
  // Map custom color names to actual CSS colors
  const colorNameMap: Record<string, string> = {
    'green-light': '#10b981',
    'blue-light': '#3b82f6', 
    'yellow-light': '#f59e0b',
    'red-light': '#ef4444',
    'purple-light': '#8b5cf6',
    'orange-light': '#f97316',
    'pink-light': '#ec4899',
    'cyan-light': '#06b6d4',
    'lime-light': '#84cc16',
    'indigo-light': '#6366f1'
  };
  

  return (
    <div className="space-y-1">
      {entries.map(([label, value], idx) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        const lower = label?.toString().toLowerCase?.() || '';
        const strict = lower.replace(/[^a-z0-9]+/g, '-');
        // Function to get color based on percentage with gradients
        const getPercentageColor = (percentage: number): string => {
          // Clamp percentage to 0-100 range
          const pct = Math.max(0, Math.min(100, percentage));
          
          if (pct <= 25) {
            // Red gradient: 0-25% (dark red to lighter red)
            const intensity = pct / 25; // 0 to 1
            const r = Math.round(139 + (239 - 139) * intensity); // 139 to 239
            const g = Math.round(0 + (68 - 0) * intensity);      // 0 to 68  
            const b = Math.round(0 + (68 - 0) * intensity);      // 0 to 68
            return `rgb(${r}, ${g}, ${b})`;
          } else if (pct <= 50) {
            // Orange gradient: 25.1-50% (red to orange)
            const intensity = (pct - 25) / 25; // 0 to 1
            const r = Math.round(239 + (245 - 239) * intensity); // 239 to 245
            const g = Math.round(68 + (158 - 68) * intensity);   // 68 to 158
            const b = Math.round(68 + (11 - 68) * intensity);    // 68 to 11
            return `rgb(${r}, ${g}, ${b})`;
          } else if (pct <= 75) {
            // Blue gradient: 50.1-75% (orange to blue)
            const intensity = (pct - 50) / 25; // 0 to 1
            const r = Math.round(245 + (59 - 245) * intensity);  // 245 to 59
            const g = Math.round(158 + (130 - 158) * intensity); // 158 to 130
            const b = Math.round(11 + (246 - 11) * intensity);   // 11 to 246
            return `rgb(${r}, ${g}, ${b})`;
          } else {
            // Green gradient: 75.1-100% (blue to green)
            const intensity = (pct - 75) / 25; // 0 to 1
            const r = Math.round(59 + (16 - 59) * intensity);    // 59 to 16
            const g = Math.round(130 + (185 - 130) * intensity); // 130 to 185
            const b = Math.round(246 + (129 - 246) * intensity); // 246 to 129
            return `rgb(${r}, ${g}, ${b})`;
          }
        };

        const candidate = (colors?.[label] ?? colors?.[lower] ?? colors?.[strict]);
        const fallback = getPercentageColor(pct); // Use percentage-based color as fallback
        
        // Fix: Ensure we always have a valid color
        let color = fallback; // Start with percentage-based fallback
        if (candidate && candidate !== 'transparent' && candidate !== 'rgba(0,0,0,0)' && candidate.trim() !== '') {
          // Check if it's a custom color name that needs mapping
          color = colorNameMap[candidate] || candidate;
        }
        
        const widthPct = Math.max(0.5, pct); // Ensure minimum visibility for debugging
        
        // Debug logging (remove in production)
        if (!color || color === 'transparent') {
          console.log(`No color for ${label}:`, { candidate, fallback, color });
        }
        
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="w-48 text-sm text-gray-700 truncate" title={label}>
              {label || '—'}
            </div>
            <div className="flex-1 bg-gray-100 rounded">
              <div
                className="h-4 rounded"
                style={{ 
                  width: `${widthPct}%`, 
                  backgroundColor: color,
                  minWidth: '2px' // Ensure visibility even for small values
                }}
                title={`${label}: ${value} (${pct.toFixed(1)}%)`}
              />
            </div>
            <div className="w-20 text-xs text-gray-600 text-right">
              {showPercent ? `${pct.toFixed(0)}%` : value}
            </div>
            {/* Debug info - remove in production */}
            <div className="text-xs text-gray-400 w-16 truncate" title={color} />
          </div>
        );
      })}
    </div>
  );
};

const Histogram: React.FC<{ counts: Record<string, number> }> = ({ counts }) => {
  const entries = Object.entries(counts);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="grid grid-cols-10 gap-1 items-end h-28">
      {entries.map(([bucket, value]) => (
        <div key={bucket} className="flex flex-col items-center">
          <div className="w-full bg-amber-500 rounded" style={{ height: `${(value / max) * 100}%` }} title={`${bucket}: ${value}`} />
          <div className="text-[10px] text-gray-600 mt-1 rotate-45 origin-top-left truncate w-10" title={bucket}>{bucket}</div>
        </div>
      ))}
    </div>
  );
};

const Sparkline: React.FC<{ data: Array<{ x: string; y: number }> }> = ({ data }) => {
  // simple SVG sparkline
  const width = 280;
  const height = 60;
  const padding = 6;
  const ys = data.map((d) => d.y);
  const maxY = Math.max(1, ...ys);
  return (
    <svg width={width} height={height} className="text-amber-600">
      <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={data.map((d, i) => `${padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2)},${height - padding - (d.y / maxY) * (height - padding * 2)}`).join(' ')} />
    </svg>
  );
};

export const AdminVisualizationPage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SurveyConfig | undefined>(undefined);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showPercent, setShowPercent] = useState<boolean>(false);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [subsectionFilter, setSubsectionFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());
  const [collapsedSubsections, setCollapsedSubsections] = useState<Set<string>>(() => new Set());
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(() => new Set());

  const toggleSectionCollapsed = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
      return next;
    });
  };

  const toggleSubsectionCollapsed = (subsectionId: string) => {
    setCollapsedSubsections(prev => {
      const next = new Set(prev);
      if (next.has(subsectionId)) next.delete(subsectionId); else next.add(subsectionId);
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedSections(new Set());
    setCollapsedSubsections(new Set());
  };

  const collapseAll = () => {
    const allSectionIds = (config?.sections || []).map((s) => s.id);
    const allSubsectionIds = (config?.sections || []).flatMap((s) => (s.subsections || []).map((ss) => ss.id));
    setCollapsedSections(new Set(allSectionIds));
    setCollapsedSubsections(new Set(allSubsectionIds));
  };

  // Option sets for smarter ordering/colors
  const { state: surveyDataState } = useSurveyData();
  const ratingScalesById = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.ratingScales || []).forEach((s: any) => rec[s.id] = s);
    return rec;
  }, [surveyDataState.ratingScales]);
  const ratingScalesByName = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.ratingScales || []).forEach((s: any) => rec[(s.name || '').toLowerCase()] = s);
    return rec;
  }, [surveyDataState.ratingScales]);
  const radioSetsById = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.radioOptionSets || []).forEach((s: any) => rec[s.id] = s);
    return rec;
  }, [surveyDataState.radioOptionSets]);
  const radioSetsByName = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.radioOptionSets || []).forEach((s: any) => rec[(s.name || '').toLowerCase()] = s);
    return rec;
  }, [surveyDataState.radioOptionSets]);
  const selectSetsById = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.selectOptionSets || []).forEach((s: any) => rec[s.id] = s);
    return rec;
  }, [surveyDataState.selectOptionSets]);
  const selectSetsByName = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.selectOptionSets || []).forEach((s: any) => rec[(s.name || '').toLowerCase()] = s);
    return rec;
  }, [surveyDataState.selectOptionSets]);
  const multiSetsById = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.multiSelectOptionSets || []).forEach((s: any) => rec[s.id] = s);
    return rec;
  }, [surveyDataState.multiSelectOptionSets]);
  const multiSetsByName = useMemo(() => {
    const rec: Record<string, any> = {};
    (surveyDataState.multiSelectOptionSets || []).forEach((s: any) => rec[(s.name || '').toLowerCase()] = s);
    return rec;
  }, [surveyDataState.multiSelectOptionSets]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!instanceId) return;
      try {
        setLoading(true);
        setError(null);
        const [instanceResponses, legacyResponses, instances] = await Promise.all([
          firestoreHelpers.getSurveyResponsesFromCollection(instanceId).catch(() => []),
          firestoreHelpers.getSurveyResponses(instanceId).catch(() => []),
          firestoreHelpers.getSurveyInstances(),
        ]);
        const instance = instances.find((i) => i.id === instanceId);
        const cfg = instance ? await firestoreHelpers.getSurveyConfig(instance.configId) : undefined;
        if (!isMounted) return;
        // Merge instance-specific and legacy responses
        const combined = [...instanceResponses, ...legacyResponses];
        setResponses(combined);
        setConfig(cfg || undefined);
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [instanceId]);

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

  const series = useMemo(
    () => computeAggregations(filteredResponses, config, {
      ratingScalesById,
      ratingScalesByName,
      radioSetsById,
      radioSetsByName,
      selectSetsById,
      selectSetsByName,
      multiSetsById,
      multiSetsByName,
    }),
    [filteredResponses, config, ratingScalesById, ratingScalesByName, radioSetsById, radioSetsByName, selectSetsById, selectSetsByName, multiSetsById, multiSetsByName]
  );

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

  const searchTerm = search.trim().toLowerCase();
  const seriesMatchesSearch = (s: AggregatedSeries, context?: { section?: string; subsection?: string }) => {
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

  const availableFields = useMemo(() => {
    const items: Array<{ id: string; label: string }> = [];
    orderedSections.forEach((section) => {
      const contentItems = getOrderedSectionContent(section);
      contentItems.forEach((ci) => {
        if (ci.type === 'field') {
          const field: any = ci.data;
          const s = fieldIdToSeries[field.id];
          if (s) items.push({ id: s.fieldId, label: `${section.title} • ${s.label}` });
        } else {
          const subsection: any = ci.data;
          (subsection.fields || []).forEach((f: any) => {
            const s = fieldIdToSeries[f.id];
            if (s) items.push({ id: s.fieldId, label: `${section.title} • ${subsection.title} • ${s.label}` });
          });
        }
      });
    });
    return items;
  }, [orderedSections, fieldIdToSeries]);

  const showAllFields = () => setHiddenFields(new Set());

  const submissionsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredResponses.forEach((r) => {
      const d = new Date(r.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const keys = Object.keys(counts).sort();
    return keys.map((k) => ({ x: k, y: counts[k] }));
  }, [filteredResponses]);

  const totalFiltered = filteredResponses.length;
  const todayCount = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const found = submissionsByDay.find((d) => d.x === todayKey);
    return found ? found.y : 0;
  }, [submissionsByDay]);

  const handleHiddenFieldsSelect: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setHiddenFields(new Set(selected));
  };

  const downloadCsv = () => {
    const rows: string[] = [];
    rows.push(['Section', 'Field', 'Value', 'Count'].join(','));
    for (const s of series) {
      const sectionName = s.section || '';
      for (const [value, count] of Object.entries(s.counts)) {
        const safe = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
        rows.push([safe(sectionName), safe(s.label), safe(value), count].join(','));
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aggregated-${instanceId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading data..." />;

  if (error)
    return (
      <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
      <div className="text-center space-y-4">
          <p className="text-gray-700">{error}</p>
          <Button onClick={() => navigate(`${baseRoute}/admin`)} variant="primary">Back to Admin</Button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-amber-50/30 flex flex-col">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Survey Data Visualization</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadCsv}>Download CSV</Button>
            <Button variant="outline" onClick={() => navigate(`${baseRoute}/admin`)}>Back</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex-1 flex flex-col min-h-0 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 flex-shrink-0">
            <div className="p-4 border rounded-lg">
              <div className="text-xs text-gray-500">Instance</div>
              <div className="text-sm font-mono bg-gray-50 px-2 py-1 rounded mt-1 truncate" title={instanceId}>{instanceId}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-xs text-gray-500">Responses</div>
              <div className="text-2xl font-semibold">{responses.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-xs text-gray-500">Filtered range</div>
              <div className="text-sm text-gray-700 min-h-[1.5rem]">
                {startDate || endDate ? `${startDate ? new Date(`${startDate}T00:00:00`).toLocaleDateString() : '—'} → ${endDate ? new Date(`${endDate}T00:00:00`).toLocaleDateString() : '—'}` : 'All time'}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-xs text-gray-500">Daily submissions</div>
              <Sparkline data={submissionsByDay} />
              <div className="text-xs text-gray-700 mt-2">Today: {todayCount} • In range: {totalFiltered}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6 items-end flex-shrink-0">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear Dates</Button>
              <Button
                variant="outline"
                onClick={() => setShowPercent((v) => !v)}
                className="px-3 py-2"
                title="Toggle percentage values"
              >
                {showPercent ? 'percent' : 'count'}
              </Button>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Section</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setSubsectionFilter('all'); }}>
                <option value="all">All sections</option>
                {sectionNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Subsection</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={subsectionFilter} onChange={(e) => setSubsectionFilter(e.target.value)}>
                <option value="all">All subsections</option>
                {(sectionFilter !== 'all' ? (subsectionsBySection[sectionFilter] || []) : orderedSections.flatMap(sec => (sec.subsections || []).map(ss => ({ id: ss.id, title: `${sec.title} • ${ss.title}` })))).map((ss) => (
                  <option key={ss.id} value={ss.id}>{ss.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Search</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-700 mb-1">Hide fields</label>
              <div className="flex items-center gap-2">
                <select multiple size={4} className="w-auto min-w-max px-2 py-2 border border-gray-300 rounded-md bg-white" value={Array.from(hiddenFields)} onChange={handleHiddenFieldsSelect}>
                  {availableFields.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" className="text-xs whitespace-nowrap" onClick={showAllFields}>Reset</Button>
                <Button size="sm" variant="outline" className="text-xs whitespace-nowrap" onClick={expandAll}>Expand all</Button>
                <Button size="sm" variant="outline" className="text-xs whitespace-nowrap" onClick={collapseAll}>Collapse all</Button>
              </div>
            </div>
          </div>

          <div>
          <ScrollableContent showScrollIndicators={true} smoothScroll={true} mobileOptimized={false}>
            <div className="w-full">
            {series.length === 0 ? (
              <p className="text-gray-500">No aggregations available yet.</p>
            ) : (
              <div className="space-y-10 pb-4">
                {orderedSections
                .filter((section) => sectionFilter === 'all' || section.title === sectionFilter)
                .map((section) => {
                  const contentItems = getOrderedSectionContent(section);
                  // Determine if section has any charts to show (respect search)
                  const hasAny = contentItems.some((ci) => {
                    if (ci.type === 'field') {
                      const s = fieldIdToSeries[(ci.data as any).id];
                      return s && !hiddenFields.has(s.fieldId) && seriesMatchesSearch(s, { section: section.title });
                    } else {
                      const subsection: any = ci.data;
                      if (subsectionFilter !== 'all' && subsection.id !== subsectionFilter) return false;
                      return subsection.fields.some((f: any) => {
                        const s = fieldIdToSeries[f.id];
                        return s && !hiddenFields.has(s.fieldId) && seriesMatchesSearch(s, { section: section.title, subsection: subsection.title });
                      });
                    }
                  });
                  if (!hasAny) return null;
                  return (
                    <div key={section.id} className="border-b pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold">{section.title}</h2>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSectionCollapsed(section.id)}
                          className="text-xs"
                        >
                          {collapsedSections.has(section.id) ? 'Expand' : 'Collapse'}
                        </Button>
                      </div>
                      {!collapsedSections.has(section.id) && (
                      <div className="space-y-6">
                        {contentItems.map((ci) => {
                          if (ci.type === 'subsection') {
                            const subsection: any = ci.data;
                            if (subsectionFilter !== 'all' && subsection.id !== subsectionFilter) return null;
                            const charts = subsection.fields
                              .map((f: any) => fieldIdToSeries[f.id])
                              .filter((s: any) => !!s && !hiddenFields.has(s.fieldId) && seriesMatchesSearch(s, { section: section.title, subsection: subsection.title }));
                            if (charts.length === 0) return null;
                            const isCollapsed = collapsedSubsections.has(subsection.id);
                            return (
                              <div key={subsection.id} className="bg-blu-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between p-4">
                                  <h3 className="text-base font-semibold text-gray-800">{subsection.title}</h3>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleSubsectionCollapsed(subsection.id)}
                                      className="text-xs"
                                    >
                                      {isCollapsed ? 'Expand' : 'Collapse'}
                                    </Button>
                                  </div>
                                </div>
                                {!isCollapsed && (
                                  <div className="space-y-6 p-4 pt-0">
                                    {charts.map((s: AggregatedSeries) => (
                                      <div key={s.fieldId}>
                                        <div className="flex items-center justify-between mb-2">
                                          <h4 className="text-sm font-medium">{s.label}</h4>
                                        </div>
                                        {s.type === 'histogram' ? (
                                          <Histogram counts={s.counts} />
                                        ) : (
                                          <BarChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} />
                                            )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (ci.type === 'field') {
                            const field: any = ci.data;
                            const s = fieldIdToSeries[field.id];
                            if (!s || !seriesMatchesSearch(s, { section: section.title }) || hiddenFields.has(s.fieldId)) return null;
                            return (
                              <div key={field.id}>
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-base font-medium">{s.label}</h3>
                                </div>
                                {s.type === 'histogram' ? (
                                  <Histogram counts={s.counts} />
                                ) : (
                                  <BarChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} />
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </ScrollableContent>
          </div>
        </div>
      </div>
    </div>
  );
};
