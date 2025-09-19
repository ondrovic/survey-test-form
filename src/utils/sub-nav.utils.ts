import { SUB_NAV_OPTIONS } from "@/constants/sub-nav.constants";

/**
 * Converts a service name to kebab-case format
 * @param serviceName - The service name to convert
 * @returns The kebab-case version of the service name
 */
export const toKebabCase = (serviceName: string): string => {
  return serviceName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

/**
 * Generates the kebab-case key for sub-nav questions
 * @param serviceName - The service name
 * @returns The kebab-case key for the sub-nav question
 */
export const getSubNavKey = (serviceName: string): string => {
  return `${toKebabCase(serviceName)}-sub-nav`;
};

/**
 * Generates the kebab-case key for sub-nav "other" text
 * @param serviceName - The service name
 * @returns The kebab-case key for the sub-nav "other" text
 */
export const getSubNavOtherKey = (serviceName: string): string => {
  return `${toKebabCase(serviceName)}-sub-nav-other`;
};

/**
 * Gets all sub-nav questions from the SUB_NAV_OPTIONS constant
 * @returns Array of sub-nav question objects
 */
export const getSubNavQuestions = () => {
  return SUB_NAV_OPTIONS.map((option) => ({
    service: option.service,
    question: option.question,
    options: option.options,
    textArea: option["text-area"],
    subNavKey: getSubNavKey(option.service),
    subNavOtherKey: getSubNavOtherKey(option.service),
  }));
};

/**
 * Creates initial values for sub-nav questions
 * @returns Object with empty arrays for each sub-nav question
 */
export const createInitialSubNavValues = () => {
  const questions = getSubNavQuestions();
  const subNavQuestions: Record<string, string[]> = {};
  const subNavOtherText: Record<string, string> = {};

  questions.forEach((question) => {
    subNavQuestions[question.subNavKey] = [];
    subNavOtherText[question.subNavOtherKey] = "";
  });

  return { subNavQuestions, subNavOtherText };
};
