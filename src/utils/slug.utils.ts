import { SurveyInstance } from '@/types';

/**
 * Generates a unique slug for a survey instance based on the title
 * @param title - The survey config title
 * @param existingInstances - Array of existing survey instances to check for conflicts
 * @returns A unique slug string
 */
export const generateUniqueSlug = (title: string, existingInstances: SurveyInstance[]): string => {
  // Generate a human-readable slug from the title
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  
  // Check if slug already exists and append a number if needed
  let slug = baseSlug;
  let counter = 1;
  while (existingInstances.some(instance => instance.slug === slug)) {
    slug = `${baseSlug}-${counter.toString().padStart(3, '0')}`;
    counter++;
  }
  
  return slug;
};