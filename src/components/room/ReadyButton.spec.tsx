import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ReadyButton } from './ReadyButton';

describe('ReadyButton', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows "Listo" when not ready', () => {
    const { getByText } = render(<ReadyButton isReady={false} onToggle={mockOnToggle} />);

    expect(getByText(/Listo/i)).toBeTruthy();
  });

  test('shows "Cancelar Listo" when ready', () => {
    const { getByText } = render(<ReadyButton isReady={true} onToggle={mockOnToggle} />);

    expect(getByText(/Cancelar Listo/i)).toBeTruthy();
  });

  test('calls onToggle when pressed', () => {
    const { getByText } = render(<ReadyButton isReady={false} onToggle={mockOnToggle} />);

    const button = getByText(/Listo/i);
    fireEvent.press(button);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  test('shows checkmark icon when ready', () => {
    const { getByText } = render(<ReadyButton isReady={true} onToggle={mockOnToggle} />);

    expect(getByText(/✅/)).toBeTruthy();
  });

  test('shows ready icon when not ready', () => {
    const { getByText } = render(<ReadyButton isReady={false} onToggle={mockOnToggle} />);

    expect(getByText(/👍/)).toBeTruthy();
  });

  test('has different styles when ready vs not ready', () => {
    const { getByTestId, rerender } = render(
      <ReadyButton isReady={false} onToggle={mockOnToggle} />,
    );

    const buttonNotReady = getByTestId('ready-button');
    const styleNotReady = buttonNotReady.props.style;

    rerender(<ReadyButton isReady={true} onToggle={mockOnToggle} />);

    const buttonReady = getByTestId('ready-button');
    const styleReady = buttonReady.props.style;

    expect(styleNotReady).not.toEqual(styleReady);
  });
});
