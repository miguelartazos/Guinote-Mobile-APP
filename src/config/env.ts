import { ENVIRONMENT } from './envConfig';

export const env = {
  environment: ENVIRONMENT || 'development',
  isDevelopment: ENVIRONMENT !== 'production',
  isProduction: ENVIRONMENT === 'production',
};

// Validate required environment variables
const requiredVars: Array<{ name: string; value: string | undefined }> = [];

const missingVars: string[] = [];
for (const { name, value } of requiredVars) {
  if (!value) {
    missingVars.push(name);
  }
}

if (missingVars.length > 0 && env.isProduction) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please create a .env file with the required variables.');
} else if (missingVars.length > 0) {
  console.warn('Missing environment variables:', missingVars.join(', '));
  console.warn('Using placeholder values for development.');
}
