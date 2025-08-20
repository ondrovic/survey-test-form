// Refactored option set configurations using factory pattern and modular design
import {
  createRatingScaleConfig,
  createRadioOptionSetConfig,
  createMultiSelectOptionSetConfig,
  createSelectOptionSetConfig,
} from "./factories/option-set-config.factory";

// Export configured option sets using factory functions
export const ratingScaleConfig = createRatingScaleConfig();
export const radioOptionSetConfig = createRadioOptionSetConfig();
export const multiSelectOptionSetConfig = createMultiSelectOptionSetConfig();
export const selectOptionSetConfig = createSelectOptionSetConfig();
