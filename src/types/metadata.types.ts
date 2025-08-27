/**
 * Metadata Type Definitions
 * 
 * Standard metadata types used across database entities for tracking
 * creation, updates, and ownership information.
 */

/**
 * Base metadata structure for database entities
 */
export interface BaseMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  ip?: string;
}

/**
 * Options for creating new metadata
 */
export interface CreateMetadataOptions extends Partial<Pick<BaseMetadata, 'createdBy' | 'ip'>> {
  // Create-specific options can be added here in the future
}

/**
 * Options for updating existing metadata
 */
export interface UpdateMetadataOptions extends Partial<Pick<BaseMetadata, 'createdBy' | 'ip'>> {
  // For semantic clarity, we can also accept updatedBy as an alias
  updatedBy?: string;
}