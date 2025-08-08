import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PassDeviceOverlay } from './PassDeviceOverlay';

describe('PassDeviceOverlay', () => {
  const defaultProps = {
    visible: true,
    playerName: 'Juan',
    playerAvatar: '👤',
    onContinue: jest.fn(),
    autoHideDelay: 3000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(<PassDeviceOverlay {...defaultProps} />);

    expect(getByText('Pasa el dispositivo a')).toBeTruthy();
    expect(getByText('Juan')).toBeTruthy();
    expect(getByText('👤')).toBeTruthy();
    expect(getByText('No mires las cartas de otros jugadores')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <PassDeviceOverlay {...defaultProps} visible={false} />,
    );

    expect(queryByText('Pasa el dispositivo a')).toBeNull();
  });

  it('displays countdown correctly', () => {
    const { getByText } = render(<PassDeviceOverlay {...defaultProps} />);

    expect(getByText('Continúa automáticamente en 3...')).toBeTruthy();
  });

  it('calls onContinue when tapped', () => {
    const { getByText } = render(<PassDeviceOverlay {...defaultProps} />);

    fireEvent.press(getByText('Continuar'));

    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue when background is tapped', () => {
    const { getByTestId } = render(<PassDeviceOverlay {...defaultProps} />);

    const container = getByTestId('pass-device-container');
    fireEvent.press(container);

    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('auto-hides after specified delay', () => {
    render(<PassDeviceOverlay {...defaultProps} autoHideDelay={1000} />);

    expect(defaultProps.onContinue).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(defaultProps.onContinue).toHaveBeenCalledTimes(1);
  });

  it('updates countdown every second', () => {
    const { getByText, rerender } = render(
      <PassDeviceOverlay {...defaultProps} autoHideDelay={3000} />,
    );

    expect(getByText('Continúa automáticamente en 3...')).toBeTruthy();

    jest.advanceTimersByTime(1000);
    rerender(<PassDeviceOverlay {...defaultProps} autoHideDelay={3000} />);
    expect(getByText('Continúa automáticamente en 2...')).toBeTruthy();

    jest.advanceTimersByTime(1000);
    rerender(<PassDeviceOverlay {...defaultProps} autoHideDelay={3000} />);
    expect(getByText('Continúa automáticamente en 1...')).toBeTruthy();
  });

  it('clears timers when unmounted', () => {
    const { unmount } = render(<PassDeviceOverlay {...defaultProps} />);

    unmount();
    jest.advanceTimersByTime(3000);

    // onContinue should not be called after unmount
    expect(defaultProps.onContinue).not.toHaveBeenCalled();
  });

  it('resets countdown when becoming visible again', () => {
    const { rerender, getByText } = render(
      <PassDeviceOverlay {...defaultProps} visible={false} />,
    );

    rerender(<PassDeviceOverlay {...defaultProps} visible={true} />);

    expect(getByText('Continúa automáticamente en 3...')).toBeTruthy();
  });
});
