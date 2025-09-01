import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StartGameButton } from './StartGameButton';

describe('StartGameButton', () => {
  const mockOnStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays start game text', () => {
    const { getByText } = render(<StartGameButton enabled={true} onStart={mockOnStart} />);

    expect(getByText(/Iniciar Partida/i)).toBeTruthy();
  });

  test('shows game icon', () => {
    const { getByText } = render(<StartGameButton enabled={true} onStart={mockOnStart} />);

    expect(getByText(/🎯/)).toBeTruthy();
  });

  test('calls onStart when pressed and enabled', () => {
    const { getByText } = render(<StartGameButton enabled={true} onStart={mockOnStart} />);

    const button = getByText(/Iniciar Partida/i);
    fireEvent.press(button);

    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  test('does not call onStart when disabled', () => {
    const { getByText } = render(<StartGameButton enabled={false} onStart={mockOnStart} />);

    const button = getByText(/Iniciar Partida/i);
    fireEvent.press(button);

    expect(mockOnStart).not.toHaveBeenCalled();
  });

  test('has disabled style when not enabled', () => {
    const { getByTestId } = render(<StartGameButton enabled={false} onStart={mockOnStart} />);

    const button = getByTestId('start-game-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  test('has enabled style when enabled', () => {
    const { getByTestId } = render(<StartGameButton enabled={true} onStart={mockOnStart} />);

    const button = getByTestId('start-game-button');
    expect(button.props.accessibilityState?.disabled).toBe(false);
  });

  test('shows waiting message when disabled', () => {
    const { getByText } = render(<StartGameButton enabled={false} onStart={mockOnStart} />);

    expect(getByText(/Esperando a todos los jugadores/i)).toBeTruthy();
  });

  test('does not show waiting message when enabled', () => {
    const { queryByText } = render(<StartGameButton enabled={true} onStart={mockOnStart} />);

    expect(queryByText(/Esperando a todos los jugadores/i)).toBeNull();
  });
});
