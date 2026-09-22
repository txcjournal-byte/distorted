/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'local' (default) renders audio in the browser; 'mock' produces none. */
  readonly VITE_ENGINE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
