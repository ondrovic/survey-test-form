export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  loading: boolean;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseStorageOptions {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface FirebaseStorageReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  save: (item: T) => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: Record<
    string,
    {
      required?: string | boolean;
      pattern?: { value: RegExp; message: string };
      validate?: (value: any) => string | boolean;
    }
  >;
  onSubmit: (values: T) => Promise<void> | void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: any; // Allow nested error structure
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: <K extends keyof T>(
    field: K,
    value: T[K] | ((prev: T[K]) => T[K])
  ) => void;
  setFieldError: (field: keyof T, error: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  resetForm: () => void;
  register: any; // react-hook-form register function
  trigger: (name?: string | string[]) => Promise<boolean>; // react-hook-form trigger function
  setError: (name: string, error: { message: string }) => void; // react-hook-form setError function
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}
