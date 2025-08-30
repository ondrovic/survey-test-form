import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ValidationStatus {
  hasErrors: boolean;
  errorCount: number;
  lastChecked: Date | null;
}

interface ValidationStatusContextType {
  validationStatus: ValidationStatus;
  updateValidationStatus: (results: any) => void;
  clearValidationStatus: () => void;
}

const ValidationStatusContext = createContext<ValidationStatusContextType | undefined>(undefined);

export const ValidationStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    hasErrors: false,
    errorCount: 0,
    lastChecked: null,
  });

  const updateValidationStatus = useCallback((results: any) => {
    const newStatus = {
      hasErrors: results.invalidConfigs > 0,
      errorCount: results.invalidConfigs || 0,
      lastChecked: new Date(),
    };

    setValidationStatus({ ...newStatus });
  }, []);

  const clearValidationStatus = useCallback(() => {
    const clearedStatus = {
      hasErrors: false,
      errorCount: 0,
      lastChecked: new Date(),
    };
    setValidationStatus({ ...clearedStatus });
  }, []);

  return (
    <ValidationStatusContext.Provider value={{
      validationStatus,
      updateValidationStatus,
      clearValidationStatus
    }}>
      {children}
    </ValidationStatusContext.Provider>
  );
};

export const useValidationStatus = () => {
  const context = useContext(ValidationStatusContext);
  if (!context) {
    throw new Error('useValidationStatus must be used within a ValidationStatusProvider');
  }
  return context;
};

// QUESTION: can we remove this function?
// Optional version that doesn't throw error if not in provider
export const useOptionalValidationStatus = () => {
  const context = useContext(ValidationStatusContext);
  return context || {
    validationStatus: { hasErrors: false, errorCount: 0, lastChecked: null },
    updateValidationStatus: () => console.log('No validation context available'),
    clearValidationStatus: () => console.log('No validation context available')
  };
};