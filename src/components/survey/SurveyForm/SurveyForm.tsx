import { Alert, Button, Input } from '@/components/common';
import { CheckboxGroup, RadioGroup, ServiceLineSection } from '@/components/form';
import {
    BUSINESS_FOCUS_OPTIONS,
    LICENSE_RANGES,
    MARKET_REGIONS
} from '@/constants';
import { useForm } from '@/hooks/useForm';
import { SurveyFormData } from '@/types';
import { createInitialServiceLineSection } from '@/utils/serviceLine.utils';
import { clsx } from 'clsx';
import React, { useCallback, useEffect } from 'react';
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
            businessFocus: ''
        },
        serviceLines: createInitialServiceLineSection()
    };



    const { values, errors, handleSubmit, setValue, resetForm, register, trigger, setError } = useForm({
        initialValues,
        onSubmit: async (formData: SurveyFormData) => {
            // Trigger validation for all fields
            const isValid = await trigger();

            // Check service lines validation manually
            const residentialSelected = values.serviceLines.residentialServices.some(category =>
                category.items.some(item => item.selected)
            );
            const commercialSelected = values.serviceLines.commercialServices.some(category =>
                category.items.some(item => item.selected)
            );
            const industriesSelected = values.serviceLines.industries.some(category =>
                category.items.some(item => item.selected)
            );

            const serviceLinesValid = residentialSelected || commercialSelected || industriesSelected;

            if (!isValid || !serviceLinesValid) {
                // Set service lines error if not valid
                if (!serviceLinesValid) {
                    setError('serviceLines', { message: 'At least one service line selection is required' });
                }

                return;
            }

            await onSubmit(formData);
        }
    });





    // Reset form when submission is successful
    useEffect(() => {
        if (success) {
            resetForm();
        }
    }, [success]);

    const handleBusinessInfoChange = useCallback((field: keyof typeof values.businessInfo, value: any) => {
        setValue('businessInfo', {
            ...values.businessInfo,
            [field]: value
        });
    }, [values.businessInfo, setValue]);

    const handleServiceLineChange = (section: 'residentialServices' | 'commercialServices' | 'industries', categoryIndex: number, itemIndex: number, selected: boolean) => {
        // Create a deep copy of the current service lines
        const currentServiceLines = JSON.parse(JSON.stringify(values.serviceLines));

        // Update the specific item
        currentServiceLines[section][categoryIndex].items[itemIndex].selected = selected;

        // Set the entire service lines object
        setValue('serviceLines', currentServiceLines);
    };

    const handleServiceLineRatingChange = (section: 'residentialServices' | 'commercialServices' | 'industries', categoryIndex: number, itemIndex: number, rating: any) => {
        const updatedCategories = [...values.serviceLines[section]];
        const updatedItems = [...updatedCategories[categoryIndex].items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], rating };
        updatedCategories[categoryIndex] = { ...updatedCategories[categoryIndex], items: updatedItems };

        setValue('serviceLines', {
            ...values.serviceLines,
            [section]: updatedCategories
        });
    };

    const handleServiceLineAdditionalNotesChange = (section: 'residentialServices' | 'commercialServices' | 'industries', notes: string) => {
        const notesField = section === 'residentialServices' ? 'residentialAdditionalNotes' :
            section === 'commercialServices' ? 'commercialAdditionalNotes' :
                'industriesAdditionalNotes';

        setValue('serviceLines', {
            ...values.serviceLines,
            [notesField]: notes
        });
    };



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
                                label="Other (optional)"
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



                {/* Service Line Sections */}
                <ServiceLineSection
                    title="Residential Services"
                    categories={values.serviceLines.residentialServices}
                    onItemChange={(categoryIndex, itemIndex, selected) => handleServiceLineChange('residentialServices', categoryIndex, itemIndex, selected)}
                    onRatingChange={(categoryIndex, itemIndex, rating) => handleServiceLineRatingChange('residentialServices', categoryIndex, itemIndex, rating)}
                    onAdditionalNotesChange={(notes) => handleServiceLineAdditionalNotesChange('residentialServices', notes)}
                    additionalNotes={values.serviceLines.residentialAdditionalNotes || ''}
                    isRequired={true}
                    error={errors.serviceLines?.message}
                />

                <ServiceLineSection
                    title="Commercial Services"
                    categories={values.serviceLines.commercialServices}
                    onItemChange={(categoryIndex, itemIndex, selected) => handleServiceLineChange('commercialServices', categoryIndex, itemIndex, selected)}
                    onRatingChange={(categoryIndex, itemIndex, rating) => handleServiceLineRatingChange('commercialServices', categoryIndex, itemIndex, rating)}
                    onAdditionalNotesChange={(notes) => handleServiceLineAdditionalNotesChange('commercialServices', notes)}
                    additionalNotes={values.serviceLines.commercialAdditionalNotes || ''}
                    isRequired={true}
                />

                <ServiceLineSection
                    title="Industries"
                    categories={values.serviceLines.industries}
                    onItemChange={(categoryIndex, itemIndex, selected) => handleServiceLineChange('industries', categoryIndex, itemIndex, selected)}
                    onRatingChange={(categoryIndex, itemIndex, rating) => handleServiceLineRatingChange('industries', categoryIndex, itemIndex, rating)}
                    onAdditionalNotesChange={(notes) => handleServiceLineAdditionalNotesChange('industries', notes)}
                    additionalNotes={values.serviceLines.industriesAdditionalNotes || ''}
                    isRequired={true}
                />





                {/* Submit Button */}
                <div className="flex flex-col items-end space-y-2">
                    {!connected && (
                        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                            ❌ No Firebase connection available. Please check your connection.
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