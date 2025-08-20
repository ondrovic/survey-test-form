import { OptionSetConfig } from "../../contexts/option-set-crud-context";
import {
  RatingScale,
  RadioOptionSet,
  MultiSelectOptionSet,
  SelectOptionSet,
} from "../../types/framework.types";
import {
  validateName,
  validateOptions,
  validateMultiSelectFields,
} from "../validation/option-set.validation";
import {
  createRatingScaleDatabaseHelpers,
  createRadioOptionSetDatabaseHelpers,
  createMultiSelectOptionSetDatabaseHelpers,
  createSelectOptionSetDatabaseHelpers,
  createDefaultRatingScale,
  createDefaultRadioOptionSet,
  createDefaultMultiSelectOptionSet,
  createDefaultSelectOptionSet,
} from "./option-set.factory";

// Factory functions for each option set type - now type-safe and DRY
export const createRatingScaleConfig = (): OptionSetConfig<RatingScale> => ({
  type: "rating-scale",
  displayName: "Rating Scale",
  databaseHelpers: createRatingScaleDatabaseHelpers(),
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: createDefaultRatingScale,
});

export const createRadioOptionSetConfig = (): OptionSetConfig<RadioOptionSet> => ({
  type: "radio",
  displayName: "Radio Option Set",
  databaseHelpers: createRadioOptionSetDatabaseHelpers(),
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: createDefaultRadioOptionSet,
});

export const createMultiSelectOptionSetConfig = (): OptionSetConfig<MultiSelectOptionSet> => ({
  type: "multi-select",
  displayName: "Multi-Select Option Set",
  databaseHelpers: createMultiSelectOptionSetDatabaseHelpers(),
  validation: {
    validateName,
    validateOptions,
    validateCustomFields: validateMultiSelectFields,
  },
  defaultItem: createDefaultMultiSelectOptionSet,
});

export const createSelectOptionSetConfig = (): OptionSetConfig<SelectOptionSet> => ({
  type: "select",
  displayName: "Select Option Set",
  databaseHelpers: createSelectOptionSetDatabaseHelpers(),
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: createDefaultSelectOptionSet,
});