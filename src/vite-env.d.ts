/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_RATE_LIMIT_PER_MINUTE: string;
  readonly VITE_CACHE_TTL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
