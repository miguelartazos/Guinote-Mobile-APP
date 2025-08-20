import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

jest.spyOn(Alert, 'alert');

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <></>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  test('catches errors and displays fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('¡Ups! Algo salió mal')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
  });

  test('resets error state when retry button is pressed', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const retryButton = getByText('Reintentar');
    fireEvent.press(retryButton);

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  test('shows report bug dialog when report button is pressed', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const reportButton = getByText('Reportar Error');
    fireEvent.press(reportButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Reportar Error',
      '¿Deseas enviar un informe de este error?',
      expect.any(Array),
    );
  });

  test('uses custom fallback when provided', () => {
    const customFallback = (error: Error, _reset: () => void) => <>Custom error: {error.message}</>;

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('Custom error: Test error')).toBeTruthy();
  });
});
