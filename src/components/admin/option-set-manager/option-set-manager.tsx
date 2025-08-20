import React from "react";
import {
  RatingScale,
  RadioOptionSet,
  MultiSelectOptionSet,
  SelectOptionSet,
} from "../../../types/framework.types";
import {
  ratingScaleConfig,
  radioOptionSetConfig,
  multiSelectOptionSetConfig,
  selectOptionSetConfig,
} from "../../../config/option-set-config";
import { GenericOptionSetManager } from "../generic-option-set-manager";
// Define the option set type locally since it's not exported from context
type OptionSetType = 'rating-scale' | 'radio' | 'multi-select' | 'select';
import { getFieldRenderer } from "./field-renderers";

// Union type for all option set types (for future use)
// type AnyOptionSet = RatingScale | RadioOptionSet | MultiSelectOptionSet | SelectOptionSet;

// Base props shared by all option set managers
interface BaseOptionSetManagerProps {
  isVisible: boolean;
  onClose: () => void;
  onOptionSetSelect?: (optionSetId: string) => void;
  isCreating?: boolean;
}

// Type-specific props
interface RatingScaleManagerProps extends BaseOptionSetManagerProps {
  type: 'rating-scale';
  editingOptionSet?: RatingScale | null;
  editingScale?: RatingScale | null; // backwards compatibility
  onScaleSelect?: (scaleId: string) => void; // backwards compatibility
}

interface RadioOptionSetManagerProps extends BaseOptionSetManagerProps {
  type: 'radio';
  editingOptionSet?: RadioOptionSet | null;
}

interface MultiSelectOptionSetManagerProps extends BaseOptionSetManagerProps {
  type: 'multi-select';
  editingOptionSet?: MultiSelectOptionSet | null;
}

interface SelectOptionSetManagerProps extends BaseOptionSetManagerProps {
  type: 'select';
  editingOptionSet?: SelectOptionSet | null;
  filterMultiple?: boolean; // true = show only allowMultiple=true, false = show only allowMultiple=false, undefined = show all
}

// Union of all props
export type OptionSetManagerProps = 
  | RatingScaleManagerProps 
  | RadioOptionSetManagerProps 
  | MultiSelectOptionSetManagerProps 
  | SelectOptionSetManagerProps;

// Configuration mapping
const getConfig = (type: OptionSetType) => {
  switch (type) {
    case 'rating-scale':
      return ratingScaleConfig;
    case 'radio':
      return radioOptionSetConfig;
    case 'multi-select':
      return multiSelectOptionSetConfig;
    case 'select':
      return selectOptionSetConfig;
    default:
      throw new Error(`Unknown option set type: ${type}`);
  }
};

/**
 * Consolidated Option Set Manager Component
 * 
 * Replaces the previous four separate manager components:
 * - RatingScaleManager
 * - RadioOptionSetManager  
 * - MultiSelectOptionSetManager
 * - SelectOptionSetManager
 * 
 * Usage:
 * <OptionSetManager
 *   type="rating-scale"
 *   isVisible={true}
 *   onClose={() => {}}
 *   editingOptionSet={myRatingScale}
 * />
 */
export const OptionSetManager: React.FC<OptionSetManagerProps> = (props) => {
  const { type, isVisible, onClose, onOptionSetSelect, editingOptionSet, isCreating } = props;
  
  // Handle backwards compatibility props
  let actualEditingOptionSet = editingOptionSet;
  let actualOnOptionSetSelect = onOptionSetSelect;
  
  if (type === 'rating-scale' && 'editingScale' in props) {
    actualEditingOptionSet = (props as RatingScaleManagerProps).editingScale || editingOptionSet;
  }
  if (type === 'rating-scale' && 'onScaleSelect' in props) {
    actualOnOptionSetSelect = (props as RatingScaleManagerProps).onScaleSelect || onOptionSetSelect;
  }
  
  // Get the appropriate configuration for this type
  const config = getConfig(type);
  
  // Get the field renderer for type-specific additional fields
  const additionalFieldsRenderer = getFieldRenderer(type, props);

  return (
    <GenericOptionSetManager
      isVisible={isVisible}
      onClose={onClose}
      config={config}
      onOptionSetSelect={actualOnOptionSetSelect}
      editingOptionSet={actualEditingOptionSet}
      isCreating={isCreating}
      renderAdditionalFields={additionalFieldsRenderer}
    />
  );
};

// Export individual typed components for backwards compatibility and convenience
export const RatingScaleManager: React.FC<Omit<RatingScaleManagerProps, 'type'>> = (props) => (
  <OptionSetManager {...(props as any)} type="rating-scale" />
);

export const RadioOptionSetManager: React.FC<Omit<RadioOptionSetManagerProps, 'type'>> = (props) => (
  <OptionSetManager {...(props as any)} type="radio" />
);

export const MultiSelectOptionSetManager: React.FC<Omit<MultiSelectOptionSetManagerProps, 'type'>> = (props) => (
  <OptionSetManager {...(props as any)} type="multi-select" />
);

export const SelectOptionSetManager: React.FC<Omit<SelectOptionSetManagerProps, 'type'>> = (props) => (
  <OptionSetManager {...(props as any)} type="select" />
);