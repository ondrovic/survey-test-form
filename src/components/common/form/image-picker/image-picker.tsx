import React, { useCallback, useState, useRef } from 'react';
import { clsx } from 'clsx';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { ImagePickerProps, ImagePickerState, IMAGE_PICKER_DEFAULTS } from './image-picker.types';
import { ImageUploadService } from '../../../../services/image-upload.service';
import { SurveyImage, ImageGalleryItem } from '../../../../types/framework.types';

export const ImagePicker: React.FC<ImagePickerProps> = ({
  multiple = false,
  maxFiles = IMAGE_PICKER_DEFAULTS.MAX_FILES,
  images = [],
  onImagesChange,
  onImageDelete,
  uploadOptions,
  showGallery = true,
  label = 'Upload Images',
  helpText,
  disabled = false,
  error,
  className,
  'data-testid': testId
}) => {
  const [state, setState] = useState<ImagePickerState>({
    uploading: false,
    uploadProgress: 0,
    dragActive: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (disabled || !files.length) return;

    const filesToUpload = multiple ? files.slice(0, maxFiles - images.length) : [files[0]];

    setState(prev => ({ ...prev, uploading: true, uploadProgress: 0, error: undefined }));

    try {
      const uploadResults = await ImageUploadService.uploadImages(filesToUpload, uploadOptions);

      const successfulUploads: SurveyImage[] = [];
      const errors: string[] = [];

      uploadResults.forEach(result => {
        if (result.success && result.image) {
          successfulUploads.push(result.image);
        } else if (result.error) {
          errors.push(result.error);
        }
      });

      if (successfulUploads.length > 0) {
        const newImages = multiple ? [...images, ...successfulUploads] : successfulUploads;
        onImagesChange?.(newImages);
      }

      if (errors.length > 0) {
        setState(prev => ({
          ...prev,
          error: `Upload failed: ${errors[0]}${errors.length > 1 ? ` (and ${errors.length - 1} more)` : ''}`
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
    } finally {
      setState(prev => ({ ...prev, uploading: false, uploadProgress: 0 }));
    }
  }, [disabled, multiple, maxFiles, images, uploadOptions, onImagesChange]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFileSelect(files);
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState(prev => ({ ...prev, dragActive: false }));

    if (disabled) return;

    const files = Array.from(event.dataTransfer.files);
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) {
      setState(prev => ({ ...prev, dragActive: true }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setState(prev => ({ ...prev, dragActive: false }));
  }, []);

  const handleDeleteImage = useCallback(async (imageId: string) => {
    if (disabled) return;

    try {
      const success = await ImageUploadService.deleteImage(imageId);
      if (success) {
        const updatedImages = images.filter(img => img.id !== imageId);
        onImagesChange?.(updatedImages);
        onImageDelete?.(imageId);
      } else {
        setState(prev => ({ ...prev, error: 'Failed to delete image' }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete image'
      }));
    }
  }, [disabled, images, onImagesChange, onImageDelete]);

  const canUploadMore = multiple ? images.length < maxFiles : images.length === 0;
  const galleryItems: ImageGalleryItem[] = images.map(img => ({
    original: img.storageUrl,
    thumbnail: img.storageUrl,
    originalAlt: img.altText || img.originalFilename,
    thumbnailAlt: img.altText || img.originalFilename,
    description: img.caption
  }));

  return (
    <div className={clsx('space-y-4', className)} data-testid={testId}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <div
          className={clsx(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors',
            {
              'border-gray-300 hover:border-gray-400': !state.dragActive && !disabled,
              'border-blue-400 bg-blue-50': state.dragActive,
              'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed': disabled,
              'border-red-300 bg-red-50': error
            }
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileInputChange}
            disabled={disabled || state.uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="text-center">
            {state.uploading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className={clsx('w-8 h-8 mx-auto mb-2', {
                  'text-gray-400': !disabled,
                  'text-gray-300': disabled
                })} />
                <p className={clsx('text-sm', {
                  'text-gray-600': !disabled,
                  'text-gray-400': disabled
                })}>
                  {state.dragActive ? 'Drop images here' : 'Drag and drop images here, or click to select'}
                </p>
                {multiple && (
                  <p className="text-xs text-gray-500 mt-1">
                    {images.length} of {maxFiles} images selected
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      {helpText && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}

      {/* Error Message */}
      {(error || state.error) && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error || state.error}</span>
        </div>
      )}

      {/* Image List */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.storageUrl}
                    alt={image.altText || image.originalFilename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Delete Button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Delete image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}

                {/* Image Info */}
                <div className="mt-2 text-xs text-gray-500 truncate">
                  {image.originalFilename}
                </div>
              </div>
            ))}
          </div>

          {/* Gallery View */}
          {showGallery && images.length > 1 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Gallery Preview
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <ImageGallery
                  items={galleryItems}
                  showThumbnails={images.length > 1}
                  showPlayButton={false}
                  showFullscreenButton={true}
                  showNav={images.length > 1}
                  showBullets={false}
                  autoPlay={false}
                  slideInterval={3000}
                  slideDuration={450}
                  thumbnailPosition="bottom"
                  useBrowserFullscreen={true}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};