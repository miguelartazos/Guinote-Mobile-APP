import React, { ReactNode } from 'react';

// Convex/Clerk removed; simple passthrough provider

interface OnlineGameProviderProps {
  children: ReactNode;
}

export function OnlineGameProvider({ children }: OnlineGameProviderProps) {
  return <>{children}</>;
}
