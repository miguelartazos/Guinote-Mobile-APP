import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoomHeader } from './RoomHeader';

describe('RoomHeader', () => {
  const mockOnShare = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays room code', () => {
    const { getByText } = render(<RoomHeader code="ABC123" onShare={mockOnShare} />);

    expect(getByText('ABC123')).toBeTruthy();
  });

  test('displays room code label', () => {
    const { getByText } = render(<RoomHeader code="XYZ789" onShare={mockOnShare} />);

    expect(getByText(/Código de Sala/i)).toBeTruthy();
  });

  test('calls onShare when share button is pressed', () => {
    const { getByText } = render(<RoomHeader code="ABC123" onShare={mockOnShare} />);

    const shareButton = getByText(/Compartir/i);
    fireEvent.press(shareButton);

    expect(mockOnShare).toHaveBeenCalledTimes(1);
  });

  test('shows share icon', () => {
    const { getByText } = render(<RoomHeader code="ABC123" onShare={mockOnShare} />);

    expect(getByText(/📱/)).toBeTruthy();
  });
});
