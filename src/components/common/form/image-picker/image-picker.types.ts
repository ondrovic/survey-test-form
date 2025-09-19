import { SurveyImage } from '../../../../types/framework.types';

// Environment-based configuration with fallback defaults
const getImageConfig = () => {
  const maxFiles = parseInt(import.meta.env.VITE_IMAGE_MAX_FILES || '10');
  const maxFileSizeMB = parseInt(import.meta.env.VITE_IMAGE_MAX_FILE_SIZE_MB || '10');
  const allowedTypes = import.meta.env.VITE_IMAGE_ALLOWED_TYPES
    ? import.meta.env.VITE_IMAGE_ALLOWED_TYPES.split(',').map(type => type.trim())
    : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  return {
    MAX_FILES: maxFiles,
    MAX_FILE_SIZE: maxFileSizeMB * 1024 * 1024, // Convert MB to bytes
    ALLOWED_TYPES: allowedTypes
  };
};

export const IMAGE_PICKER_DEFAULTS = getImageConfig();

export interface ImagePickerProps {
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Maximum number of files (only applies when multiple=true) */
  maxFiles?: number;
  /** Current images */
  images?: SurveyImage[];
  /** Callback when images are uploaded */
  onImagesChange?: (images: SurveyImage[]) => void;
  /** Callback when an image is deleted */
  onImageDelete?: (imageId: string) => void;
  /** Configuration for upload service */
  uploadOptions: {
    configId: string;
    entityType: 'field' | 'option' | 'section' | 'subsection';
    entityId: string;
  };
  /** Show image gallery preview */
  showGallery?: boolean;
  /** Label for the picker */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface ImagePickerState {
  uploading: boolean;
  uploadProgress: number;
  error?: string;
  dragActive: boolean;
}