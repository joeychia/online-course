/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COSMOS_DB_CONNECTION_STRING: string;
  readonly VITE_COSMOS_DB_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 