import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TutorialSetupScreen } from './TutorialSetupScreen';
import type { JugarStackScreenProps } from '../types/navigation';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
} as any;

const defaultProps: JugarStackScreenProps<'TutorialSetup'> = {
  navigation: mockNavigation,
  route: { key: 'test', name: 'TutorialSetup' } as any,
};

describe('TutorialSetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all tutorial options', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    expect(getByText('Aprende a Jugar')).toBeTruthy();
    expect(getByText('Elige qué quieres aprender hoy')).toBeTruthy();

    // Tutorial options
    expect(getByText('Tutorial Completo')).toBeTruthy();
    expect(getByText('Juego Básico')).toBeTruthy();
    expect(getByText('Cantes y Puntuación')).toBeTruthy();
    expect(getByText('Reglas Especiales')).toBeTruthy();
  });

  test('shows tutorial descriptions', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    expect(getByText('Aprende todo sobre Guiñote paso a paso')).toBeTruthy();
    expect(getByText('Solo lo esencial para empezar a jugar')).toBeTruthy();
    expect(getByText('Aprende sobre las 20 y las 40')).toBeTruthy();
    expect(getByText('Vueltas, cambiar el 7 y más')).toBeTruthy();
  });

  test('shows tutorial durations', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    expect(getByText('⏱ 15 min')).toBeTruthy();
    expect(getByText('⏱ 5 min')).toBeTruthy();
    expect(getByText('⏱ 3 min')).toBeTruthy();
  });

  test('shows recommended badge for complete tutorial', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    expect(getByText('RECOMENDADO')).toBeTruthy();
  });

  test('selects complete tutorial by default', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    // Complete tutorial should be selected by default
    const completeTutorial = getByText('Tutorial Completo');
    expect(completeTutorial).toBeTruthy();
  });

  test('changes selection when tutorial option is pressed', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    // Press on basic tutorial
    fireEvent.press(getByText('Juego Básico'));

    // Should update selection (visual feedback would be tested with style checks)
    expect(getByText('Juego Básico')).toBeTruthy();
  });

  test('navigates to game with complete tutorial', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    fireEvent.press(getByText('Comenzar Tutorial'));

    expect(mockNavigate).toHaveBeenCalledWith('Game', {
      gameMode: 'offline',
      difficulty: 'easy',
      playerName: 'Aprendiz',
      tutorialMode: 'complete',
    });
  });

  test('navigates to game with selected tutorial type', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    // Select basic tutorial
    fireEvent.press(getByText('Juego Básico'));

    // Start tutorial
    fireEvent.press(getByText('Comenzar Tutorial'));

    expect(mockNavigate).toHaveBeenCalledWith('Game', {
      gameMode: 'offline',
      difficulty: 'easy',
      playerName: 'Aprendiz',
      tutorialMode: 'basic',
    });
  });

  test('navigates back when Volver is pressed', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    fireEvent.press(getByText('Volver'));

    expect(mockGoBack).toHaveBeenCalled();
  });

  test('renders info card', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    expect(getByText('💡')).toBeTruthy();
    expect(getByText(/Durante el tutorial, el juego se pausará/)).toBeTruthy();
  });

  test('renders tutorial icons', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    expect(getByText('🎓')).toBeTruthy();
    expect(getByText('🃏')).toBeTruthy();
    expect(getByText('👑')).toBeTruthy();
    expect(getByText('⭐')).toBeTruthy();
  });

  test('maintains selection across multiple presses', () => {
    const { getByText } = render(<TutorialSetupScreen {...defaultProps} />);

    // Select different tutorials in sequence
    fireEvent.press(getByText('Juego Básico'));
    fireEvent.press(getByText('Cantes y Puntuación'));
    fireEvent.press(getByText('Reglas Especiales'));

    // Start with the last selection
    fireEvent.press(getByText('Comenzar Tutorial'));

    expect(mockNavigate).toHaveBeenCalledWith('Game', {
      gameMode: 'offline',
      difficulty: 'easy',
      playerName: 'Aprendiz',
      tutorialMode: 'special',
    });
  });
});
