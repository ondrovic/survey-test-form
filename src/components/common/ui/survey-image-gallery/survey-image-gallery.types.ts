import { SurveyImage } from '../../../../types/framework.types';

export interface SurveyImageGalleryProps {
  /** Array of images to display */
  images: SurveyImage[];
  /** Show thumbnails when multiple images */
  showThumbnails?: boolean;
  /** Show navigation arrows */
  showNav?: boolean;
  /** Show fullscreen button */
  showFullscreen?: boolean;
  /** Auto play slides */
  autoPlay?: boolean;
  /** Slide interval in milliseconds */
  slideInterval?: number;
  /** Custom CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}