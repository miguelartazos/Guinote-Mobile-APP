import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AIPlayerManager } from './AIPlayerManager';
import type { Player, AIConfig } from '../../hooks/useUnifiedRooms';

// Mock Alert separately without overriding react-native
jest.spyOn(Alert, 'alert');

describe('AIPlayerManager', () => {
  const mockOnAddAI = jest.fn();
  const mockOnRemoveAI = jest.fn();

  const createPlayer = (id: string, isBot: boolean, config?: AIConfig): Player => ({
    id,
    name: isBot ? `AI Player ${id}` : `Player ${id}`,
    position: 0,
    teamId: 'team1',
    isReady: true,
    isBot,
    botConfig: isBot ? config : undefined,
    connectionStatus: 'connected',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('shows no AI players message when empty', () => {
      const { getByText } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      expect(getByText('No hay jugadores IA')).toBeTruthy();
    });

    test('displays AI players with configuration', () => {
      const players = [
        createPlayer('ai-1', true, { difficulty: 'hard', personality: 'aggressive' }),
        createPlayer('ai-2', true, { difficulty: 'easy', personality: 'defensive' }),
      ];

      const { getByText } = render(
        <AIPlayerManager players={players} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      expect(getByText('AI Player ai-1')).toBeTruthy();
      expect(getByText(/Difícil.*Agresivo/)).toBeTruthy();
      expect(getByText('AI Player ai-2')).toBeTruthy();
      expect(getByText(/Fácil.*Defensivo/)).toBeTruthy();
    });

    test('shows add button only for host', () => {
      const { getByText } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      expect(getByText('+ Añadir IA')).toBeTruthy();

      // Re-render as non-host
      const { queryByText: queryNonHost } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={false} onAddAI={mockOnAddAI} />,
      );

      expect(queryNonHost('+ Añadir IA')).toBeNull();
    });

    test('hides add button when room is full', () => {
      const players = [
        createPlayer('1', false),
        createPlayer('2', false),
        createPlayer('3', false),
        createPlayer('4', false),
      ];

      const { queryByText } = render(
        <AIPlayerManager
          players={players}
          roomId="room-123"
          isHost={true}
          onAddAI={mockOnAddAI}
          maxPlayers={4}
        />,
      );

      expect(queryByText('+ Añadir IA')).toBeNull();
    });
  });

  describe('modal interaction', () => {
    test('opens modal when add button is pressed', () => {
      const { getByText } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      fireEvent.press(getByText('+ Añadir IA'));
      expect(getByText('Configurar Jugador IA')).toBeTruthy();
    });

    test('selects difficulty and personality', () => {
      const { getByText } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      fireEvent.press(getByText('+ Añadir IA'));

      // Select hard difficulty
      fireEvent.press(getByText('Difícil'));

      // Select aggressive personality
      fireEvent.press(getByText('Agresivo'));

      // Verify selections are highlighted (would need testID in real implementation)
      expect(getByText('Juega estratégicamente')).toBeTruthy();
      expect(getByText('Juega arriesgado y presiona constantemente')).toBeTruthy();
    });

    test('calls onAddAI with selected configuration', async () => {
      mockOnAddAI.mockResolvedValueOnce(undefined);

      const { getByText } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      fireEvent.press(getByText('+ Añadir IA'));
      fireEvent.press(getByText('Difícil'));
      fireEvent.press(getByText('Agresivo'));
      fireEvent.press(getByText('Añadir IA'));

      await waitFor(() => {
        expect(mockOnAddAI).toHaveBeenCalledWith({
          difficulty: 'hard',
          personality: 'aggressive',
        });
      });
    });

    test('shows modal when add button is pressed', () => {
      const { getByText } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      // Open modal
      fireEvent.press(getByText('+ Añadir IA'));

      // Modal should now be visible
      expect(getByText('Configurar Jugador IA')).toBeTruthy();
      expect(getByText('Dificultad')).toBeTruthy();
      expect(getByText('Personalidad')).toBeTruthy();
    });

    test('shows error alert on add failure', async () => {
      mockOnAddAI.mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(
        <AIPlayerManager players={[]} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      fireEvent.press(getByText('+ Añadir IA'));
      fireEvent.press(getByText('Añadir IA'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'No se pudo añadir el jugador IA');
      });
    });
  });

  describe('maximum AI players', () => {
    test('disables add button when max players reached', () => {
      const players = [
        createPlayer('human-1', false),
        createPlayer('human-2', false),
        createPlayer('ai-1', true, { difficulty: 'medium', personality: 'balanced' }),
        createPlayer('ai-2', true, { difficulty: 'easy', personality: 'defensive' }),
      ];

      const { queryByText } = render(
        <AIPlayerManager
          players={players}
          roomId="room-123"
          isHost={true}
          onAddAI={mockOnAddAI}
          maxPlayers={4}
        />,
      );

      // Should not show add button when at max capacity
      expect(queryByText('+ Añadir IA')).toBeNull();
    });

    test('shows remaining slots when not at max', () => {
      const players = [
        createPlayer('human-1', false),
        createPlayer('ai-1', true, { difficulty: 'medium', personality: 'balanced' }),
      ];

      const { getByText } = render(
        <AIPlayerManager players={players} roomId="room-123" isHost={false} maxPlayers={4} />,
      );

      // Should show message about available slots
      expect(getByText(/El anfitrión puede añadir 2 jugadores? IA/)).toBeTruthy();
    });

    test('prevents adding AI beyond max players', () => {
      const players = [
        createPlayer('human-1', false),
        createPlayer('human-2', false),
        createPlayer('human-3', false),
        createPlayer('ai-1', true, { difficulty: 'medium', personality: 'balanced' }),
      ];

      const { queryByText } = render(
        <AIPlayerManager
          players={players}
          roomId="room-123"
          isHost={true}
          onAddAI={mockOnAddAI}
          maxPlayers={4}
        />,
      );

      // Button should not be visible when at max
      expect(queryByText('+ Añadir IA')).toBeNull();
    });
  });

  describe('AI removal', () => {
    test('shows remove button for host', () => {
      const players = [
        createPlayer('ai-1', true, { difficulty: 'medium', personality: 'balanced' }),
      ];

      const { getAllByText } = render(
        <AIPlayerManager
          players={players}
          roomId="room-123"
          isHost={true}
          onAddAI={mockOnAddAI}
          onRemoveAI={mockOnRemoveAI}
        />,
      );

      expect(getAllByText('✕').length).toBeGreaterThan(0);
    });

    test('hides remove button for non-host', () => {
      const players = [
        createPlayer('ai-1', true, { difficulty: 'medium', personality: 'balanced' }),
      ];

      const { queryByText } = render(
        <AIPlayerManager
          players={players}
          roomId="room-123"
          isHost={false}
          onAddAI={mockOnAddAI}
          onRemoveAI={mockOnRemoveAI}
        />,
      );

      expect(queryByText('✕')).toBeNull();
    });

    test('confirms before removing AI player', async () => {
      const players = [
        createPlayer('ai-1', true, { difficulty: 'medium', personality: 'balanced' }),
      ];

      const { getByText } = render(
        <AIPlayerManager
          players={players}
          roomId="room-123"
          isHost={true}
          onAddAI={mockOnAddAI}
          onRemoveAI={mockOnRemoveAI}
        />,
      );

      fireEvent.press(getByText('✕'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Eliminar IA',
        '¿Estás seguro de que quieres eliminar este jugador IA?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancelar' }),
          expect.objectContaining({ text: 'Eliminar' }),
        ]),
      );
    });
  });

  describe('personality mapping', () => {
    test('maps personalities correctly', () => {
      const players = [
        createPlayer('ai-1', true, { difficulty: 'medium', personality: 'aggressive' }),
        createPlayer('ai-2', true, { difficulty: 'medium', personality: 'defensive' }),
        createPlayer('ai-3', true, { difficulty: 'medium', personality: 'balanced' }),
      ];

      const { getByText } = render(
        <AIPlayerManager players={players} roomId="room-123" isHost={true} onAddAI={mockOnAddAI} />,
      );

      // Check that mapped personalities are displayed (using getAllByText for multiple matches)
      expect(getByText(/Medio.*Agresivo/)).toBeTruthy();
      expect(getByText(/Medio.*Defensivo/)).toBeTruthy();
      expect(getByText(/Medio.*Equilibrado/)).toBeTruthy();
    });
  });
});
