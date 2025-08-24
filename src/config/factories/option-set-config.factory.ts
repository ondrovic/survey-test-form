import { OptionSetConfig } from "../../contexts/option-set-crud-context";
import {
  RatingScale,
  RadioOptionSet,
  MultiSelectOptionSet,
  SelectOptionSet,
} from "../../types/framework.types";
import {
  RATING_OPTION_SET_NAME,
  RADIO_OPTION_SET_NAME,
  MULTISELECT_OPTION_SET_NAME,
  SELECT_OPTION_SET_NAME,
} from "../../constants/options-sets.constants";
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
  displayName: RATING_OPTION_SET_NAME,
  databaseHelpers: createRatingScaleDatabaseHelpers(),
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: createDefaultRatingScale,
});

export const createRadioOptionSetConfig = (): OptionSetConfig<RadioOptionSet> => ({
  type: "radio",
  displayName: RADIO_OPTION_SET_NAME,
  databaseHelpers: createRadioOptionSetDatabaseHelpers(),
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: createDefaultRadioOptionSet,
});

export const createMultiSelectOptionSetConfig = (): OptionSetConfig<MultiSelectOptionSet> => ({
  type: "multi-select",
  displayName: MULTISELECT_OPTION_SET_NAME,
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
  displayName: SELECT_OPTION_SET_NAME,
  databaseHelpers: createSelectOptionSetDatabaseHelpers(),
  validation: {
    validateName,
    validateOptions,
  },
  defaultItem: createDefaultSelectOptionSet,
});