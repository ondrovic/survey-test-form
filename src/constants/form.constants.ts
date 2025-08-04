export const MARKET_REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Southwest",
  "West",
  "Multi-region",
] as const;

export const LICENSE_RANGES = [
  { value: "1-5", label: "1-5" },
  { value: "5-10", label: "5-10" },
  { value: "10+", label: "10+" },
] as const;

export const BUSINESS_FOCUS_OPTIONS = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Commerical and Residential", label: "Both" },
] as const;

export const RATING_OPTIONS = [
  { value: "High", label: "High", color: "success" as const },
  { value: "Medium", label: "Medium", color: "warning" as const },
  { value: "Low", label: "Low", color: "error" as const },
  { value: "Not Important", label: "Not Important", color: "default" as const },
] as const;
