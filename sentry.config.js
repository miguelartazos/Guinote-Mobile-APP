import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://6553f8fe1241257187b6dc044bfa7e7d@o4509823120769024.ingest.us.sentry.io/4509823153668096',
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  
  // Set sample rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
  
  debug: __DEV__,
  
  environment: __DEV__ ? 'development' : 'production',
  
  beforeSend(event, hint) {
    // Filter out sensitive information
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
  
  integrations: [
    new Sentry.ReactNativeTracing({
      tracingOrigins: ['localhost', /^\//, /^https:\/\/yourserver\.io\/api/],
      // Removed routingInstrumentation temporarily to fix prototype error
    }),
  ],
  
  attachScreenshot: true,
  attachViewHierarchy: true,
});