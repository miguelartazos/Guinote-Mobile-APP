import React from 'react';
import { render } from '@testing-library/react-native';
import { ConnectionIndicator } from './ConnectionIndicator';
import type { ConnectionStatus } from '../../hooks/useConnectionStatus';

describe('ConnectionIndicator', () => {
  it('renders connected state with green indicator', () => {
    const { getByTestId, getByText } = render(<ConnectionIndicator status="connected" />);

    const indicator = getByTestId('connection-indicator');
    const dot = getByTestId('status-dot');

    expect(indicator).toBeTruthy();
    expect(getByText('Conectado')).toBeTruthy();

    // Style is an array, check the second element for animated styles
    const styles = dot.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        backgroundColor: '#4CAF50',
      }),
    );
  });

  it('renders disconnected state with red indicator', () => {
    const { getByTestId, getByText } = render(<ConnectionIndicator status="disconnected" />);

    const dot = getByTestId('status-dot');

    expect(getByText('Sin conexión')).toBeTruthy();

    // Style is an array, check the second element for animated styles
    const styles = dot.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        backgroundColor: '#CF6679',
      }),
    );
  });

  it('renders reconnecting state with yellow pulsing indicator', () => {
    const { getByTestId, getByText } = render(<ConnectionIndicator status="reconnecting" />);

    const dot = getByTestId('status-dot');

    expect(getByText('Reconectando...')).toBeTruthy();

    // Style is an array, check the second element for animated styles
    const styles = dot.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        backgroundColor: '#FFB74D',
      }),
    );
  });

  it('renders checking state with gray indicator', () => {
    const { getByTestId, getByText } = render(<ConnectionIndicator status="checking" />);

    const dot = getByTestId('status-dot');

    expect(getByText('Verificando...')).toBeTruthy();

    // Style is an array, check the second element for animated styles
    const styles = dot.props.style;
    expect(styles[1]).toMatchObject(
      expect.objectContaining({
        backgroundColor: '#90A4AE',
      }),
    );
  });

  it('shows reconnect attempts when provided', () => {
    const { getByText } = render(
      <ConnectionIndicator status="reconnecting" reconnectAttempts={3} />,
    );

    expect(getByText('Reconectando... (intento 3)')).toBeTruthy();
  });

  it('hides indicator when hideWhenConnected is true and connected', () => {
    const { queryByTestId } = render(
      <ConnectionIndicator status="connected" hideWhenConnected={true} />,
    );

    expect(queryByTestId('connection-indicator')).toBeNull();
  });

  it('shows indicator when hideWhenConnected is true but not connected', () => {
    const { getByTestId } = render(
      <ConnectionIndicator status="reconnecting" hideWhenConnected={true} />,
    );

    expect(getByTestId('connection-indicator')).toBeTruthy();
  });
});
