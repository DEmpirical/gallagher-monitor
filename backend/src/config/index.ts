import dotenv from 'dotenv';

dotenv.config();

export const config = {
  gallagher: {
    host: process.env.GALLAGHER_HOST || '',
    apiKey: process.env.GALLAGHER_API_KEY || '',
    clientCert: process.env.GALLAGHER_CLIENT_CERT,
    clientKey: process.env.GALLAGHER_CLIENT_KEY,
    caCert: process.env.GALLAGHER_CA_CERT,
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()),
  },
  internalToken: process.env.INTERNAL_TOKEN,
  polling: {
    intervalMs: parseInt(process.env.POLL_INTERVAL_MS || '30000', 10),
    timeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
  },
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
};

export function validateConfig() {
  const errors: string[] = [];
  if (!config.gallagher.host) errors.push('GALLAGHER_HOST is required');
  if (!config.gallagher.apiKey) errors.push('GALLAGHER_API_KEY is required');
  if (!config.internalToken) errors.push('INTERNAL_TOKEN is required');
  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n${errors.join('\n')}`);
  }
}
