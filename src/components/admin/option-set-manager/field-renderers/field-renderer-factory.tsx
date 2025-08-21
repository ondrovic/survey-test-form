import React from "react";
// Define the option set type locally since it's not exported from context
type OptionSetType = 'rating-scale' | 'radio' | 'multi-select' | 'select';
import { MultiSelectFields } from "./multi-select-fields";
import { SelectFields } from "./select-fields";
import type { OptionSetManagerProps } from "../option-set-manager";

// Factory function to get the appropriate field renderer based on option set type
export const getFieldRenderer = (
  type: OptionSetType,
  props: OptionSetManagerProps
): ((props: { data: any; setField: (field: string, value: any) => void }) => React.ReactNode) | undefined => {
  switch (type) {
    case 'rating-scale':
    case 'radio':
      // These types don't have additional fields
      return undefined;
      
    case 'multi-select':
      return MultiSelectFields;
      
    case 'select': {
      // Pass filterMultiple prop to SelectFields if available
      const filterMultiple = 'filterMultiple' in props ? props.filterMultiple : undefined;
      const SelectFieldsComponent = (fieldProps: { data: any; setField: (field: string, value: any) => void }) => <SelectFields {...fieldProps} filterMultiple={filterMultiple} />;
      SelectFieldsComponent.displayName = 'SelectFieldsComponent';
      return SelectFieldsComponent;
    }
      
    default:
      return undefined;
  }
};