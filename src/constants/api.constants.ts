export const API_ENDPOINTS = {
  health: "/health",
} as const;

export const STORAGE_KEYS = {
  surveyData: "survey-app-data",
  formState: "survey-form-state",
  connectionStatus: "survey-connection-status",
} as const;

export const ERROR_MESSAGES = {
  networkError: "Network error. Please check your connection.",
  firebaseError: "Firebase connection failed.",
  validationError: "Please fix the errors in the form.",
  submissionError: "Failed to submit survey. Please try again.",
  unauthorized: "Unauthorized access. Please check your credentials.",
  rateLimit: "Rate limit exceeded. Please try again later.",
} as const;

export const SUCCESS_MESSAGES = {
  surveySubmitted: "Survey submitted successfully!",
  dataSaved: "Data saved successfully.",
  connectionRestored: "Firebase connection restored.",
} as const;
