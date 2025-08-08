// Default values for development
const defaults = {
  clerkPublishableKey: '',
  convexUrl: '',
};

export const env = {
  clerk: {
    publishableKey:
      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      defaults.clerkPublishableKey,
  },
  convex: {
    url: process.env.EXPO_PUBLIC_CONVEX_URL || defaults.convexUrl,
  },
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  isDevelopment: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production',
  isProduction: process.env.EXPO_PUBLIC_ENVIRONMENT === 'production',
};

// Validate required environment variables
const requiredVars = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_CONVEX_URL',
];

const missingVars: string[] = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0 && env.isProduction) {
  console.error(
    'Missing required environment variables:',
    missingVars.join(', '),
  );
  console.error('Please create a .env file with the required variables.');
} else if (missingVars.length > 0) {
  console.warn('Missing environment variables:', missingVars.join(', '));
  console.warn('Using placeholder values for development.');
}
