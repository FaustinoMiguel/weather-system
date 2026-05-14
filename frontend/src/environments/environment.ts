// Decisão técnica: URL do backend fica centralizada e pode variar por ambiente.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
} as const;
