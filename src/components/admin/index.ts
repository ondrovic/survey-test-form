export { Analytics as AdminAnalytics } from "./analytics/";
export { AdminAuth } from "./auth/";
export { AdminFramework } from "./framework/";
export { AdminHeader } from "./header/";
export { AdminOptionSets } from "./option-sets/";
export { AdminOverview } from "./overview/";
export { AdminPage } from "./page/";
// AdminRatingScales component has been replaced by AdminOptionSets
// export { AdminRatingScales } from "./rating-scales/";
export { SurveyBuilder } from "./survey-builder/";

// Consolidated Option Set Managers (NEW)
export {
  MultiSelectOptionSetManager,
  OptionSetManager,
  RadioOptionSetManager,
  RatingScaleManager,
  SelectOptionSetManager,
} from "./option-set-manager/";
