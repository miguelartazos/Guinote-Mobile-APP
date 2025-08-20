import { useState } from 'react';

export function useUnifiedGame(_roomId?: string) {
  const [state] = useState<any>(null);
  return {
    room: null,
    gameState: state,
    players: [],
    isLoading: false,
    error: null,
    actions: {
      start: async () => {
        throw new Error('Online game actions disabled');
      },
    },
  };
}
