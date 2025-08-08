export * from "./color.utils";
export * from "./console.utils";
export * from "./cookie.utils";
export * from "./date.utils";
export * from "./env.utils";
export * from "./excel.utils";
export * from "./ip.utils";
export * from "./migration.utils";
export * from "./recaptcha.utils";
export * from "./serviceLine.utils";

// Survey instance utility functions
export const isSurveyInstanceActive = (instance: {
  isActive: boolean;
  activeDateRange?: { startDate: string; endDate: string };
}) => {
  if (!instance.isActive) return false;

  // If no date range is specified, the instance is always active
  if (!instance.activeDateRange) return true;

  const now = new Date();
  const startDate = new Date(instance.activeDateRange.startDate);
  const endDate = new Date(instance.activeDateRange.endDate);

  return now >= startDate && now <= endDate;
};
