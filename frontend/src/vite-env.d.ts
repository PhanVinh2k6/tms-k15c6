/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_USERS_PATH?: string
  readonly VITE_ROLES_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
