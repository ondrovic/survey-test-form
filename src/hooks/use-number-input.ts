import { useCallback } from 'react';

/**
 * Custom hook for handling number input validation and key restrictions
 * 
 * This hook provides validated change and blur handlers for number inputs,
 * as well as a keyDown handler that prevents invalid characters.
 * 
 * @returns Object with handlers for number input functionality
 */
export const useNumberInput = <T extends string | number = string>() => {
  /**
   * Validates if a string is a valid numeric input
   */
  const isValidNumericInput = useCallback((value: string): boolean => {
    if (value === '') return true;
    
    // Allow valid number patterns: digits, decimal point, minus sign at start
    return /^-?\d*\.?\d*$/.test(value) && 
           !value.toLowerCase().includes('e') && 
           !value.includes('+');
  }, []);

  /**
   * Handles input change events for number inputs
   */
  const handleNumberChange = useCallback(<T extends string | number = string>(
    value: string,
    onChange?: (value: T) => void
  ): void => {
    if (isValidNumericInput(value)) {
      onChange?.(value as T);
    }
    // If invalid, don't call onChange (keeps the previous valid value)
  }, [isValidNumericInput]);

  /**
   * Handles input blur events for number inputs
   */
  const handleNumberBlur = useCallback(<T extends string | number = string>(
    value: string,
    onBlur?: (value: T) => void
  ): void => {
    if (isValidNumericInput(value)) {
      onBlur?.(value as T);
    }
  }, [isValidNumericInput]);

  /**
   * Handles keydown events to prevent invalid characters in number inputs
   */
  const handleNumberKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    const key = e.key;
    
    // Block 'e', 'E', '+' specifically (common invalid chars in number inputs)
    if (key === 'e' || key === 'E' || key === '+') {
      e.preventDefault();
      return;
    }
    
    // Allow control keys: backspace, delete, tab, escape, enter, arrow keys
    const controlKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 
      'Home', 'End'
    ];
    
    if (controlKeys.includes(key)) {
      return;
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z (copy/paste/select all/undo)
    if (e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
      return;
    }
    
    // Allow digits, decimal point, and minus sign
    if (/^[0-9.-]$/.test(key)) {
      return;
    }
    
    // Block everything else
    e.preventDefault();
  }, []);

  return {
    isValidNumericInput,
    handleNumberChange,
    handleNumberBlur,
    handleNumberKeyDown,
  };
};