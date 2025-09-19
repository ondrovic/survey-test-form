/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  // Image upload configuration
  readonly VITE_IMAGE_MAX_FILES?: string;
  readonly VITE_IMAGE_MAX_FILE_SIZE_MB?: string;
  readonly VITE_IMAGE_ALLOWED_TYPES?: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly DEV: boolean;
  readonly PROD: boolean;
}
