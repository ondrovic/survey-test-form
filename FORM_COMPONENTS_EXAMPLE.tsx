/**
 * Example usage of the refactored CheckboxGroup and RadioGroup components
 * This demonstrates the new design system integration and FormField patterns
 */
import React, { useState } from 'react';
import { CheckboxGroup, RadioGroup } from '@/components/form';

interface ExampleFormData {
  regions: string[];
  licenseRange: string;
  skills: number[];
  priority: number;
}

const FormComponentExample: React.FC = () => {
  const [formData, setFormData] = useState<ExampleFormData>({
    regions: [],
    licenseRange: '',
    skills: [],
    priority: 0,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ExampleFormData, string>>>({});

  const regionOptions = [
    { value: 'north', label: 'North America' },
    { value: 'south', label: 'South America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia', label: 'Asia' },
    { value: 'africa', label: 'Africa' },
    { value: 'oceania', label: 'Oceania' },
  ];

  const licenseOptions = [
    { value: '1-10', label: '1-10 licenses' },
    { value: '11-50', label: '11-50 licenses' },
    { value: '51-100', label: '51-100 licenses' },
    { value: '100+', label: '100+ licenses' },
  ];

  const skillOptions = [
    { value: 1, label: 'JavaScript' },
    { value: 2, label: 'TypeScript' },
    { value: 3, label: 'React' },
    { value: 4, label: 'Vue.js' },
    { value: 5, label: 'Angular' },
    { value: 6, label: 'Node.js' },
    { value: 7, label: 'Python' },
    { value: 8, label: 'Java' },
  ];

  const priorityOptions = [
    { value: 1, label: 'Low Priority' },
    { value: 2, label: 'Medium Priority' },
    { value: 3, label: 'High Priority' },
    { value: 4, label: 'Critical Priority' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Partial<Record<keyof ExampleFormData, string>> = {};
    
    if (formData.regions.length === 0) {
      newErrors.regions = 'Please select at least one region';
    }
    
    if (!formData.licenseRange) {
      newErrors.licenseRange = 'Please select a license range';
    }
    
    if (formData.skills.length < 2) {
      newErrors.skills = 'Please select at least 2 skills';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Please select a priority level';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully! Check console for data.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Refactored Form Components Demo
        </h1>
        <p className="text-gray-600 mb-8">
          This example shows the enhanced CheckboxGroup and RadioGroup components with:
        </p>
        <ul className="list-disc list-inside text-gray-600 mb-8 space-y-1">
          <li>Design token integration for consistent styling</li>
          <li>FormField compound component pattern</li>
          <li>Enhanced TypeScript support</li>
          <li>Better accessibility (ARIA attributes, semantic HTML)</li>
          <li>Improved composition patterns</li>
          <li>Mobile-first responsive design</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Example Form</h2>

        {/* CheckboxGroup with multiple selections */}
        <CheckboxGroup
          name="regions"
          label="Target Regions"
          options={regionOptions}
          selectedValues={formData.regions}
          onChange={(values) => setFormData(prev => ({ ...prev, regions: values }))}
          required
          error={errors.regions}
          layout="balanced"
          maxSelections={3}
          data-testid="regions-checkbox-group"
          className="mb-6"
        />

        {/* RadioGroup for single selection */}
        <RadioGroup
          name="licenseRange"
          label="License Range"
          options={licenseOptions}
          selectedValue={formData.licenseRange}
          onChange={(value) => setFormData(prev => ({ ...prev, licenseRange: value }))}
          required
          error={errors.licenseRange}
          layout="grid"
          data-testid="license-radio-group"
          className="mb-6"
        />

        {/* CheckboxGroup with numeric values */}
        <CheckboxGroup
          name="skills"
          label="Technical Skills"
          options={skillOptions}
          selectedValues={formData.skills}
          onChange={(values) => setFormData(prev => ({ ...prev, skills: values }))}
          required
          error={errors.skills}
          layout="grid"
          minSelections={2}
          maxSelections={5}
          data-testid="skills-checkbox-group"
          className="mb-6"
        />

        {/* RadioGroup with numeric values */}
        <RadioGroup
          name="priority"
          label="Priority Level"
          options={priorityOptions}
          selectedValue={formData.priority}
          onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          required
          error={errors.priority}
          layout="horizontal"
          data-testid="priority-radio-group"
          className="mb-8"
        />

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({ regions: [], licenseRange: '', skills: [], priority: 0 });
              setErrors({});
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-white bg-amber-600 border border-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </form>

      {/* Display current form state */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Current Form State:</h3>
        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* Usage Examples */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Patterns</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">1. Standalone Usage (Recommended)</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
{`<CheckboxGroup
  name="regions"
  label="Select Regions"
  options={regionOptions}
  selectedValues={selectedRegions}
  onChange={setSelectedRegions}
  required
  error={errors.regions}
  layout="balanced"
  maxSelections={3}
/>`}
            </pre>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">2. Within Existing FormField Context</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
{`<FormField name="regions" required error={errors.regions}>
  <FormField.Label>Select Regions</FormField.Label>
  <CheckboxGroup.WithContext
    name="regions"
    options={regionOptions}
    selectedValues={selectedRegions}
    onChange={setSelectedRegions}
    layout="balanced"
  />
  <FormField.Error />
</FormField>`}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">3. Layout Options</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li><code>horizontal</code> - Flexbox row layout</li>
              <li><code>vertical</code> - Single column layout</li>
              <li><code>grid</code> - Smart grid based on item count</li>
              <li><code>balanced</code> - Optimized distribution (default)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormComponentExample;