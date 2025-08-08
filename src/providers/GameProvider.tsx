import React, { createContext, useContext, ReactNode } from 'react';

type GameMode = 'online' | 'offline';

interface GameProviderProps {
  children: ReactNode;
  mode: GameMode;
}

interface GameContextValue {
  mode: GameMode;
  isOnline: boolean;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function useGameMode() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameMode must be used within GameProvider');
  }
  return context;
}

export function GameProvider({ children, mode }: GameProviderProps) {
  const value: GameContextValue = {
    mode,
    isOnline: mode === 'online',
  };

  // For offline mode, provide the context directly without Convex/Clerk
  if (mode === 'offline') {
    return (
      <GameContext.Provider value={value}>
        {children}
      </GameContext.Provider>
    );
  }

  // For online mode, lazy load Convex and Clerk providers
  // This prevents them from being loaded in offline mode
  const [OnlineProvider, setOnlineProvider] = React.useState<React.ComponentType<{ children: ReactNode }> | null>(null);

  React.useEffect(() => {
    if (mode === 'online') {
      // Dynamically import the online provider
      import('./OnlineGameProvider').then((module) => {
        setOnlineProvider(() => module.OnlineGameProvider);
      });
    }
  }, [mode]);

  if (mode === 'online' && !OnlineProvider) {
    // Loading state while importing online provider
    return null;
  }

  if (OnlineProvider) {
    return (
      <GameContext.Provider value={value}>
        <OnlineProvider>{children}</OnlineProvider>
      </GameContext.Provider>
    );
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}