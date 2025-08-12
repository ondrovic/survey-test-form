import { MultiSelectOptionSet, RadioOptionSet, RatingScale, SelectOptionSet, SurveyConfig, SurveyField } from '@/types/framework.types';

export interface ValidationLookups {
  ratingScales: Record<string, RatingScale>;
  radioOptionSets: Record<string, RadioOptionSet>;
  multiSelectOptionSets: Record<string, MultiSelectOptionSet>;
  selectOptionSets: Record<string, SelectOptionSet>;
}

export const isFieldEmpty = (field: SurveyField, value: any): boolean => {
  if (value === null || value === undefined) return true;

  switch (field.type) {
    case 'multiselect':
    case 'multiselectdropdown':
      return Array.isArray(value) ? value.length === 0 : true;
    case 'text':
    case 'email':
    case 'textarea':
    case 'number':
      return String(value).trim() === '';
    case 'select':
      return value === '' || value === null || value === undefined;
    case 'radio':
    case 'rating':
      return value === '' || value === null || value === undefined;
    default:
      return !value || value === '';
  }
};

export const validateFieldValue = (
  field: SurveyField,
  rawValue: any,
  lookups: ValidationLookups
): string | null => {
  let value = rawValue;

  // Normalize multiselect values to arrays
  if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && !Array.isArray(value)) {
    value = value ? [value] : [];
  }

  // Required
  if (field.required && isFieldEmpty(field, value)) {
    return 'This field is required';
  }

  // Skip further checks if empty and not required
  if (isFieldEmpty(field, value) && !field.required) {
    return null;
  }

  // Email format
  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  // Number format
  if (field.type === 'number' && value) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }
  }

  // Multiselect validations (range + membership)
  if ((field.type === 'multiselect' || field.type === 'multiselectdropdown') && Array.isArray(value)) {
    if (field.type === 'multiselect' && field.multiSelectOptionSetId) {
      const optionSet = lookups.multiSelectOptionSets[field.multiSelectOptionSetId];
      if (optionSet) {
        if (optionSet.minSelections && value.length < optionSet.minSelections) {
          return `Please select at least ${optionSet.minSelections} option${optionSet.minSelections === 1 ? '' : 's'}`;
        }
        if (optionSet.maxSelections && value.length > optionSet.maxSelections) {
          return `Please select at most ${optionSet.maxSelections} option${optionSet.maxSelections === 1 ? '' : 's'}`;
        }
        const valid = optionSet.options.map((o) => o.value);
        if (value.some((v) => !valid.includes(v))) {
          return 'Some selected options are no longer available';
        }
      }
    } else if (field.type === 'multiselectdropdown' && field.selectOptionSetId) {
      const optionSet = lookups.selectOptionSets[field.selectOptionSetId];
      if (optionSet) {
        const valid = optionSet.options.map((o) => o.value);
        if (value.some((v) => !valid.includes(v))) {
          return 'Some selected options are no longer available';
        }
      }
    }

    if (field.options && field.options.length > 0) {
      const valid = field.options.map((o) => o.value);
      if (value.some((v) => !valid.includes(v))) {
        return 'Some selected options are no longer available';
      }
    }
  }

  // Radio/select membership validation
  if ((field.type === 'radio' || field.type === 'select') && value) {
    if (field.radioOptionSetId) {
      const set = lookups.radioOptionSets[field.radioOptionSetId];
      if (set) {
        const valid = set.options.map((o) => o.value);
        if (!valid.includes(value)) return 'Selected option is no longer available';
      }
    } else if (field.selectOptionSetId) {
      const set = lookups.selectOptionSets[field.selectOptionSetId];
      if (set) {
        const valid = set.options.map((o) => o.value);
        if (!valid.includes(value)) return 'Selected option is no longer available';
      }
    } else if (field.options && field.options.length > 0) {
      const valid = field.options.map((o) => o.value);
      if (!valid.includes(value)) return 'Selected option is no longer available';
    }
  }

  // Rating membership validation
  if (field.type === 'rating' && value) {
    if (field.ratingScaleId) {
      const scale = lookups.ratingScales[field.ratingScaleId];
      if (scale) {
        const valid = scale.options.map((o) => o.value);
        if (!valid.includes(value)) return 'Selected rating is no longer available';
      }
    } else if (field.options && field.options.length > 0) {
      const valid = field.options.map((o) => o.value);
      if (!valid.includes(value)) return 'Selected rating is no longer available';
    }
  }

  // Custom per-field validation rules
  if (field.validation && field.validation.length > 0) {
    for (const rule of field.validation) {
      let err: string | null = null;
      switch (rule.type) {
        case 'email':
          if (value && field.type !== 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) err = rule.message || 'Please enter a valid email address';
          }
          break;
        case 'min':
          if (Array.isArray(value)) {
            if (value.length < (rule.value || 0)) err = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
          } else if (typeof value === 'string') {
            if (value.length < (rule.value || 0)) err = rule.message || `Must be at least ${rule.value} characters`;
          } else if (typeof value === 'number') {
            if (value < (rule.value || 0)) err = rule.message || `Must be at least ${rule.value}`;
          }
          break;
        case 'max':
          if (Array.isArray(value)) {
            if (value.length > (rule.value || 0)) err = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
          } else if (typeof value === 'string') {
            if (value.length > (rule.value || 0)) err = rule.message || `Must be no more than ${rule.value} characters`;
          } else if (typeof value === 'number') {
            if (value > (rule.value || 0)) err = rule.message || `Must be no more than ${rule.value}`;
          }
          break;
        case 'minSelections':
          if (Array.isArray(value) && value.length < (rule.value || 0)) err = rule.message || `Please select at least ${rule.value} option${rule.value === 1 ? '' : 's'}`;
          break;
        case 'maxSelections':
          if (Array.isArray(value) && value.length > (rule.value || 0)) err = rule.message || `Please select at most ${rule.value} option${rule.value === 1 ? '' : 's'}`;
          break;
        case 'pattern':
          if (value && rule.value && typeof value === 'string') {
            const regex = new RegExp(rule.value);
            if (!regex.test(value)) err = rule.message || 'Invalid format';
          }
          break;
        case 'required':
          // already handled
          break;
        case 'custom':
          // reserved for custom impl
          break;
      }
      if (err) return err;
    }
  }

  return null;
};

export const validateAllFields = (
  formData: Record<string, any>,
  config: SurveyConfig,
  lookups: ValidationLookups
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const allFields: SurveyField[] = [];
  config.sections.forEach((section) => {
    allFields.push(...section.fields);
    section.subsections?.forEach((sub) => allFields.push(...sub.fields));
  });

  for (const field of allFields) {
    const err = validateFieldValue(field, formData[field.id], lookups);
    if (err) errors[field.id] = err;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateSection = (
  sectionIndex: number,
  formData: Record<string, any>,
  config: SurveyConfig,
  lookups: ValidationLookups
): { isValid: boolean; errors: Record<string, string> } => {
  const section = config.sections[sectionIndex];
  const errors: Record<string, string> = {};

  const fields: SurveyField[] = [
    ...section.fields,
    ...(section.subsections?.flatMap((s) => s.fields) || []),
  ];

  for (const field of fields) {
    const err = validateFieldValue(field, formData[field.id], lookups);
    if (err) errors[field.id] = err;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
