import { SurveyImage } from '../types/framework.types';
import { IMAGE_PICKER_DEFAULTS } from '../components/common/form/image-picker/image-picker.types';

export interface ImageUploadResult {
  success: boolean;
  image?: SurveyImage;
  error?: string;
}

export interface ImageUploadOptions {
  configId: string;
  entityType: 'field' | 'option' | 'section' | 'subsection';
  entityId: string;
  altText?: string;
  caption?: string;
  isPrimary?: boolean;
}

export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = IMAGE_PICKER_DEFAULTS.MAX_FILE_SIZE;
  private static readonly ALLOWED_TYPES = [...IMAGE_PICKER_DEFAULTS.ALLOWED_TYPES];

  static async uploadImages(
    files: File[],
    options: ImageUploadOptions
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadSingleImage(file, {
        ...options,
        isPrimary: options.isPrimary && i === 0 // Only first image can be primary
      });
      results.push(result);
    }

    return results;
  }

  static async uploadSingleImage(
    file: File,
    options: ImageUploadOptions
  ): Promise<ImageUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // For now, create a mock SurveyImage that represents what would be uploaded
      // In a real implementation, this would upload to Supabase Storage and save to database
      const mockImage: SurveyImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        filename: file.name,
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath: `mock/${options.configId}/${options.entityType}/${options.entityId}/${file.name}`,
        storageUrl: URL.createObjectURL(file), // Temporary URL for preview
        width: undefined,
        height: undefined,
        altText: options.altText || '',
        caption: options.caption || '',
        entityType: options.entityType,
        entityId: options.entityId,
        configId: options.configId,
        displayOrder: 0,
        isPrimary: options.isPrimary || false,
        isActive: true,
        uploadStatus: 'completed',
        uploadedBy: 'current_user',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return { success: true, image: mockImage };

    } catch (error) {
      console.error('Upload service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async deleteImage(imageId: string): Promise<boolean> {
    try {
      // For now, just return success
      // In a real implementation, this would delete from Supabase Storage and database
      console.log('Mock delete image:', imageId);
      return true;
    } catch (error) {
      console.error('Delete service error:', error);
      return false;
    }
  }

  static async getImages(
    configId: string,
    entityType?: string,
    entityId?: string
  ): Promise<SurveyImage[]> {
    try {
      // For now, return empty array
      // In a real implementation, this would fetch from the database
      console.log('Mock get images:', { configId, entityType, entityId });
      return [];
    } catch (error) {
      console.error('Get images service error:', error);
      return [];
    }
  }

  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit` };
    }

    if (!this.ALLOWED_TYPES.includes(file.type as any)) {
      return { valid: false, error: 'File type not supported. Please use JPEG, PNG, GIF, or WebP.' };
    }

    return { valid: true };
  }
}