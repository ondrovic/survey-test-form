import { AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';
import { useValidation } from '../../../contexts/validation-context';
import { SurveyConfig } from '../../../types/framework.types';

interface ValidationSummaryProps {
    config: SurveyConfig;
    className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ config, className = '' }) => {
    const { validateSurvey } = useValidation();
    
    const validation = validateSurvey(config);
    
    if (validation.isValid) {
        return (
            <div className={`flex items-center gap-2 text-green-600 text-sm ${className}`}>
                <CheckCircle className="w-4 h-4" />
                <span>Survey is ready to save</span>
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Validation Issues ({validation.errors.length})</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
                {validation.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                        {error}
                    </div>
                ))}
                {validation.errors.length > 5 && (
                    <div className="text-xs text-gray-500 italic">
                        +{validation.errors.length - 5} more issues
                    </div>
                )}
            </div>
        </div>
    );
};