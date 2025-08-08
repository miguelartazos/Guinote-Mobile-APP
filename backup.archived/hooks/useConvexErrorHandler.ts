import { useEffect, useRef } from 'react';
import { handleConvexError } from '../utils/errorHandling';

export function useConvexErrorHandler() {
  const errorCountRef = useRef<Map<string, number>>(new Map());
  const resetTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleError = (error: any, context?: string) => {
    const errorKey = context || 'general';
    const currentCount = errorCountRef.current.get(errorKey) || 0;
    errorCountRef.current.set(errorKey, currentCount + 1);

    // Reset error count after 5 minutes
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      errorCountRef.current.clear();
    }, 5 * 60 * 1000);

    // Only show error to user if it's the first occurrence or after many retries
    if (currentCount === 0 || currentCount > 3) {
      handleConvexError(error);
    } else {
      // Just log for subsequent errors
      console.warn(`Convex error (${errorKey}):`, error);
    }
  };

  return { handleError };
}