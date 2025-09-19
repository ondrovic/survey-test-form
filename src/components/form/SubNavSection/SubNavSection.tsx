import { TextArea } from '@/components/common';
import { CheckboxGroup } from '@/components/form';
import { getSubNavQuestions } from '@/utils';
import { clsx } from 'clsx';
import React from 'react';
import { SubNavSectionProps } from './SubNavSection.types';

/**
 * SubNavSection component that renders dynamic sub-navigation questions
 * Each question is styled as an individual item within the section
 * 
 * @example
 * ```tsx
 * <SubNavSection
 *   subNavQuestions={values.businessInfo.subNavQuestions}
 *   subNavOtherText={values.businessInfo.subNavOtherText}
 *   onQuestionChange={handleSubNavQuestionChange}
 *   onOtherTextChange={handleSubNavOtherTextChange}
 *   register={register}
 *   errors={errors}
 * />
 * ```
 */
export const SubNavSection: React.FC<SubNavSectionProps> = ({
    subNavQuestions,
    onQuestionChange,
    register,
    errors,
    className
}) => {
    const questions = getSubNavQuestions();

    const classes = clsx('space-y-6', className);

    return (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Navigation Sub-Navigation Options <span className="text-red-500">*</span>
            </h2>

            <div className={classes}>
                {questions.map((question) => (
                    <div
                        key={question.subNavKey}
                        className="bg-white rounded-lg shadow-sm border border-amber-200 p-6 space-y-4"
                    >
                        <div className="space-y-4">
                            <CheckboxGroup
                                name={`businessInfo.subNavQuestions.${question.subNavKey}`}
                                options={[...question.options]}
                                selectedValues={subNavQuestions[question.subNavKey] || []}
                                onChange={(selectedValues) => onQuestionChange(question.subNavKey, selectedValues)}
                                label={question.question}
                                required
                                error={errors?.subNavQuestions?.[question.subNavKey]?.message}
                                layout="vertical"
                            />
                            <input
                                {...register(`businessInfo.subNavQuestions.${question.subNavKey}` as any, {
                                    required: `Please select at least one option for ${question.service}`
                                })}
                                type="hidden"
                                value={subNavQuestions[question.subNavKey]?.length > 0 ? 'selected' : ''}
                            />

                            {question.textArea && (
                                <div className="mt-4">
                                    <TextArea
                                        name={`businessInfo.subNavOtherText.${question.subNavOtherKey}`}
                                        register={register}
                                        label={question.textArea.label}
                                        placeholder="Please specify"
                                        maxLength={200}
                                        className="bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
