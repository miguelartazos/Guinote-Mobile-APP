import { useState } from 'react';

export function useUnifiedRooms() {
  const [publicRooms] = useState<any[]>([]);
  return {
    publicRooms,
    isLoading: false,
    error: null,
    createRoom: async () => {
      throw new Error('Online rooms disabled');
    },
    joinRoom: async () => {
      throw new Error('Online rooms disabled');
    },
    refreshRooms: async () => {
      return;
    },
  };
}
