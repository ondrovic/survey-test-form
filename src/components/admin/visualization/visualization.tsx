import { Button, LoadingSpinner, MultiSelect, ScrollableContent } from '@/components/common';
import { createDescriptiveFieldId } from '@/components/form/utils/transform.utils';
import { firestoreHelpers } from '@/config/firebase';
import { useSurveyData } from '@/contexts/survey-data-context/index';
import { baseRoute } from '@/routes';
import { SurveyConfig, SurveyResponse } from '@/types';
import { getOrderedSectionContent } from '@/utils/section-content.utils';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface AggregatedSeries {
  fieldId: string;
  label: string;
  section?: string;
  counts: Record<string, number>;
  total: number;
  type?: 'bar' | 'histogram';
  orderedValues?: string[];
  colors?: Record<string, string | undefined>;
  neutralMode?: boolean;
}

type ChartType = 'horizontal' | 'vertical' | 'donut';

type VisualizationPreferences = {
  defaultChartType: ChartType;
  setDefaultChartType: (t: ChartType) => void;
  perFieldChartType: Record<string, ChartType | undefined>;
  setPerFieldChartType: (fieldId: string, t: ChartType | undefined) => void;
};

const VisualizationPreferencesContext = React.createContext<VisualizationPreferences | null>(null);

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
        try { fieldIdToDescriptiveId[f.id] = createDescriptiveFieldId(section as any, f as any); } catch (e) { /* Ignore error */ }
        const possible: string[] = [f.id];
        // Slug-based descriptive id (current)
        try { possible.push(createDescriptiveFieldId(section as any, f as any)); } catch (e) { /* Ignore error */ }
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
            } catch (e) { /* Ignore error */ }
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
          try { fieldIdToDescriptiveId[f.id] = createDescriptiveFieldId(section as any, f as any); } catch (e) { /* Ignore error */ }
          const possible: string[] = [f.id];
          // Slug-based descriptive id (current)
          try { possible.push(createDescriptiveFieldId(section as any, f as any)); } catch (e) { /* Ignore error */ }
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
              } catch (e) { /* Ignore error */ }
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

    // Determine neutral mode for free-text-like fields
    const typeLower = String(type || '').toLowerCase();
    const labelLower = String(fieldIdToLabel[fieldId] || '').toLowerCase();
    const idLower = String(fieldId || '').toLowerCase();
    const looksLikeFreeText = !orderedValues || orderedValues.length === 0;
    const typeHintFreeText = ['text', 'textarea', 'email', 'name', 'phone', 'url'].includes(typeLower);
    const labelHintFreeText = /(name|email|e-mail|phone|title|company|organization|org|dept|department|address|city|state|country)/i.test(labelLower);
    const idHintFreeText = /(name|email|e[-_]?mail|phone|title|company|org|dept|department|address|city|state|country)/i.test(idLower);
    const neutralMode = (typeHintFreeText || labelHintFreeText || idHintFreeText || (looksLikeFreeText && typeLower !== 'number' && uniqueCount > 8));

    series.push({
      fieldId,
      label: fieldIdToLabel[fieldId] || fieldId,
      section: fieldIdToSection[fieldId],
      counts,
      total,
      type: 'bar',
      orderedValues,
      colors,
      neutralMode,
    });
  });

  return series;
}

// Unified color utilities for charts
const __palette = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#f97316', '#0ea5e9', '#84cc16', '#a855f7'
];

const __nameColorMap: Record<string, string> = {
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

const normalizeColorCandidate = (candidate?: string): string | undefined => {
  if (!candidate) return undefined;
  const c = candidate.trim();
  return __nameColorMap[c] || c;
};

const normalizeEffectiveColor = (candidate?: string): string | undefined => {
  const c = normalizeColorCandidate(candidate);
  if (!c) return undefined;
  const v = c.trim();
  const lower = v.toLowerCase();
  // Common transparent tokens
  if (lower === 'transparent' || lower === 'none' || lower === 'inherit') return undefined;
  // 4-digit hex with alpha (#RGBA) and alpha=0
  if (/^#([0-9a-f]{4})$/i.test(lower)) {
    const m = lower.match(/^#([0-9a-f]{4})$/i)!;
    const alphaNibble = m[1].slice(3);
    if (alphaNibble === '0') return undefined;
  }
  // 8-digit hex with alpha (#RRGGBBAA) and alpha=00
  if (/^#([0-9a-f]{8})$/i.test(lower)) {
    const m = lower.match(/^#([0-9a-f]{8})$/i)!;
    const alphaByte = m[1].slice(6);
    if (alphaByte === '00') return undefined;
  }
  // rgba()/hsla() with alpha 0
  if (/^rgba\(/i.test(lower) || /^hsla\(/i.test(lower)) {
    const alphaPart = lower.replace(/^.*\((.*)\)$/, '$1').split(',').pop()?.trim() || '';
    const alpha = parseFloat(alphaPart);
    if (!Number.isNaN(alpha) && alpha <= 0) return undefined;
  }
  // Edge case: #0000 shorthand
  if (lower === '#0000') return undefined;
  return v;
};

const isSemanticLabel = (lower: string): boolean => (
  [
    'critical', 'high', 'very high', 'medium', 'moderate', 'low', 'very low',
    'yes', 'no', 'true', 'false', 'not important', 'not-important', 'none', 'n/a',
    'both', 'mixed'
  ].includes(lower)
);

const semanticColorFor = (lower: string): string | undefined => {
  const map: Record<string, string> = {
    'critical': '#ef4444',
    'high': '#ef4444', 'very high': '#ef4444',
    'medium': '#f59e0b', 'moderate': '#f59e0b',
    'low': '#16a34a', 'very low': '#16a34a',
    'yes': '#16a34a', 'true': '#16a34a',
    'no': '#ef4444', 'false': '#ef4444',
    'not important': '#6b7280', 'not-important': '#6b7280', 'none': '#6b7280', 'n/a': '#6b7280',
    'both': '#0ea5e9', 'mixed': '#0ea5e9'
  };
  return map[lower];
};

const paletteColorFor = (label: string, salt: number): string => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0;
  const idx = Math.abs(hash + salt) % __palette.length;
  return __palette[idx];
};

const __neutralGray = '#9ca3af';
const hashSaltFrom = (text: string): number => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const isTransparentToken = (value?: string): boolean => {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  if (v === '' || v === 'transparent' || v === 'none' || v === 'inherit' || v === '#0000') return true;
  if (/^#([0-9a-f]{4})$/i.test(v)) {
    const alphaNibble = v.slice(-1);
    if (alphaNibble === '0') return true;
  }
  if (/^#([0-9a-f]{8})$/i.test(v)) {
    const alphaByte = v.slice(-2);
    if (alphaByte === '00') return true;
  }
  if (/^rgba\(/i.test(v) || /^hsla\(/i.test(v)) {
    const alphaPart = v.replace(/^.*\((.*)\)$/, '$1').split(',').pop()?.trim() || '';
    const alpha = parseFloat(alphaPart);
    if (!Number.isNaN(alpha) && alpha <= 0) return true;
  }
  return false;
};

const computeColorForLabel = (args: {
  label: string;
  lower: string;
  strict: string;
  colors?: Record<string, string | undefined>;
  neutralMode?: boolean;
  colorSalt?: number;
}): string => {
  const { label, lower, strict, colors, neutralMode, colorSalt } = args;
  const candidateRaw = (colors?.[label] ?? colors?.[lower] ?? colors?.[strict]);
  const candidate = normalizeEffectiveColor(candidateRaw);
  let chosen = candidate
    || (isSemanticLabel(lower) ? semanticColorFor(lower) : undefined)
    || (neutralMode ? __neutralGray : undefined)
    || paletteColorFor(label, colorSalt || 0);
  if (isTransparentToken(chosen)) {
    // Final guardrail to ensure visible colors
    chosen = neutralMode ? __neutralGray : paletteColorFor(label, colorSalt || 0);
  }
  return chosen as string;
};

const BarChart: React.FC<{
  counts: Record<string, number>;
  total: number;
  orderedValues?: string[];
  colors?: Record<string, string | undefined>;
  showPercent?: boolean;
  neutralMode?: boolean;
  colorSalt?: number;
  size?: 'normal' | 'large';
}> = ({ counts, total, orderedValues, colors, showPercent, neutralMode, colorSalt, size: chartSize = 'normal' }) => {
  const baseEntries = Object.entries(counts);
  const entries = orderedValues && orderedValues.length > 0
    ? orderedValues.filter(v => counts[v] !== undefined).map(v => [v, counts[v]] as [string, number])
    : baseEntries.sort((a, b) => b[1] - a[1]);

  // Responsive sizing based on chart size prop
  const isLarge = chartSize === 'large';
  const barHeight = isLarge ? 'h-12' : 'h-8';
  const labelSize = isLarge ? 'text-base' : 'text-sm';
  const valueSize = isLarge ? 'text-xl' : 'text-lg';
  const padding = isLarge ? 'p-4' : 'p-3';
  const spacing = isLarge ? 'space-y-4' : 'space-y-3';
  const gap = isLarge ? 'gap-6' : 'gap-4';

  return (
    <div className={spacing}>
      {entries.map(([label, value]) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        const lower = label?.toString().toLowerCase?.() || '';
        const strict = lower.replace(/[^a-z0-9]+/g, '-');
        const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });

        const widthPct = Math.max(0.5, pct);

        return (
          <div key={label} className={`${spacing} ${padding} bg-gray-50 rounded-lg border border-gray-100`}>
            {/* Label - now on its own line for better readability */}
            <div className={`${labelSize} font-medium text-gray-800 truncate`} title={label}>
              {label || '—'}
            </div>

            {/* Bar container with better spacing */}
            <div className={`flex items-center ${gap}`}>
              <div className={`flex-1 bg-gray-200 rounded-full ${barHeight} overflow-hidden shadow-inner`}>
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                    minWidth: isLarge ? '20px' : '12px' // Ensure visibility even for small values
                  }}
                  title={`${label}: ${value} (${pct.toFixed(1)}%)`}
                />
              </div>

              {/* Value display - larger and more prominent */}
              <div className={`${valueSize} font-bold text-gray-700 min-w-[4rem] text-right`}>
                {showPercent ? `${pct.toFixed(0)}%` : value}
              </div>
            </div>
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
    <div className="w-full">
      <div className="grid gap-2 items-end" style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(40px, 1fr))`, minHeight: '140px' }}>
        {entries.map(([bucket, value]) => (
          <div key={bucket} className="flex flex-col items-center">
            <div className="w-full bg-amber-500 rounded" style={{ height: `${(value / max) * 100}%` }} title={`${bucket}: ${value}`} />
            <div className="mt-2 text-xs text-gray-600 truncate w-full text-center" title={bucket}>{bucket}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VerticalBarChart: React.FC<{
  counts: Record<string, number>;
  total: number;
  orderedValues?: string[];
  colors?: Record<string, string | undefined>;
  showPercent?: boolean;
  neutralMode?: boolean;
  colorSalt?: number;
  size?: 'normal' | 'large';
}> = ({ counts, total, orderedValues, colors, showPercent, neutralMode, colorSalt, size: chartSize = 'normal' }) => {
  const baseEntries = Object.entries(counts);
  const entries = orderedValues && orderedValues.length > 0
    ? orderedValues.filter(v => counts[v] !== undefined).map(v => [v, counts[v]] as [string, number])
    : baseEntries.sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  // Responsive sizing based on chart size prop
  const isLarge = chartSize === 'large';
  const gap = isLarge ? 'gap-4' : 'gap-3';
  const minHeight = isLarge ? '240px' : '180px';
  const barHeightMultiplier = isLarge ? 160 : 120;
  const labelSize = isLarge ? 'text-sm' : 'text-xs';
  const valueSize = isLarge ? 'text-sm' : 'text-xs';
  const minColumnWidth = isLarge ? '48px' : '32px';

  return (
    <div className="w-full">
      <div className={`grid ${gap} items-end`} style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(${minColumnWidth}, 1fr))`, minHeight }}>
        {entries.map(([label, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          const lower = label?.toString().toLowerCase?.() || '';
          const strict = lower.replace(/[^a-z0-9]+/g, '-');
          const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });
          return (
            <div key={label} className="flex flex-col items-center">
              <div className="w-full rounded" style={{ height: `${(value / max) * barHeightMultiplier + 4}px`, backgroundColor: color }} title={`${label}: ${value} (${pct.toFixed(1)}%)`} />
              <div className={`mt-2 ${labelSize} text-gray-700 truncate w-full text-center`} title={label}>{label}</div>
              <div className={`${valueSize} text-gray-500 font-medium`}>{showPercent ? `${pct.toFixed(0)}%` : value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DonutChart: React.FC<{
  counts: Record<string, number>;
  total: number;
  orderedValues?: string[];
  colors?: Record<string, string | undefined>;
  showPercent?: boolean;
  neutralMode?: boolean;
  colorSalt?: number;
  size?: 'normal' | 'large';
}> = ({ counts, total, orderedValues, colors, showPercent, neutralMode, colorSalt, size: chartSize = 'normal' }) => {
  const baseEntries = Object.entries(counts);
  const entries = orderedValues && orderedValues.length > 0
    ? orderedValues.filter(v => counts[v] !== undefined).map(v => [v, counts[v]] as [string, number])
    : baseEntries.sort((a, b) => b[1] - a[1]);

  // Responsive sizing based on chart size prop
  const size = chartSize === 'large' ? 400 : 160; // Increased large size for better modal fit
  const radius = chartSize === 'large' ? 160 : 65;
  const stroke = chartSize === 'large' ? 30 : 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  return (
    <div className={`grid gap-6 items-center ${chartSize === 'large' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
      <div className={`flex justify-center items-center ${chartSize === 'large' ? 'xl:col-span-1' : ''}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          {entries.map(([label, value]) => {
            const fraction = total > 0 ? value / total : 0;
            const dash = fraction * circumference;
            const offset = circumference - cumulative * circumference;
            cumulative += fraction;
            const lower = label?.toString().toLowerCase?.() || '';
            const strict = lower.replace(/[^a-z0-9]+/g, '-');
            const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });
            return (
              <circle
                key={label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                className="transition-all duration-300 hover:stroke-width-[20]"
              />
            );
          })}
          <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700" fontSize={chartSize === 'large' ? "24" : "16"} fontWeight="600">{total}</text>
        </svg>
      </div>
      <div className={`space-y-2 min-w-0 ${chartSize === 'large' ? 'space-y-4' : ''}`}>
        {entries.map(([label, value]) => {
          const fraction = total > 0 ? value / total : 0;
          const lower = label?.toString().toLowerCase?.() || '';
          const strict = lower.replace(/[^a-z0-9]+/g, '-');
          const color = computeColorForLabel({ label, lower, strict, colors, neutralMode, colorSalt });
          const isLongLabel = (label || '').length > 25;

          return (
            <div key={label} className={`flex items-start justify-between gap-3 ${chartSize === 'large' ? 'text-lg' : 'text-sm'}`}>
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className={`inline-block rounded-sm mt-0.5 flex-shrink-0 ${chartSize === 'large' ? 'w-5 h-5' : 'w-3 h-3'}`} style={{ backgroundColor: color }} />
                <span
                  className={`${isLongLabel ? 'line-clamp-2 leading-tight' : 'truncate'} text-gray-800`}
                  title={label}
                >
                  {label || '—'}
                </span>
              </div>
              <span className={`text-gray-600 shrink-0 ml-2 ${chartSize === 'large' ? 'text-lg font-semibold' : ''}`}>{showPercent ? `${(fraction * 100).toFixed(0)}%` : value}</span>
            </div>
          );
        })}
      </div>
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
  const [defaultChartType, setDefaultChartType] = useState<ChartType>('donut');
  const [perFieldChartType, setPerFieldChartTypeState] = useState<Record<string, ChartType | undefined>>({});
  // Legend removed per feedback; keep state out
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showHideFieldsUI, setShowHideFieldsUI] = useState<boolean>(false);
  // Chart modal state
  const [selectedChart, setSelectedChart] = useState<{
    type: 'field' | 'subsection';
    data: any;
    series: AggregatedSeries;
    sectionTitle: string;
    subsectionTitle?: string;
  } | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);
  const [quickRange, setQuickRange] = useState<'all' | '7d' | '30d' | 'month' | 'custom'>('all');
  const [hiddenFieldsQuery] = useState<string>('');

  const setPerFieldChartType = (fieldId: string, t: ChartType | undefined) => {
    setPerFieldChartTypeState((prev) => ({ ...prev, [fieldId]: t }));
  };

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
    console.log('🔍 DEBUG - Building availableFields from orderedSections:', orderedSections.length);
    console.log('🔍 DEBUG - fieldIdToSeries keys:', Object.keys(fieldIdToSeries).length);

    orderedSections.forEach((section) => {
      console.log('🔍 DEBUG - Processing section:', section.title);
      const contentItems = getOrderedSectionContent(section);
      console.log('🔍 DEBUG - Section content items:', contentItems.length);

      contentItems.forEach((ci) => {
        if (ci.type === 'field') {
          const field: any = ci.data;
          const s = fieldIdToSeries[field.id];
          if (s) {
            const label = `${section.title} • ${s.label}`;
            console.log('🔍 DEBUG - Adding direct section field:', label);
            items.push({ id: s.fieldId, label });
          }
        } else {
          const subsection: any = ci.data;
          console.log('🔍 DEBUG - Processing subsection:', subsection.title, 'with', subsection.fields?.length || 0, 'fields');
          (subsection.fields || []).forEach((f: any) => {
            const s = fieldIdToSeries[f.id];
            if (s) {
              const label = `${section.title} • ${subsection.title} • ${s.label}`;
              console.log('🔍 DEBUG - Adding subsection field:', label);
              items.push({ id: s.fieldId, label });
            }
          });
        }
      });
    });

    console.log('🔍 DEBUG - Total availableFields built:', items.length);
    console.log('🔍 DEBUG - Sample field labels:', items.slice(0, 5).map(f => f.label));
    return items;
  }, [orderedSections, fieldIdToSeries]);

  const showAllFields = () => setHiddenFields(new Set());

  const openChartModal = (chartItem: {
    type: 'field' | 'subsection';
    data: any;
    series: AggregatedSeries;
    sectionTitle: string;
    subsectionTitle?: string;
  }) => {
    setSelectedChart(chartItem);
    setIsChartModalOpen(true);
  };

  const closeChartModal = () => {
    setIsChartModalOpen(false);
    setSelectedChart(null);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChartModalOpen) {
        closeChartModal();
      }
    };

    if (isChartModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      document.documentElement.classList.add('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.documentElement.classList.remove('modal-open');
    };
  }, [isChartModalOpen]);

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

  const totalFiltered = filteredResponses.length;
  const todayCount = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const found = submissionsByDay.find((d) => d.x === todayKey);
    return found ? found.y : 0;
  }, [submissionsByDay]);



  const filteredHiddenFieldOptions = useMemo(() => {
    let filtered = availableFields;

    console.log('🔍 DEBUG - availableFields:', availableFields.length);
    console.log('🔍 DEBUG - sectionFilter:', sectionFilter);
    console.log('🔍 DEBUG - subsectionFilter:', subsectionFilter);

    // Filter by section first (using existing sectionFilter)
    if (sectionFilter !== 'all') {
      filtered = filtered.filter((f) => f.label.startsWith(`${sectionFilter} •`));
      console.log('🔍 DEBUG - after section filter:', filtered.length);

      // If subsection is also selected, filter by subsection
      if (subsectionFilter !== 'all') {
        console.log('🔍 DEBUG - applying subsection filter for:', subsectionFilter);
        // Look for fields that contain the subsection pattern
        // Format: "Section • Subsection • Field" or "Section • Field"
        filtered = filtered.filter((f) => {
          const parts = f.label.split(' • ');
          console.log('🔍 DEBUG - field:', f.label, 'parts:', parts);
          if (parts.length === 2) {
            // Direct section field: "Section • Field" - exclude if subsection is selected
            console.log('🔍 DEBUG - excluding direct section field:', f.label);
            return false;
          } else if (parts.length === 3) {
            // Subsection field: "Section • Subsection • Field" - check if subsection matches
            // subsectionFilter is now "Section • Subsection" format, extract just the subsection name
            const subsectionName = parts[1];
            const filterSubsectionName = subsectionFilter.split(' • ')[1] || subsectionFilter;
            const matches = subsectionName === filterSubsectionName;
            console.log('🔍 DEBUG - subsection field:', f.label, 'subsectionName:', subsectionName, 'filterSubsectionName:', filterSubsectionName, 'matches:', matches, 'expected:', subsectionFilter);
            return matches;
          }
          console.log('🔍 DEBUG - unexpected format, excluding:', f.label);
          return false;
        });
        console.log('🔍 DEBUG - after subsection filter:', filtered.length);
      }
      // If only section is selected, include both direct section fields and subsection fields
      // (no additional filtering needed - section filter already handles this)
    }

    // Apply search query filter
    const q = hiddenFieldsQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((f) => f.label.toLowerCase().includes(q));
      console.log('🔍 DEBUG - after search filter:', filtered.length);
    }

    console.log('🔍 DEBUG - final result:', filtered.length, 'fields');
    return filtered;
  }, [availableFields, sectionFilter, subsectionFilter, hiddenFieldsQuery]);



  const applyQuickRange = (range: 'all' | '7d' | '30d' | 'month' | 'custom') => {
    setQuickRange(range);
    if (range === 'all') {
      setStartDate('');
      setEndDate('');
      return;
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
      return;
    }
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setStartDate(fmt(start));
    setEndDate(fmt(end));
  };

  // const downloadCsv = () => {
  //   const rows: string[] = [];
  //   rows.push(['Section', 'Field', 'Value', 'Count'].join(','));
  //   for (const s of series) {
  //     const sectionName = s.section || '';
  //     for (const [value, count] of Object.entries(s.counts)) {
  //       const safe = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  //       rows.push([safe(sectionName), safe(s.label), safe(value), count].join(','));
  //     }
  //   }
  //   const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `aggregated-${instanceId}.csv`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

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
    <VisualizationPreferencesContext.Provider value={{
      defaultChartType,
      setDefaultChartType,
      perFieldChartType,
      setPerFieldChartType,
    }}>
      <div className={`min-h-screen flex flex-col ${isChartModalOpen ? 'bg-black bg-opacity-20' : 'bg-amber-50/30'}`}>
        <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Survey Data Visualization</h1>
            <div className="flex items-center gap-2">
              {/* <Button variant="outline" onClick={downloadCsv}>Download CSV</Button> */}
              <Button variant="outline" size="form" onClick={() => navigate(`${baseRoute}/admin`)}>Back</Button>
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

            <div className="space-y-3 mb-6 flex-shrink-0">
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label htmlFor="quick-range" className="block text-sm text-gray-700 mb-1">Quick range</label>
                  <select id="quick-range" className="px-3 py-2 border border-gray-300 rounded-md" value={quickRange} onChange={(e) => applyQuickRange(e.target.value as any)}>
                    <option value="all">All time</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="month">This month</option>
                    <option value="custom">Custom…</option>
                  </select>
                </div>
                {quickRange === 'custom' && (
                  <>
                    <div>
                      <label htmlFor="start-date" className="block text-sm text-gray-700 mb-1">Start</label>
                      <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                      <label htmlFor="end-date" className="block text-sm text-gray-700 mb-1">End</label>
                      <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                  </>
                )}
                <div className="ml-auto flex items-end gap-2">
                  <div>
                    <label htmlFor="default-chart" className="block text-sm text-gray-700 mb-1">Default chart</label>
                    <select id="default-chart" className="px-3 py-2 border border-gray-300 rounded-md" value={defaultChartType} onChange={(e) => setDefaultChartType(e.target.value as ChartType)}>
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                      <option value="donut">Donut</option>
                    </select>
                  </div>
                  <Button
                    variant="outline"
                    size="fixed"
                    title="Toggle count/percentage"
                    onClick={() => setShowPercent((v) => !v)}
                  >
                    {showPercent ? 'percent' : 'count'}
                  </Button>
                  {/* Legend removed per feedback */}
                  <Button variant="outline" size="form" onClick={() => setShowAdvanced((v) => !v)}>{showAdvanced ? 'Hide filters' : 'More filters'}</Button>
                </div>
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div>
                    <label htmlFor="section-filter" className="block text-sm text-gray-700 mb-1">Section</label>
                    <select id="section-filter" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={sectionFilter} onChange={(e) => {
                      console.log('🔍 DEBUG - Section filter changed to:', e.target.value);
                      setSectionFilter(e.target.value);
                      setSubsectionFilter('all');
                    }}>
                      <option value="all">All sections</option>
                      {sectionNames.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="subsection-filter" className="block text-sm text-gray-700 mb-1">Subsection</label>
                    <select id="subsection-filter" className="w-full px-3 py-2 border border-gray-300 rounded-md" value={subsectionFilter} onChange={(e) => {
                      console.log('🔍 DEBUG - Subsection filter changed to:', e.target.value);
                      setSubsectionFilter(e.target.value);
                    }}>
                      <option value="all">All subsections</option>
                      {(sectionFilter !== 'all' ? (subsectionsBySection[sectionFilter] || []) : orderedSections.flatMap(sec => (sec.subsections || []).map(ss => ({ id: ss.id, title: `${sec.title} • ${ss.title}` })))).map((ss) => {
                        console.log('🔍 DEBUG - Subsection option:', { id: ss.id, title: ss.title, value: ss.title });
                        return <option key={ss.id} value={ss.title}>{ss.title}</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="search-input" className="block text-sm text-gray-700 mb-1">Search</label>
                    <input id="search-input" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="form" onClick={() => setShowHideFieldsUI(true)}>Choose fields to hide</Button>
                      <Button variant="outline" size="form" onClick={expandAll}>Expand all</Button>
                      <Button variant="outline" size="form" onClick={collapseAll}>Collapse all</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showHideFieldsUI && (
              <div className="mb-6">
                <div className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Button size="form" variant="outline" onClick={showAllFields}>Reset hidden</Button>
                          <Button size="form" variant="primary" onClick={() => setShowHideFieldsUI(false)}>Done</Button>
                        </div>
                      </div>
                      <MultiSelect
                        value={Array.from(hiddenFields)}
                        onChange={(selectedValues) => setHiddenFields(new Set(selectedValues))}
                        options={filteredHiddenFieldOptions.map((f) => {
                          // Show cleaner labels based on current filters
                          let displayLabel = f.label;
                          if (sectionFilter !== 'all') {
                            // Remove section prefix if section is filtered
                            displayLabel = f.label.replace(`${sectionFilter} • `, '');
                            if (subsectionFilter !== 'all') {
                              // Remove subsection prefix if subsection is filtered
                              displayLabel = displayLabel.replace(`${subsectionFilter} • `, '');
                            }
                          }
                          return {
                            value: f.id,
                            label: displayLabel
                          };
                        })}
                        placeholder="Select fields to hide..."
                        display="chip"
                        maxSelectedLabels={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend removed per feedback */}

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
                          const renderedFieldIds = new Set<string>();

                          // Collect all charts for this section
                          const allCharts: Array<{ type: 'field' | 'subsection'; data: any; series: AggregatedSeries; sectionTitle: string; subsectionTitle?: string }> = [];

                          contentItems.forEach((ci) => {
                            if (ci.type === 'subsection') {
                              const subsection: any = ci.data;
                              if (subsectionFilter !== 'all') {
                                // Extract subsection name from filter value (e.g., "About You • Personal" -> "Personal")
                                const filterSubsectionName = subsectionFilter.split(' • ')[1] || subsectionFilter;
                                if (subsection.title !== filterSubsectionName) return;
                              }
                              const charts = subsection.fields
                                .map((f: any) => fieldIdToSeries[f.id])
                                .filter((s: any) => !!s && !hiddenFields.has(s.fieldId) && !renderedFieldIds.has(s.fieldId) && seriesMatchesSearch(s, { section: section.title, subsection: subsection.title }));
                              charts.forEach((s: AggregatedSeries) => {
                                renderedFieldIds.add(s.fieldId);
                                allCharts.push({ type: 'subsection', data: subsection, series: s, sectionTitle: section.title, subsectionTitle: subsection.title });
                              });
                            } else if (ci.type === 'field') {
                              const field: any = ci.data;
                              const s = fieldIdToSeries[field.id];
                              if (!s || !seriesMatchesSearch(s, { section: section.title }) || hiddenFields.has(s.fieldId) || renderedFieldIds.has(s.fieldId)) return;
                              renderedFieldIds.add(s.fieldId);
                              allCharts.push({ type: 'field', data: field, series: s, sectionTitle: section.title });
                            }
                          });

                          if (allCharts.length === 0) return null;

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
                                  {/* Grid layout indicator */}
                                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
                                    Layout: {(() => {
                                      const chartTypes = allCharts.map(item => {
                                        const chartType = perFieldChartType[item.series.fieldId] || defaultChartType;
                                        return item.series.type === 'histogram' ? 'histogram' : chartType;
                                      });
                                      const donutCount = chartTypes.filter(t => t === 'donut').length;
                                      const histogramCount = chartTypes.filter(t => t === 'histogram').length;
                                      const barCount = chartTypes.filter(t => t === 'horizontal' || t === 'vertical').length;
                                      const totalCharts = chartTypes.length;

                                      if (totalCharts <= 2) return 'Compact (2 charts)';
                                      if (donutCount >= totalCharts * 0.6) return `Dense (${donutCount} donut charts)`;
                                      if (histogramCount >= totalCharts * 0.5) return `Standard (${histogramCount} histograms)`;
                                      if (barCount >= totalCharts * 0.7) return `Full-width (${barCount} bar charts)`;
                                      return `Mixed (${totalCharts} charts)`;
                                    })()}
                                  </div>

                                  <div className={`grid gap-6 ${(() => {
                                    // Determine optimal grid based on chart types and content length
                                    const chartTypes = allCharts.map(item => {
                                      const chartType = perFieldChartType[item.series.fieldId] || defaultChartType;
                                      return item.series.type === 'histogram' ? 'histogram' : chartType;
                                    });

                                    // Count different chart types
                                    const donutCount = chartTypes.filter(t => t === 'donut').length;
                                    const histogramCount = chartTypes.filter(t => t === 'histogram').length;
                                    const barCount = chartTypes.filter(t => t === 'horizontal' || t === 'vertical').length;
                                    const totalCharts = chartTypes.length;

                                    // Check for long titles that need more space
                                    const hasLongTitles = allCharts.some(item => {
                                      const title = item.subsectionTitle ? `${item.subsectionTitle} • ${item.series.label}` : item.series.label;
                                      return title.length > 40; // If any title is longer than 40 chars, use fewer columns
                                    });

                                    // Check for donut charts with long legend labels
                                    const hasLongLegendLabels = allCharts.some(item => {
                                      const chartType = perFieldChartType[item.series.fieldId] || defaultChartType;
                                      if (chartType === 'donut') {
                                        const entries = Object.keys(item.series.counts);
                                        return entries.some(label => (label || '').length > 25);
                                      }
                                      return false;
                                    });

                                    // Adaptive grid logic with better spacing for long titles and legend labels
                                    if (totalCharts <= 2) return 'grid-cols-1 md:grid-cols-2';
                                    if (donutCount >= totalCharts * 0.6) {
                                      // For donut charts, use fewer columns if titles or legend labels are long
                                      if (hasLongTitles || hasLongLegendLabels) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
                                      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
                                    }
                                    if (histogramCount >= totalCharts * 0.5) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
                                    if (barCount >= totalCharts * 0.7) return 'grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1';
                                    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
                                  })()}`}>
                                    {allCharts.map((chartItem) => {
                                      const fullTitle = chartItem.subsectionTitle ? `${chartItem.subsectionTitle} • ${chartItem.series.label}` : chartItem.series.label;
                                      const isLongTitle = fullTitle.length > 40;

                                      return (
                                        <div
                                          key={chartItem.series.fieldId}
                                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-0 transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer group"
                                          onClick={() => openChartModal(chartItem)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              openChartModal(chartItem);
                                            }
                                          }}
                                          tabIndex={0}
                                          role="button"
                                          aria-label={`Open ${chartItem.subsectionTitle ? chartItem.subsectionTitle + ' • ' : ''}${chartItem.series.label} chart in full view`}
                                        >
                                          <div className="flex items-start justify-between mb-4 gap-3">
                                            <div className="flex-1 min-w-0">
                                              <h4
                                                className={`font-medium text-gray-800 ${isLongTitle ? 'text-sm leading-tight' : 'text-sm'} ${isLongTitle ? 'line-clamp-2' : 'truncate'}`}
                                                title={fullTitle}
                                              >
                                                {fullTitle}
                                              </h4>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                              </svg>
                                            </div>
                                          </div>
                                          <div className={`flex items-center justify-center ${(() => {
                                            const chartType = perFieldChartType[chartItem.series.fieldId] || defaultChartType;
                                            if (chartItem.series.type === 'histogram') return 'min-h-[160px]'; // Histograms are more compact
                                            if (chartType === 'donut') return 'min-h-[200px]'; // Increased height for donuts
                                            if (chartType === 'vertical') return 'min-h-[220px]'; // Vertical bars need more height
                                            return 'min-h-[280px]'; // Horizontal bars need more height for vertical layout
                                          })()}`}>
                                            {(() => {
                                              const chartType = perFieldChartType[chartItem.series.fieldId] || defaultChartType;
                                              if (chartItem.series.type === 'histogram') return <Histogram counts={chartItem.series.counts} />;
                                              if (chartType === 'vertical') return <VerticalBarChart counts={chartItem.series.counts} total={chartItem.series.total} orderedValues={chartItem.series.orderedValues} colors={chartItem.series.colors} showPercent={showPercent} neutralMode={chartItem.series.neutralMode} colorSalt={hashSaltFrom(chartItem.series.fieldId)} />;
                                              if (chartType === 'donut') return <DonutChart counts={chartItem.series.counts} total={chartItem.series.total} orderedValues={chartItem.series.orderedValues} colors={chartItem.series.colors} showPercent={showPercent} neutralMode={chartItem.series.neutralMode} colorSalt={hashSaltFrom(chartItem.series.fieldId)} />;
                                              return <BarChart counts={chartItem.series.counts} total={chartItem.series.total} orderedValues={chartItem.series.orderedValues} colors={chartItem.series.colors} showPercent={showPercent} neutralMode={chartItem.series.neutralMode} colorSalt={hashSaltFrom(chartItem.series.fieldId)} />;
                                            })()}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Chart Modal */}
                                  {isChartModalOpen && selectedChart && (
                                    <button
                                      className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center border-0 p-0"
                                      style={{ zIndex: 9999, top: '-100px', height: 'calc(100vh + 100px)' }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          closeChartModal();
                                        }
                                      }}
                                      onClick={closeChartModal}
                                      aria-label="Close modal"
                                    >
                                      <div
                                        className="bg-white/95 backdrop-blur-md shadow-2xl border border-gray-200/50 w-full max-w-[95vw] xl:max-w-7xl max-h-[95vh] overflow-hidden transform transition-all duration-300 ease-out scale-100 opacity-100"
                                        role="dialog"
                                        aria-modal="true"
                                        aria-label="Chart details modal"
                                        style={{ margin: 0 }}
                                      >
                                        <div className="flex items-center justify-between p-4 sm:p-6" style={{ margin: 0, paddingTop: '1rem' }}>
                                          <div className="flex-1 min-w-0">
                                            <h2 className="text-xl font-semibold text-gray-800 truncate">
                                              {selectedChart.subsectionTitle ? `${selectedChart.subsectionTitle} • ${selectedChart.series.label}` : selectedChart.series.label}
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                              {selectedChart.sectionTitle} • Total: {selectedChart.series.total} responses
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setShowPercent(!showPercent)}
                                            >
                                              {showPercent ? 'Show Counts' : 'Show Percentages'}
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={closeChartModal}
                                            >
                                              Close
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="pt-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 overflow-auto max-h-[calc(95vh-140px)]">
                                          <div className="flex flex-col items-center justify-center min-h-[600px] w-full">
                                            {(() => {
                                              const chartType = perFieldChartType[selectedChart.series.fieldId] || defaultChartType;
                                              if (selectedChart.series.type === 'histogram') return <Histogram counts={selectedChart.series.counts} />;
                                              if (chartType === 'vertical') return <VerticalBarChart counts={selectedChart.series.counts} total={selectedChart.series.total} orderedValues={selectedChart.series.orderedValues} colors={selectedChart.series.colors} showPercent={showPercent} neutralMode={selectedChart.series.neutralMode} colorSalt={hashSaltFrom(selectedChart.series.fieldId)} size="large" />;
                                              if (chartType === 'donut') return <DonutChart counts={selectedChart.series.counts} total={selectedChart.series.total} orderedValues={selectedChart.series.orderedValues} colors={selectedChart.series.colors} showPercent={showPercent} neutralMode={selectedChart.series.neutralMode} colorSalt={hashSaltFrom(selectedChart.series.fieldId)} size="large" />;
                                              return <BarChart counts={selectedChart.series.counts} total={selectedChart.series.total} orderedValues={selectedChart.series.orderedValues} colors={selectedChart.series.colors} showPercent={showPercent} neutralMode={selectedChart.series.neutralMode} colorSalt={hashSaltFrom(selectedChart.series.fieldId)} size="large" />;
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  )}

                                  {/* Legacy subsection grouping (optional - can be removed) */}
                                  {false && contentItems.map((ci) => {
                                    if (ci.type === 'subsection') {
                                      const subsection: any = ci.data;
                                      if (subsectionFilter !== 'all') {
                                        // Extract subsection name from filter value (e.g., "About You • Personal" -> "Personal")
                                        const filterSubsectionName = subsectionFilter.split(' • ')[1] || subsectionFilter;
                                        if (subsection.title !== filterSubsectionName) return null;
                                      }
                                      const charts = subsection.fields
                                        .map((f: any) => fieldIdToSeries[f.id])
                                        .filter((s: any) => !!s && !hiddenFields.has(s.fieldId) && !renderedFieldIds.has(s.fieldId) && seriesMatchesSearch(s, { section: section.title, subsection: subsection.title }));
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
                                              {charts.map((s: AggregatedSeries) => {
                                                renderedFieldIds.add(s.fieldId);
                                                return (
                                                  <div key={s.fieldId}>
                                                    <div className="flex items-center justify-between mb-2">
                                                      <h4 className="text-sm font-medium">{s.label}</h4>
                                                      {s.type !== 'histogram' && (
                                                        <div className="flex items-center gap-2">
                                                          <label htmlFor={`chart-type-${s.fieldId}`} className="text-xs text-gray-600">Chart:</label>
                                                          <select
                                                            id={`chart-type-${s.fieldId}`}
                                                            className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                                                            value={perFieldChartType[s.fieldId] || 'default'}
                                                            onChange={(e) => setPerFieldChartType(s.fieldId, e.target.value === 'default' ? undefined : (e.target.value as ChartType))}
                                                          >
                                                            <option value="default">Default ({defaultChartType})</option>
                                                            <option value="horizontal">Horizontal bar</option>
                                                            <option value="vertical">Vertical bar</option>
                                                            <option value="donut">Donut</option>
                                                          </select>
                                                        </div>
                                                      )}
                                                    </div>
                                                    {(() => {
                                                      const chartType = perFieldChartType[s.fieldId] || defaultChartType;
                                                      if (s.type === 'histogram') return <Histogram counts={s.counts} />;
                                                      if (chartType === 'vertical') return <VerticalBarChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} neutralMode={s.neutralMode} colorSalt={hashSaltFrom(s.fieldId)} />;
                                                      if (chartType === 'donut') return <DonutChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} neutralMode={s.neutralMode} colorSalt={hashSaltFrom(s.fieldId)} />;
                                                      return <BarChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} neutralMode={s.neutralMode} colorSalt={hashSaltFrom(s.fieldId)} />;
                                                    })()}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } else if (ci.type === 'field') {
                                      const field: any = ci.data;
                                      const s = fieldIdToSeries[field.id];
                                      if (!s || !seriesMatchesSearch(s, { section: section.title }) || hiddenFields.has(s.fieldId) || renderedFieldIds.has(s.fieldId)) return null;
                                      renderedFieldIds.add(s.fieldId);
                                      return (
                                        <div key={field.id}>
                                          <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-base font-medium">{s.label}</h3>
                                            {s.type !== 'histogram' && (
                                              <div className="flex items-center gap-2">
                                                <label htmlFor={`chart-type-field-${s.fieldId}`} className="text-xs text-gray-600">Chart:</label>
                                                <select
                                                  id={`chart-type-field-${s.fieldId}`}
                                                  className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                                                  value={perFieldChartType[s.fieldId] || 'default'}
                                                  onChange={(e) => setPerFieldChartType(s.fieldId, e.target.value === 'default' ? undefined : (e.target.value as ChartType))}
                                                >
                                                  <option value="default">Default ({defaultChartType})</option>
                                                  <option value="horizontal">Horizontal bar</option>
                                                  <option value="vertical">Vertical bar</option>
                                                  <option value="donut">Donut</option>
                                                </select>
                                              </div>
                                            )}
                                          </div>
                                          {(() => {
                                            const chartType = perFieldChartType[s.fieldId] || defaultChartType;
                                            if (s.type === 'histogram') return <Histogram counts={s.counts} />;
                                            if (chartType === 'vertical') return <VerticalBarChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} neutralMode={s.neutralMode} colorSalt={hashSaltFrom(s.fieldId)} />;
                                            if (chartType === 'donut') return <DonutChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} neutralMode={s.neutralMode} colorSalt={hashSaltFrom(s.fieldId)} />;
                                            return <BarChart counts={s.counts} total={s.total} orderedValues={s.orderedValues} colors={s.colors} showPercent={showPercent} neutralMode={s.neutralMode} colorSalt={hashSaltFrom(s.fieldId)} />;
                                          })()}
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
    </VisualizationPreferencesContext.Provider>
  );
};
