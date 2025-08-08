import { RatingValue } from '@/types';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { ServiceLineSectionProps } from './service-line-section.types';

export const ServiceLineSection: React.FC<ServiceLineSectionProps> = ({
    title,
    categories,
    onRatingChange,
    onAdditionalNotesChange,
    additionalNotes = '',
    className,
    isRequired = true,
    error
}) => {
    const [openDropdown, setOpenDropdown] = useState<{ categoryIndex: number; itemIndex: number } | null>(null);

    const ratingOptions: Array<RatingValue | 'Not Important'> = ['High', 'Medium', 'Low', 'Not Important'];

    const handleDropdownToggle = (categoryIndex: number, itemIndex: number) => {
        const currentKey = { categoryIndex, itemIndex };
        setOpenDropdown(openDropdown?.categoryIndex === categoryIndex && openDropdown?.itemIndex === itemIndex ? null : currentKey);
    };

    const handleRatingSelect = (categoryIndex: number, itemIndex: number, rating: RatingValue | 'Not Important') => {
        onRatingChange(categoryIndex, itemIndex, rating);
        setOpenDropdown(null);
    };

    const getRatingButtonColor = (rating: RatingValue | 'Not Important') => {
        switch (rating) {
            case 'High':
                return 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200';
            case 'Medium':
                return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-200';
            case 'Low':
                return 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200';
            case 'Not Important':
                return 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200';
            default:
                return 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200';
        }
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
                    Rating scale: High priority, Medium priority, Low priority, Not Important
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
                                    return (
                                        <div
                                            key={itemIndex}
                                            className="flex items-center justify-between p-2 rounded-lg transition-all duration-200 bg-white border border-green-200 shadow-sm"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-sm text-gray-800">
                                                    {item.name}
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDropdownToggle(categoryIndex, itemIndex)}
                                                    className={clsx(
                                                        'flex items-center space-x-2 px-2 py-1 rounded-md border transition-colors duration-200',
                                                        getRatingButtonColor(item.rating)
                                                    )}
                                                >
                                                    <span className="text-sm">
                                                        {item.rating}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </button>

                                                {openDropdown?.categoryIndex === categoryIndex &&
                                                    openDropdown?.itemIndex === itemIndex && (
                                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px] transform-gpu">
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