import React from 'react';
import { clsx } from 'clsx';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { SurveyImageGalleryProps } from './survey-image-gallery.types';
import { ImageGalleryItem } from '../../../../types/framework.types';

export const SurveyImageGallery: React.FC<SurveyImageGalleryProps> = ({
  images,
  showThumbnails = true,
  showNav = true,
  showFullscreen = true,
  autoPlay = false,
  slideInterval = 3000,
  className,
  'data-testid': testId
}) => {
  if (!images || images.length === 0) {
    return null;
  }

  const galleryItems: ImageGalleryItem[] = images
    .filter(img => img.isActive && img.uploadStatus === 'completed')
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(img => ({
      original: img.storageUrl,
      thumbnail: img.storageUrl,
      originalAlt: img.altText || img.originalFilename,
      thumbnailAlt: img.altText || img.originalFilename,
      description: img.caption
    }));

  if (galleryItems.length === 0) {
    return null;
  }

  // For single image, show a simple image display
  if (galleryItems.length === 1) {
    const item = galleryItems[0];
    return (
      <div className={clsx('survey-image-single', className)} data-testid={testId}>
        <img
          src={item.original}
          alt={item.originalAlt}
          className="w-full h-auto rounded-lg shadow-sm"
        />
        {item.description && (
          <p className="text-sm text-gray-600 mt-2 italic">{item.description}</p>
        )}
      </div>
    );
  }

  // For multiple images, use the full gallery
  return (
    <div className={clsx('survey-image-gallery', className)} data-testid={testId}>
      <ImageGallery
        items={galleryItems}
        showThumbnails={showThumbnails}
        showPlayButton={false}
        showFullscreenButton={showFullscreen}
        showNav={showNav}
        showBullets={false}
        autoPlay={autoPlay}
        slideInterval={slideInterval}
        slideDuration={450}
        thumbnailPosition="bottom"
        useBrowserFullscreen={true}
        onImageError={(e) => {
          console.error('Survey image failed to load:', e);
        }}
      />
    </div>
  );
};