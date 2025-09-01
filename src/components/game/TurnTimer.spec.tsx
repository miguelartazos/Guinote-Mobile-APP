import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { TurnTimer } from './TurnTimer';

// Mock timers
jest.useFakeTimers();

describe('TurnTimer', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders countdown from initial seconds', () => {
    const { getByText } = render(<TurnTimer seconds={30} onExpire={jest.fn()} />);

    expect(getByText('30')).toBeTruthy();
  });

  it('counts down each second', () => {
    const { getByText, rerender } = render(<TurnTimer seconds={30} onExpire={jest.fn()} />);

    expect(getByText('30')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    rerender(<TurnTimer seconds={29} onExpire={jest.fn()} />);
    expect(getByText('29')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    rerender(<TurnTimer seconds={28} onExpire={jest.fn()} />);
    expect(getByText('28')).toBeTruthy();
  });

  it('calls onExpire when timer reaches 0', () => {
    const onExpire = jest.fn();
    const { rerender } = render(<TurnTimer seconds={2} onExpire={onExpire} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    rerender(<TurnTimer seconds={1} onExpire={onExpire} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    rerender(<TurnTimer seconds={0} onExpire={onExpire} />);

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('shows warning style when time is low', () => {
    const { getByTestId } = render(
      <TurnTimer seconds={8} onExpire={jest.fn()} warningThreshold={10} criticalThreshold={5} />,
    );

    const timerText = getByTestId('timer-text');
    // Style is an array
    const styles = timerText.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        color: '#FF9800',
      }),
    );
  });

  it('shows critical style when time is very low', () => {
    const { getByTestId } = render(
      <TurnTimer seconds={3} onExpire={jest.fn()} criticalThreshold={5} />,
    );

    const timerText = getByTestId('timer-text');
    // Style is an array
    const styles = timerText.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        color: '#CF6679',
      }),
    );
  });

  it('does not render when paused', () => {
    const { queryByTestId } = render(<TurnTimer seconds={30} onExpire={jest.fn()} paused={true} />);

    expect(queryByTestId('turn-timer')).toBeNull();
  });

  it('displays player name when provided', () => {
    const { getByText } = render(<TurnTimer seconds={30} onExpire={jest.fn()} playerName="Juan" />);

    expect(getByText('Turno de Juan')).toBeTruthy();
  });

  it('resets timer when seconds prop changes to higher value', () => {
    const { getByText, rerender } = render(<TurnTimer seconds={5} onExpire={jest.fn()} />);

    expect(getByText('5')).toBeTruthy();

    rerender(<TurnTimer seconds={30} onExpire={jest.fn()} />);

    expect(getByText('30')).toBeTruthy();
  });
});
