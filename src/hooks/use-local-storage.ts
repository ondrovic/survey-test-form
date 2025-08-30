import { UseLocalStorageReturn } from "@/types";
import { ErrorLoggingService } from "@/services/error-logging.service";
import { useCallback, useEffect, useState } from "react";

export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): UseLocalStorageReturn<T> => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: error instanceof Error ? error.message : 'Error reading localStorage',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'useLocalStorage',
        functionName: 'useState.initializer',
        userAction: 'Reading localStorage value',
        additionalContext: {
          key,
          errorType: 'localstorage_read',
          hasDefaultValue: defaultValue !== undefined
        },
        tags: ['hooks', 'local-storage', 'browser']
      });
      
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          newValue instanceof Function ? newValue(value) : newValue;
        setValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        // Log the error using ErrorLoggingService
        ErrorLoggingService.logError({
          severity: 'low',
          errorMessage: error instanceof Error ? error.message : 'Error setting localStorage',
          stackTrace: error instanceof Error ? error.stack : String(error),
          componentName: 'useLocalStorage',
          functionName: 'setStoredValue',
          userAction: 'Setting localStorage value',
          additionalContext: {
            key,
            errorType: 'localstorage_write',
            valueType: typeof newValue
          },
          tags: ['hooks', 'local-storage', 'browser']
        });
      }
    },
    [key, value]
  );

  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      // Log the error using ErrorLoggingService
      ErrorLoggingService.logError({
        severity: 'low',
        errorMessage: error instanceof Error ? error.message : 'Error removing localStorage',
        stackTrace: error instanceof Error ? error.stack : String(error),
        componentName: 'useLocalStorage',
        functionName: 'removeValue',
        userAction: 'Removing localStorage value',
        additionalContext: {
          key,
          errorType: 'localstorage_remove'
        },
        tags: ['hooks', 'local-storage', 'browser']
      });
    }
  }, [key, defaultValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (error) {
          // Log the error using ErrorLoggingService
          ErrorLoggingService.logError({
            severity: 'low',
            errorMessage: error instanceof Error ? error.message : 'Error parsing localStorage value',
            stackTrace: error instanceof Error ? error.stack : String(error),
            componentName: 'useLocalStorage',
            functionName: 'handleStorageChange',
            userAction: 'Parsing localStorage change event',
            additionalContext: {
              key,
              newValue: e.newValue,
              errorType: 'localstorage_parse'
            },
            tags: ['hooks', 'local-storage', 'browser']
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return {
    value,
    setValue: setStoredValue,
    removeValue,
  };
}
