import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export function useConvexGame(roomId?: Id<'rooms'>) {
  // Queries
  const room = useQuery(api.rooms.getRoom, roomId ? { roomId } : 'skip');

  const gameState = useQuery(
    api.gameQueries.getGameState,
    roomId ? { roomId } : 'skip',
  );

  // Mutations
  const playCard = useMutation(api.gameActions.playCard);
  const cantar = useMutation(api.gameActions.cantar);
  const cambiar7 = useMutation(api.gameActions.cambiar7);
  const toggleReady = useMutation(api.rooms.toggleReady);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const addAIPlayer = useMutation(api.rooms.addAIPlayer);

  return {
    // State
    room,
    gameState,
    isLoading:
      room === undefined ||
      (room && room.status === 'playing' && gameState === undefined),

    // Actions
    actions: {
      playCard: async (cardId: string, userId: Id<'users'>) => {
        if (!roomId) throw new Error('No room ID');
        await playCard({ roomId, userId, cardId });
      },

      cantar: async (
        suit: 'oros' | 'copas' | 'espadas' | 'bastos',
        userId: Id<'users'>,
      ) => {
        if (!roomId) throw new Error('No room ID');
        await cantar({ roomId, userId, suit });
      },

      cambiar7: async (userId: Id<'users'>) => {
        if (!roomId) throw new Error('No room ID');
        await cambiar7({ roomId, userId });
      },

      toggleReady: async (userId: Id<'users'>) => {
        if (!roomId) throw new Error('No room ID');
        await toggleReady({ roomId, userId });
      },

      leaveRoom: async (userId: Id<'users'>) => {
        if (!roomId) throw new Error('No room ID');
        await leaveRoom({ roomId, userId });
      },

      addAI: async (difficulty: 'easy' | 'medium' | 'hard') => {
        if (!roomId) throw new Error('No room ID');
        await addAIPlayer({ roomId, difficulty });
      },
    },
  };
}
