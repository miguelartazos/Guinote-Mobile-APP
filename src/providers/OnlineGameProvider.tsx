import React, { ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ClerkProvider } from '@clerk/clerk-expo';

// Import environment config
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || '';
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

// Create Convex client only when needed
const convexClient = new ConvexReactClient(CONVEX_URL);

interface OnlineGameProviderProps {
  children: ReactNode;
}

export function OnlineGameProvider({ children }: OnlineGameProviderProps) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ConvexProvider client={convexClient}>
        {children}
      </ConvexProvider>
    </ClerkProvider>
  );
}