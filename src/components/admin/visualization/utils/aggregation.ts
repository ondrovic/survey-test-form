import { createDescriptiveFieldId } from '@/components/form/utils/transform.utils';
import { SurveyConfig, SurveyResponse } from '@/types';
import { AggregatedSeries, OptionSets } from '../types';
import { FREE_TEXT_FIELD_TYPES, FREE_TEXT_PATTERNS } from './constants';

/**
 * Normalizes a key for consistent comparison
 */
const normalizeKey = (v: string) => String(v ?? '').toLowerCase().trim();

/**
 * Strictly normalizes a key by removing special characters
 */
const normalizeStrict = (v: string) => normalizeKey(v).replace(/[^a-z0-9]+/g, '-');

/**
 * Adds color keys for various normalized forms of a value
 */
const addColorKeys = (
  colors: Record<string, string | undefined>, 
  value?: string, 
  label?: string, 
  color?: string
) => {
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

/**
 * Provides default colors for common values
 */
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

/**
 * Builds field metadata from survey configuration
 */
const buildFieldMetadata = (config: SurveyConfig | undefined) => {
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

  if (!config) {
    return { fieldIdToLabel, fieldIdToSection, fieldIdToMeta, fieldIdToDescriptiveId, fieldIdToPossibleKeys };
  }

  const processField = (field: any, section: any) => {
    fieldIdToLabel[field.id] = field.label;
    fieldIdToSection[field.id] = section.title;
    fieldIdToMeta[field.id] = {
      type: field.type,
      ratingScaleId: field.ratingScaleId,
      ratingScaleName: (field as any).ratingScaleName,
      radioOptionSetId: (field as any).radioOptionSetId,
      radioOptionSetName: (field as any).radioOptionSetName,
      selectOptionSetId: (field as any).selectOptionSetId,
      selectOptionSetName: (field as any).selectOptionSetName,
      multiSelectOptionSetId: (field as any).multiSelectOptionSetId,
      multiSelectOptionSetName: (field as any).multiSelectOptionSetName,
      inlineOptions: field.options as any,
      labelHistory: field.labelHistory as any,
    };

    try { 
      fieldIdToDescriptiveId[field.id] = createDescriptiveFieldId(section as any, field as any); 
    } catch (e) { 
      /* Ignore error */ 
    }

    const possible: string[] = [field.id];
    
    // Slug-based descriptive id (current)
    try { 
      possible.push(createDescriptiveFieldId(section as any, field as any)); 
    } catch (e) { 
      /* Ignore error */ 
    }
    
    // Pretty label forms often used in exports or earlier versions
    const prettySpace = `${section.title} ${field.label}`;
    const prettyDash = `${section.title} - ${field.label}`;
    possible.push(prettySpace, prettyDash);
    
    // Also add slug variations using dashes and spaces
    const sectionSlug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const fieldSlug = field.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    possible.push(`${sectionSlug}_${fieldSlug}`, `${sectionSlug}-${fieldSlug}`, `${sectionSlug} ${fieldSlug}`);
    
    if (Array.isArray(field.labelHistory)) {
      for (const h of field.labelHistory) {
        try {
          const tempField: any = { ...field, label: h.label };
          possible.push(createDescriptiveFieldId(section as any, tempField));
          const prettySpaceH = `${section.title} ${h.label}`;
          const prettyDashH = `${section.title} - ${h.label}`;
          possible.push(prettySpaceH, prettyDashH);
          const fieldSlugH = h.label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          possible.push(`${sectionSlug}_${fieldSlugH}`, `${sectionSlug}-${fieldSlugH}`, `${sectionSlug} ${fieldSlugH}`);
        } catch (e) { 
          /* Ignore error */ 
        }
      }
    }
    
    fieldIdToPossibleKeys[field.id] = Array.from(new Set(possible));
  };

  config.sections.forEach((section) => {
    section.fields.forEach((field) => processField(field, section));
    section.subsections.forEach((subsection) => {
      subsection.fields.forEach((field) => processField(field, section));
    });
  });

  return { fieldIdToLabel, fieldIdToSection, fieldIdToMeta, fieldIdToDescriptiveId, fieldIdToPossibleKeys };
};

/**
 * Processes option sets to determine ordering and colors
 */
const processOptionSet = (
  meta: any, 
  options: OptionSets,
  colors: Record<string, string | undefined>
): string[] | undefined => {
  const type = meta.type;
  let orderedValues: string[] | undefined;

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
    orderedValues = meta.inlineOptions.map((o: any) => o.value);
    attachColors(meta.inlineOptions);
  }

  return orderedValues;
};

/**
 * Creates histogram buckets for numeric data
 */
const createHistogramBuckets = (counts: Record<string, number>) => {
  const numericValues: number[] = [];
  Object.entries(counts).forEach(([k, c]) => {
    const v = Number(k);
    if (!Number.isNaN(v)) {
      for (let i = 0; i < c; i++) numericValues.push(v);
    }
  });
  
  if (numericValues.length === 0) return null;
  
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
  
  return buckets;
};

/**
 * Determines if a field should use neutral mode (for free-text fields)
 */
const shouldUseNeutralMode = (
  fieldId: string,
  type: string,
  label: string,
  orderedValues?: string[],
  uniqueCount?: number
): boolean => {
  const typeLower = String(type || '').toLowerCase();
  const labelLower = String(label || '').toLowerCase();
  const idLower = String(fieldId || '').toLowerCase();
  
  const looksLikeFreeText = !orderedValues || orderedValues.length === 0;
  const typeHintFreeText = FREE_TEXT_FIELD_TYPES.includes(typeLower);
  const labelHintFreeText = FREE_TEXT_PATTERNS.some(pattern => pattern.test(labelLower));
  const idHintFreeText = FREE_TEXT_PATTERNS.some(pattern => pattern.test(idLower));
  
  return (
    typeHintFreeText || 
    labelHintFreeText || 
    idHintFreeText || 
    (looksLikeFreeText && typeLower !== 'number' && (uniqueCount || 0) > 8)
  );
};

/**
 * Main function to compute aggregations from survey responses
 */
export function computeAggregations(
  responses: SurveyResponse[],
  config: SurveyConfig | undefined,
  options: OptionSets
): AggregatedSeries[] {
  const metadata = buildFieldMetadata(config);
  const series: AggregatedSeries[] = [];
  const fieldAggregations: Record<string, Record<string, number>> = {};

  // Initialize aggregation buckets for every known field id
  Object.keys(metadata.fieldIdToLabel).forEach((fid) => { 
    fieldAggregations[fid] = {}; 
  });

  // Aggregate responses
  for (const resp of responses) {
    const r = resp.responses || {};
    
    for (const fid of Object.keys(metadata.fieldIdToLabel)) {
      const keys = metadata.fieldIdToPossibleKeys[fid] || [fid, metadata.fieldIdToDescriptiveId[fid]].filter(Boolean) as string[];
      let value: any = undefined;
      
      for (const k of keys) {
        if (r[k] !== undefined) { 
          value = r[k]; 
          break; 
        }
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

  // Process aggregations into series
  Object.entries(fieldAggregations).forEach(([fieldId, counts]) => {
    const uniqueCount = Object.keys(counts).length;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    if (total === 0) return; // Skip fields with no data
    
    const meta = metadata.fieldIdToMeta[fieldId] || {};
    const type = meta.type;
    const colors: Record<string, string | undefined> = {};
    
    // Handle numeric histogram
    if (type === 'number') {
      const buckets = createHistogramBuckets(counts);
      if (buckets) {
        series.push({
          fieldId,
          label: metadata.fieldIdToLabel[fieldId] || fieldId,
          section: metadata.fieldIdToSection[fieldId],
          counts: buckets,
          total,
          type: 'histogram',
        });
        return;
      }
    }
    
    // Build option ordering and colors when available
    const orderedValues = processOptionSet(meta, options, colors);
    
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
    const neutralMode = shouldUseNeutralMode(
      fieldId,
      type || '',
      metadata.fieldIdToLabel[fieldId] || '',
      orderedValues,
      uniqueCount
    );
    
    series.push({
      fieldId,
      label: metadata.fieldIdToLabel[fieldId] || fieldId,
      section: metadata.fieldIdToSection[fieldId],
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