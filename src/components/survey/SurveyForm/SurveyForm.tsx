import { Alert, Button, Input } from '@/components/common';
import { CheckboxGroup, NavigationLayoutSection, RadioGroup, ServiceLineSection, SubNavSection } from '@/components/form';
import {
    BUSINESS_FOCUS_OPTIONS,
    LICENSE_RANGES,
    MARKET_REGIONS
} from '@/constants';
import { useForm } from '@/hooks/useForm';
import { SurveyFormData } from '@/types';
import { createInitialSubNavValues } from '@/utils';
import { createInitialServiceLineSection } from '@/utils/serviceLine.utils';
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useRef } from 'react';
import { SurveyFormProps } from './SurveyForm.types';

/**
 * Main SurveyForm component that manages all form state and submission
 * Uses react-hook-form for form management and validation
 * 
 * @example
 * ```tsx
 * <SurveyForm
 *   onSubmit={handleSubmit}
 *   loading={isSubmitting}
 *   error={error}
 *   success={success}
 *   onDismissAlert={handleDismissAlert}
 * />
 * ```
 */
export const SurveyForm: React.FC<SurveyFormProps> = ({
    onSubmit,
    loading = false,
    error,
    success,
    onDismissAlert,
    className,
    connected = true
}) => {


    const initialSubNavValues = createInitialSubNavValues();

    const initialValues: SurveyFormData = {
        personalInfo: {
            fullName: '',
            email: '',
            franchise: ''
        },
        businessInfo: {
            marketRegions: [],
            otherMarket: '',
            numberOfLicenses: '',
            businessFocus: '',
            subNavQuestions: initialSubNavValues.subNavQuestions,
            subNavOtherText: initialSubNavValues.subNavOtherText,
            navigationLayout: ''
        },
        serviceLines: createInitialServiceLineSection()
    };



    const { values, errors, handleSubmit, setValue, resetForm, register, trigger } = useForm({
        initialValues,
        onSubmit: async (formData: SurveyFormData) => {
            // Trigger validation for all fields
            const isValid = await trigger();

            if (!isValid) {
                return;
            }

            await onSubmit(formData);
        }
    });





    // Track if we've already reset the form for this success state
    const hasResetForSuccess = useRef(false);

    // Reset form when submission is successful
    useEffect(() => {
        if (success && !hasResetForSuccess.current) {
            hasResetForSuccess.current = true;
            resetForm();
        } else if (!success) {
            // Reset the flag when success becomes false
            hasResetForSuccess.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [success]); // resetForm intentionally omitted to prevent infinite loop

    const handleBusinessInfoChange = useCallback((field: keyof SurveyFormData['businessInfo'], value: any) => {
        setValue('businessInfo', (prev) => ({
            ...prev,
            [field]: value
        }));
    }, [setValue]);

    const handleServiceLineRatingChange = useCallback((section: 'residentialServices' | 'commercialServices' | 'industries', categoryIndex: number, itemIndex: number, rating: any) => {
        setValue('serviceLines', (prev) => {
            const updatedCategories = [...prev[section]];
            const updatedItems = [...updatedCategories[categoryIndex].items];
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], rating };
            updatedCategories[categoryIndex] = { ...updatedCategories[categoryIndex], items: updatedItems };

            return {
                ...prev,
                [section]: updatedCategories
            };
        });
    }, [setValue]);

    const handleServiceLineAdditionalNotesChange = useCallback((section: 'residentialServices' | 'commercialServices' | 'industries', notes: string) => {
        const notesField = section === 'residentialServices' ? 'residentialAdditionalNotes' :
            section === 'commercialServices' ? 'commercialAdditionalNotes' :
                'industriesAdditionalNotes';

        setValue('serviceLines', (prev) => ({
            ...prev,
            [notesField]: notes
        }));
    }, [setValue]);

    const handleSubNavQuestionChange = useCallback((subNavKey: string, selectedValues: string[]) => {
        setValue('businessInfo', (prev) => ({
            ...prev,
            subNavQuestions: {
                ...prev.subNavQuestions,
                [subNavKey]: selectedValues
            }
        }));
    }, [setValue]);

    const handleNavigationLayoutChange = useCallback((value: string) => {
        setValue('businessInfo', (prev) => ({
            ...prev,
            navigationLayout: value
        }));
    }, [setValue]);




    const classes = clsx('space-y-8', className);

    return (
        <div className={classes}>
            {/* Alerts */}
            {error && (
                <Alert
                    type="error"
                    title="Submission Error"
                    message={error}
                    onDismiss={onDismissAlert}
                />
            )}

            {success && (
                <Alert
                    type="success"
                    title="Success!"
                    message={success}
                    onDismiss={onDismissAlert}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Personal Information Section */}
                <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-3">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">About You <span className="text-red-500">*</span></h2>

                    <div className="space-y-6">
                        <div className="space-y-6">
                            <Input
                                name="personalInfo.fullName"
                                register={register("personalInfo.fullName", {
                                    required: "First and last name is required"
                                })}
                                label="First and Last Name"
                                required
                                error={errors.personalInfo?.fullName?.message}
                                className="bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                            />

                            <Input
                                name="personalInfo.email"
                                register={register("personalInfo.email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: "Please enter a valid email address"
                                    }
                                })}
                                type="email"
                                label="Email"
                                required
                                error={errors.personalInfo?.email?.message}
                                className="bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                            />

                            <Input
                                name="personalInfo.franchise"
                                register={register("personalInfo.franchise", {
                                    required: "Franchise is required"
                                })}
                                label="Franchise Name"
                                required
                                error={errors.personalInfo?.franchise?.message}
                                className="bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                            />

                            <CheckboxGroup
                                name="businessInfo.marketRegions"
                                options={MARKET_REGIONS.map(region => ({ value: region, label: region }))}
                                selectedValues={values.businessInfo.marketRegions}
                                onChange={(values) => handleBusinessInfoChange('marketRegions', values)}
                                label="Market/Region you primarily serve"
                                required
                                error={errors.businessInfo?.marketRegions?.message}
                                layout="horizontal"
                            />

                            <input
                                {...register("businessInfo.marketRegions", {
                                    required: "Please select at least one market region"
                                })}
                                type="hidden"
                                value={values.businessInfo.marketRegions?.length > 0 ? 'selected' : ''}
                            />


                            <Input
                                name="businessInfo.otherMarket"
                                register={register}
                                label="Other Markets (optional)"
                                placeholder="Please specify"
                                maxLength={100}
                                className="bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                            />

                            <RadioGroup
                                name="businessInfo.numberOfLicenses"
                                options={[...LICENSE_RANGES]}
                                selectedValue={values.businessInfo.numberOfLicenses}
                                onChange={(value) => handleBusinessInfoChange('numberOfLicenses', value)}
                                label="Number of licenses or territories owned"
                                required
                                error={errors.businessInfo?.numberOfLicenses?.message}
                                layout="horizontal"
                            />
                            <input
                                {...register("businessInfo.numberOfLicenses", {
                                    required: "Number of licenses is required"
                                })}
                                type="hidden"
                                value={values.businessInfo.numberOfLicenses || ''}
                            />

                            <RadioGroup
                                name="businessInfo.businessFocus"
                                options={[...BUSINESS_FOCUS_OPTIONS]}
                                selectedValue={values.businessInfo.businessFocus}
                                onChange={(value) => handleBusinessInfoChange('businessFocus', value)}
                                label="Are you primarily residential, commercial, or mixed?"
                                required
                                error={errors.businessInfo?.businessFocus?.message}
                                layout="horizontal"
                            />
                            <input
                                {...register("businessInfo.businessFocus", {
                                    required: "Business focus is required"
                                })}
                                type="hidden"
                                value={values.businessInfo.businessFocus || ''}
                            />


                        </div>
                    </div>
                </div>

                {/* Sub-Navigation Questions Section */}
                <SubNavSection
                    subNavQuestions={values.businessInfo.subNavQuestions}
                    onQuestionChange={handleSubNavQuestionChange}
                    register={register}
                    errors={errors.businessInfo}
                />

                {/* Navigation Layout Section */}
                <NavigationLayoutSection
                    selectedValue={values.businessInfo.navigationLayout}
                    onChange={handleNavigationLayoutChange}
                    register={register}
                    errors={errors.businessInfo}
                />

                {/* Service Line Sections */}
                <ServiceLineSection
                    title="Residential Service Lines"
                    categories={values.serviceLines.residentialServices}
                    onRatingChange={(categoryIndex, itemIndex, rating) => handleServiceLineRatingChange('residentialServices', categoryIndex, itemIndex, rating)}
                    onAdditionalNotesChange={(notes) => handleServiceLineAdditionalNotesChange('residentialServices', notes)}
                    additionalNotes={values.serviceLines.residentialAdditionalNotes || ''}
                    isRequired={true}
                    error={errors.serviceLines?.message}
                />

                <ServiceLineSection
                    title="Commercial Service Lines"
                    categories={values.serviceLines.commercialServices}
                    onRatingChange={(categoryIndex, itemIndex, rating) => handleServiceLineRatingChange('commercialServices', categoryIndex, itemIndex, rating)}
                    onAdditionalNotesChange={(notes) => handleServiceLineAdditionalNotesChange('commercialServices', notes)}
                    additionalNotes={values.serviceLines.commercialAdditionalNotes || ''}
                    isRequired={true}
                />

                <ServiceLineSection
                    title="Industries"
                    categories={values.serviceLines.industries}
                    onRatingChange={(categoryIndex, itemIndex, rating) => handleServiceLineRatingChange('industries', categoryIndex, itemIndex, rating)}
                    onAdditionalNotesChange={(notes) => handleServiceLineAdditionalNotesChange('industries', notes)}
                    additionalNotes={values.serviceLines.industriesAdditionalNotes || ''}
                    isRequired={true}
                />





                {/* Submit Button */}
                <div className="flex flex-col items-end space-y-2">
                    {!connected && (
                        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                            ❌ No Database connection available. Please check your connection.
                        </div>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        disabled={loading || !connected}
                    >
                        {!connected ? 'Submit Disabled' : 'Submit Survey'}
                    </Button>
                </div>
            </form>
        </div>
    );
}; 