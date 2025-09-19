import { clsx } from 'clsx';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import { ImageRadioGroupProps } from './ImageRadioGroup.types';

/**
 * ImageRadioGroup component for single selection with image display
 * 
 * @example
 * ```tsx
 * <ImageRadioGroup
 *   name="layoutVersion"
 *   options={layoutOptions}
 *   selectedValue={selectedLayout}
 *   onChange={setSelectedLayout}
 *   label="Select Layout Version"
 *   required
 *   error={errors.layoutVersion}
 * />
 * ```
 */
export const ImageRadioGroup = <T extends string | number = string>({
    name,
    options,
    selectedValue,
    onChange,
    label,
    required = false,
    error,
    layout = 'vertical',
    'data-testid': testId,
    className
}: ImageRadioGroupProps<T>) => {
    const groupId = `${name}-group`;
    const errorId = `${name}-error`;
    const layoutClasses = {
        horizontal: 'grid grid-cols-1 md:grid-cols-2 gap-6',
        vertical: 'space-y-6'
    };

    const classes = clsx('space-y-2', className);

    const getImagesForOption = (option: any) => {
        if (option.images && option.images.length > 0) {
            return option.images;
        }
        if (option.image) {
            return [option.image];
        }
        return [];
    };

    return (
        <div className={classes}>
            <fieldset>
                {label && (
                    <legend className="text-sm font-semibold text-gray-800 mb-3">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </legend>
                )}

                <div
                    className={layoutClasses[layout]}
                    role="radiogroup"
                    aria-labelledby={groupId}
                    aria-describedby={error ? errorId : undefined}
                    data-testid={testId}
                >
                    {options.map((option) => {
                        const optionId = `${name}-${option.value}`;
                        const isChecked = selectedValue === option.value;
                        const images = getImagesForOption(option);

                        return (
                            <div key={option.value} className="space-y-4">
                                {/* Main Selection Card */}
                                <div
                                    className={clsx(
                                        "relative bg-slate-50 border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md",
                                        isChecked
                                            ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200 shadow-sm"
                                            : "border-gray-300 hover:border-gray-400"
                                    )}
                                    onClick={() => onChange(option.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onChange(option.value);
                                        }
                                    }}
                                    role="radio"
                                    tabIndex={0}
                                    aria-checked={isChecked}
                                    aria-labelledby={`${optionId}-label`}
                                >
                                    {/* Radio Button */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <input
                                                id={optionId}
                                                name={name}
                                                type="radio"
                                                value={option.value}
                                                checked={isChecked}
                                                onChange={() => onChange(option.value)}
                                                disabled={option.disabled}
                                                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                                            />
                                            <label
                                                id={`${optionId}-label`}
                                                htmlFor={optionId}
                                                className={clsx(
                                                    'ml-3 text-base font-medium text-gray-800 cursor-pointer',
                                                    option.disabled && 'opacity-50 cursor-not-allowed'
                                                )}
                                            >
                                                {option.label}
                                            </label>
                                        </div>
                                        {isChecked && (
                                            <div className="text-amber-600">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Images Display */}
                                    {images.length > 0 && (
                                        <div className="mt-4 relative custom-image-gallery">
                                            <ImageGallery
                                                items={images.map((imageSrc, index) => ({
                                                    original: imageSrc,
                                                    thumbnail: imageSrc,
                                                    originalAlt: `${option.label} layout preview ${index + 1}`,
                                                    thumbnailAlt: `${option.label} thumbnail ${index + 1}`,
                                                }))}
                                                showThumbnails={images.length > 1}
                                                showPlayButton={false}
                                                showFullscreenButton={true}
                                                showNav={false}
                                                showBullets={false}
                                                autoPlay={false}
                                                slideInterval={3000}
                                                slideDuration={450}
                                                thumbnailPosition="bottom"
                                                useBrowserFullscreen={true}
                                                onImageError={(e) => console.error('Image failed to load:', e)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </fieldset>

            {error && (
                <p
                    id={errorId}
                    className="text-sm text-red-600"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
};
