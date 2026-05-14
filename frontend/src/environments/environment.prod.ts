// Decisão técnica: ambiente de produção separado evita alterações manuais antes do deploy.

export const environment = {
  production: true,
  apiUrl: 'https://api.example.com'
} as const;
