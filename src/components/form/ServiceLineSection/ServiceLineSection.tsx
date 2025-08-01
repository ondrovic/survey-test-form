import { RatingValue } from '@/types';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

export interface ServiceLineItem {
    name: string;
    selected: boolean;
    rating: RatingValue | 'N/A';
}

export interface ServiceLineCategory {
    heading: string;
    items: ServiceLineItem[];
}

export interface ServiceLineSectionProps {
    title: string;
    categories: ServiceLineCategory[];
    onItemChange: (categoryIndex: number, itemIndex: number, selected: boolean) => void;
    onRatingChange: (categoryIndex: number, itemIndex: number, rating: RatingValue | 'N/A') => void;
    onAdditionalNotesChange?: (notes: string) => void;
    additionalNotes?: string;
    className?: string;
    isRequired?: boolean;
    error?: string;
}

export const ServiceLineSection: React.FC<ServiceLineSectionProps> = ({
    title,
    categories,
    onItemChange,
    onRatingChange,
    onAdditionalNotesChange,
    additionalNotes = '',
    className,
    isRequired = true,
    error
}) => {
    const [openDropdown, setOpenDropdown] = useState<{ categoryIndex: number; itemIndex: number } | null>(null);

    const ratingOptions: Array<RatingValue | 'N/A'> = ['N/A', 'High', 'Medium', 'Low'];

    const handleDropdownToggle = (categoryIndex: number, itemIndex: number) => {
        const isSelected = categories[categoryIndex]?.items[itemIndex]?.selected || false;
        if (!isSelected) return; // Don't open if not selected

        const currentKey = { categoryIndex, itemIndex };
        setOpenDropdown(openDropdown?.categoryIndex === categoryIndex && openDropdown?.itemIndex === itemIndex ? null : currentKey);
    };

    const handleRatingSelect = (categoryIndex: number, itemIndex: number, rating: RatingValue | 'N/A') => {
        onRatingChange(categoryIndex, itemIndex, rating);
        setOpenDropdown(null);
    };

    const handleItemChange = (categoryIndex: number, itemIndex: number, selected: boolean) => {
        onItemChange(categoryIndex, itemIndex, selected);
    };

    const classes = clsx('bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-3', className);

    return (
        <div className={classes}>
            <div className="mb-4">
                <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    {isRequired && (
                        <span className="text-red-500 text-sm">*</span>
                    )}
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-700">
                    Instructions: For each service line below, how important is this to your business?
                </p>
                <p className="text-sm text-gray-700">
                    Rating scale: High priority, Medium priority, Low priority, Not Applicable
                </p>
                {error && (
                    <p className="text-sm text-red-600" role="alert">
                        {error}
                    </p>
                )}
            </div>

            <div className="bg-amber-50 rounded-lg border border-amber-100 p-4">
                <div className="space-y-4">
                    {categories.map((category, categoryIndex) => (
                        <div key={categoryIndex} className="space-y-2">
                            {category.heading && (
                                <h3 className="text-lg font-semibold text-gray-900">{category.heading}</h3>
                            )}
                            <div className="space-y-2">
                                {category.items.map((item, itemIndex) => {
                                    const isChecked = item.selected;

                                    return (
                                        <div
                                            key={itemIndex}
                                            className={clsx(
                                                'flex items-center justify-between p-2 rounded-lg transition-all duration-200',
                                                isChecked
                                                    ? 'bg-white border border-green-200 shadow-sm'
                                                    : 'bg-white border border-gray-200 shadow-sm'
                                            )}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        const newSelected = e.target.checked;
                                                        handleItemChange(categoryIndex, itemIndex, newSelected);
                                                    }}
                                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                                />
                                                <span className={clsx(
                                                    'text-sm',
                                                    isChecked ? 'text-gray-800' : 'text-gray-600'
                                                )}>
                                                    {item.name}
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDropdownToggle(categoryIndex, itemIndex)}
                                                    disabled={!isChecked}
                                                    className={clsx(
                                                        'flex items-center space-x-2 px-2 py-1 rounded-md border transition-colors duration-200',
                                                        isChecked
                                                            ? 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200'
                                                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                    )}
                                                >
                                                    <span className="text-sm">
                                                        {isChecked ? item.rating : 'N/A'}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </button>

                                                {openDropdown?.categoryIndex === categoryIndex &&
                                                    openDropdown?.itemIndex === itemIndex &&
                                                    isChecked && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                                                            {ratingOptions.map((rating) => (
                                                                <button
                                                                    key={rating}
                                                                    type="button"
                                                                    onClick={() => handleRatingSelect(categoryIndex, itemIndex, rating)}
                                                                    className={clsx(
                                                                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors duration-200',
                                                                        item.rating === rating ? 'bg-amber-50 text-amber-700' : 'text-gray-700'
                                                                    )}
                                                                >
                                                                    {rating}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Anything we missed section */}
            <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Anything we missed? Please add your own</h3>
                <textarea
                    value={additionalNotes}
                    onChange={(e) => onAdditionalNotesChange?.(e.target.value)}
                    placeholder="Please specify any additional services or industries not listed above"
                    className="w-full h-24 px-3 py-2 bg-white border border-amber-200 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
                    maxLength={500}
                />
            </div>
        </div>
    );
}; 