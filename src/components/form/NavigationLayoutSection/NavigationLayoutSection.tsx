import { ImageRadioGroup } from '@/components/form';
import { NAVIGATION_LAYOUTS } from '@/constants';
import { clsx } from 'clsx';
import React from 'react';
import { NavigationLayoutSectionProps } from './NavigationLayoutSection.types';

/**
 * NavigationLayoutSection component that renders navigation layout selection
 * Uses ImageRadioGroup to display layout options with images
 * 
 * @example
 * ```tsx
 * <NavigationLayoutSection
 *   selectedValue={values.businessInfo.navigationLayout}
 *   onChange={handleNavigationLayoutChange}
 *   register={register}
 *   errors={errors}
 * />
 * ```
 */
export const NavigationLayoutSection: React.FC<NavigationLayoutSectionProps> = ({
    selectedValue,
    onChange,
    register,
    errors,
    className
}) => {
    const classes = clsx('space-y-6', className);

    return (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {NAVIGATION_LAYOUTS.question} <span className="text-red-500">*</span>
            </h2>

            <div className={classes}>
                <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
                    <ImageRadioGroup
                        name="businessInfo.navigationLayout"
                        options={[...NAVIGATION_LAYOUTS.options]}
                        selectedValue={selectedValue}
                        onChange={onChange}
                        required
                        error={errors?.navigationLayout?.message}
                        layout="vertical"
                    />
                    <input
                        {...register("businessInfo.navigationLayout", {
                            required: "Please select a navigation layout"
                        })}
                        type="hidden"
                        value={selectedValue || ''}
                    />
                </div>
            </div>
        </div>
    );
};
