import { InputHTMLAttributes } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

export interface PasswordInputProps<T extends string = string> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'onBlur'> {
    name: string;
    
    // Controlled component props
    value?: T;
    onChange?: (value: T) => void;
    onBlur?: (value: T) => void;
    
    // react-hook-form props
    register?: UseFormRegisterReturn;
    
    // UI props
    label?: string;
    placeholder?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    className?: string;
    autocomplete?: string;
    
    // Password-specific props
    showToggle?: boolean; // Whether to show the visibility toggle button
    
    // Test props
    'data-testid'?: string;
}