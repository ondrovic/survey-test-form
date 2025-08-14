/**
 * Utility functions for generating human-readable, semantic IDs
 */

// Base function to create kebab-case from text
const createKebabCase = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')           // Replace & with 'and' first
    .replace(/[^a-z0-9\s-_]/g, '')  // Keep underscores temporarily
    .replace(/[\s_]+/g, "-")        // Replace spaces AND underscores with hyphens
    .replace(/-+/g, "-")            // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, "");       // Remove leading/trailing hyphens
};

// Generate unique section ID based on title with collision handling
export const generateSectionId = (title: string, existingSectionIds: string[] = []): string => {
  const baseId = createKebabCase(title) || "untitled-section";
  
  // Check for collision
  if (!existingSectionIds.includes(baseId)) {
    return baseId;
  }
  
  // Find next available number
  let counter = 1;
  let candidateId: string;
  do {
    candidateId = `${baseId}-${counter}`;
    counter++;
  } while (existingSectionIds.includes(candidateId));
  
  return candidateId;
};

// Generate unique field ID based on type and label with collision handling
export const generateFieldId = (
  type: string, 
  label: string, 
  existingFieldIds: string[] = []
): string => {
  const labelPart = createKebabCase(label) || "untitled";
  const baseId = `${type}-${labelPart}`;
  
  // Check for collision
  if (!existingFieldIds.includes(baseId)) {
    return baseId;
  }
  
  // Find next available number
  let counter = 1;
  let candidateId: string;
  do {
    candidateId = `${baseId}-${counter}`;
    counter++;
  } while (existingFieldIds.includes(candidateId));
  
  return candidateId;
};

// Update section ID when title changes
export const updateSectionId = (
  currentId: string,
  newTitle: string, 
  existingSectionIds: string[] = []
): string => {
  const newBaseId = createKebabCase(newTitle) || "untitled-section";
  
  // If the current ID already matches what we'd generate, keep it
  if (currentId === newBaseId || currentId.startsWith(`${newBaseId}-`)) {
    return currentId;
  }
  
  // Generate new ID
  return generateSectionId(newTitle, existingSectionIds);
};

// Update field ID when label changes
// NOTE: For data integrity, field IDs should remain stable once created
// This function now preserves existing IDs to maintain survey response mapping
export const updateFieldId = (
  currentId: string,
  _type: string,
  _newLabel: string,
  _existingFieldIds: string[] = []
): string => {
  // ALWAYS preserve the existing ID to maintain data integrity
  // This prevents breaking the mapping between survey responses and fields
  return currentId;
};

// Re-export for consistency with existing code
export const createKebabCaseId = createKebabCase;