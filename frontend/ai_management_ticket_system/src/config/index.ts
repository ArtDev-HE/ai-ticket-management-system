// src/config/index.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_URL
    || (typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}`
        : 'http://localhost:3000');

// Optionally, export a prefixed API root if you prefer shorter calls
export const API_PREFIX = `${API_BASE}/api`;