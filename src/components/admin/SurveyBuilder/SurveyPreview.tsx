import React from 'react';
import { SurveyConfig } from '../../../types/survey.types';

interface SurveyPreviewProps {
    config: SurveyConfig;
}

export const SurveyPreview: React.FC<SurveyPreviewProps> = ({ config }) => {
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{config.title}</h2>
            {config.description && (
                <p className="text-gray-600 mb-6">{config.description}</p>
            )}
            {config.sections.map((section) => (
                <div key={section.id} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                    {section.description && (
                        <p className="text-gray-600 mb-4">{section.description}</p>
                    )}
                    <div className="space-y-4">
                        {section.fields.map((field) => (
                            <div key={field.id} className="p-4 border rounded">
                                <label className="block text-sm font-medium mb-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <div className="text-gray-500 text-sm mb-2">
                                    Type: {field.type}
                                    {field.ratingScaleId && (
                                        <span className="ml-2 text-green-600">
                                            (Using rating scale: {field.ratingScaleName})
                                        </span>
                                    )}
                                </div>

                                {/* Preview field based on type */}
                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        placeholder={field.placeholder || "Text input"}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        placeholder={field.placeholder || "Text area"}
                                        disabled
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                    />
                                )}

                                {field.type === 'email' && (
                                    <input
                                        type="email"
                                        placeholder={field.placeholder || "Enter your email address"}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                    />
                                )}

                                {field.type === 'multiselect' && field.options && field.options.length > 0 && (
                                    <div className="space-y-2">
                                        {field.options.map((option, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    disabled
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{option.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'radio' && field.options && field.options.length > 0 && (
                                    <div className="space-y-1">
                                        {field.options.map((option, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name={`preview-${field.id}`}
                                                    disabled
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{option.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'checkbox' && field.options && field.options.length > 0 && (
                                    <div className="space-y-1">
                                        {field.options.map((option, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    disabled
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{option.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'rating' && field.ratingScaleId && (
                                    <div className="mt-3">
                                        <div className="text-xs text-gray-500 mb-2">Rating Scale Options:</div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="text-sm text-blue-600">
                                                Using rating scale: {field.ratingScaleName}
                                            </span>
                                        </div>
                                        {/* Preview dropdown for rating scale */}
                                        <div className="relative">
                                            <select
                                                disabled
                                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>
                                                    Select rating...
                                                </option>
                                                <option value="high">High (Default)</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                                <option value="not_important">Not Important</option>
                                            </select>
                                        </div>
                                        {/* Show rating scale options as badges */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="px-2 py-1 text-xs rounded border bg-yellow-100 text-yellow-700 border-yellow-200">
                                                High (Default)
                                            </span>
                                            <span className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Medium
                                            </span>
                                            <span className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Low
                                            </span>
                                            <span className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200">
                                                Not Important
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {field.type === 'rating' && !field.ratingScaleId && field.options && field.options.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {field.options.map((option, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-700 border-gray-200"
                                            >
                                                {option.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
