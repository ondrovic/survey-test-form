import { OptionSetConfig } from '../contexts/option-set-crud-context';
import { firestoreHelpers } from '../config/firebase';
import { 
  RatingScale, 
  RadioOptionSet, 
  MultiSelectOptionSet, 
  SelectOptionSet,
  RatingScaleOption,
  OptionSetOption 
} from '../types/framework.types';
import { createMetadata } from '../utils/metadata.utils';

// Common validation functions
const validateName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return 'Name is required';
  }
  return null;
};

const validateOptions = (options: any[]): string | null => {
  if (!options || options.length === 0) {
    return 'At least one option is required';
  }

  // Validate each option has required fields
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    
    if (!option.label || !option.label.trim()) {
      return `Option ${i + 1}: Label is required`;
    }
    
    if (!option.value || !option.value.trim()) {
      return `Option ${i + 1}: Value is required`;
    }
  }
  
  return null;
};

// Multi-select specific validation
const validateMultiSelectFields = (data: any): string | null => {
  const { options, minSelections, maxSelections } = data;
  
  if (!options) return null;
  
  const validOptions = options.filter((option: any) => 
    option.label && option.label.trim() && option.value && option.value.trim()
  );

  if (minSelections && maxSelections) {
    if (minSelections > maxSelections) {
      return 'Minimum selections cannot be greater than maximum selections';
    }
    if (minSelections > validOptions.length) {
      return 'Minimum selections cannot be greater than the number of valid options';
    }
    if (maxSelections > validOptions.length) {
      return 'Maximum selections cannot be greater than the number of valid options';
    }
  }
  
  return null;
};

// Rating Scale Configuration
export const ratingScaleConfig: OptionSetConfig<RatingScale> = {
  type: 'rating-scale',
  displayName: 'Rating Scale',
  firestoreHelpers: {
    get: firestoreHelpers.getRatingScales,
    create: firestoreHelpers.addRatingScale,
    update: firestoreHelpers.updateRatingScale,
    delete: firestoreHelpers.deleteRatingScale,
  },
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: (): Omit<RatingScale, 'id'> => ({
    name: '',
    description: '',
    options: [
      { value: '', label: '', color: 'transparent', isDefault: false, order: 0 }
    ] as RatingScaleOption[],
    isActive: true,
    metadata: createMetadata()
  }),
};

// Radio Option Set Configuration
export const radioOptionSetConfig: OptionSetConfig<RadioOptionSet> = {
  type: 'radio',
  displayName: 'Radio Option Set',
  firestoreHelpers: {
    get: firestoreHelpers.getRadioOptionSets,
    create: firestoreHelpers.addRadioOptionSet,
    update: firestoreHelpers.updateRadioOptionSet,
    delete: firestoreHelpers.deleteRadioOptionSet,
  },
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: (): Omit<RadioOptionSet, 'id'> => ({
    name: '',
    description: '',
    options: [
      { value: '', label: '', color: 'transparent', isDefault: false, order: 0 }
    ] as OptionSetOption[],
    isActive: true,
    metadata: createMetadata()
  }),
};

// Multi-Select Option Set Configuration
export const multiSelectOptionSetConfig: OptionSetConfig<MultiSelectOptionSet> = {
  type: 'multi-select',
  displayName: 'Multi-Select Option Set',
  firestoreHelpers: {
    get: firestoreHelpers.getMultiSelectOptionSets,
    create: firestoreHelpers.addMultiSelectOptionSet,
    update: firestoreHelpers.updateMultiSelectOptionSet,
    delete: firestoreHelpers.deleteMultiSelectOptionSet,
  },
  validation: {
    validateName,
    validateOptions,
    validateCustomFields: validateMultiSelectFields,
  },
  defaultItem: (): Omit<MultiSelectOptionSet, 'id'> => ({
    name: '',
    description: '',
    options: [
      { value: '', label: '', color: 'transparent', isDefault: false, order: 0 }
    ] as OptionSetOption[],
    minSelections: 1,
    maxSelections: 3,
    isActive: true,
    metadata: createMetadata()
  }),
};

// Select Option Set Configuration
export const selectOptionSetConfig: OptionSetConfig<SelectOptionSet> = {
  type: 'select',
  displayName: 'Select Option Set',
  firestoreHelpers: {
    get: firestoreHelpers.getSelectOptionSets,
    create: firestoreHelpers.addSelectOptionSet,
    update: firestoreHelpers.updateSelectOptionSet,
    delete: firestoreHelpers.deleteSelectOptionSet,
  },
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: (): Omit<SelectOptionSet, 'id'> => ({
    name: '',
    description: '',
    options: [
      { value: '', label: '', color: 'transparent', isDefault: false, order: 0 }
    ] as OptionSetOption[],
    allowMultiple: false,
    isActive: true,
    metadata: createMetadata()
  }),
};