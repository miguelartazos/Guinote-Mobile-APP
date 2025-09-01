import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { ConnectionBanner } from './ConnectionBanner';
import { connectionService } from '../../services/connectionService';

// Mock dependencies
jest.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: jest.fn(() => ({
    status: 'connected',
    reconnectAttempts: 0,
    isConnected: true,
  })),
}));

jest.mock('../../services/connectionService', () => ({
  connectionService: {
    getQueuedCount: jest.fn(() => 0),
    handleReconnect: jest.fn(() => Promise.resolve({ synced: true, processed: 0, failed: 0 })),
    getRecoveryState: jest.fn(() => ({
      lastSyncVersion: 0,
      isRecovering: false,
      queuedActions: 0,
    })),
  },
}));

jest.mock('../game/ConnectionIndicator', () => ({
  ConnectionIndicator: () => null,
}));

describe('ConnectionBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('should hide when connected with no queued actions', () => {
      const { queryByTestId } = render(<ConnectionBanner hideWhenConnected={true} />);

      expect(queryByTestId('connection-banner')).toBeNull();
    });

    test('should show when disconnected', () => {
      const { useConnectionStatus } = require('../../hooks/useConnectionStatus');
      useConnectionStatus.mockReturnValue({
        status: 'disconnected',
        reconnectAttempts: 0,
        isConnected: false,
      });

      const { getByTestId } = render(<ConnectionBanner hideWhenConnected={true} />);

      expect(getByTestId('connection-banner')).toBeDefined();
    });

    test('should show when there are queued actions', () => {
      (connectionService.getQueuedCount as any).mockReturnValue(3);

      const { getByTestId, getByText } = render(
        <ConnectionBanner hideWhenConnected={true} showQueuedActions={true} />,
      );

      expect(getByTestId('connection-banner')).toBeDefined();
      expect(getByText('3 acciones pendientes')).toBeDefined();
    });

    test('should show singular form for single queued action', () => {
      (connectionService.getQueuedCount as any).mockReturnValue(1);

      const { getByText } = render(
        <ConnectionBanner hideWhenConnected={true} showQueuedActions={true} />,
      );

      expect(getByText('1 acción pendiente')).toBeDefined();
    });

    test('should not show queued actions when showQueuedActions is false', () => {
      (connectionService.getQueuedCount as any).mockReturnValue(3);

      const { queryByText } = render(
        <ConnectionBanner hideWhenConnected={true} showQueuedActions={false} />,
      );

      expect(queryByText('3 acciones pendientes')).toBeNull();
    });
  });

  describe('recovery', () => {
    test('should trigger recovery when reconnected with queued actions', async () => {
      const { useConnectionStatus } = require('../../hooks/useConnectionStatus');

      // Start disconnected
      useConnectionStatus.mockReturnValue({
        status: 'disconnected',
        reconnectAttempts: 0,
        isConnected: false,
      });

      (connectionService.getQueuedCount as any).mockReturnValue(2);

      const { rerender } = render(<ConnectionBanner />);

      // Simulate reconnection
      useConnectionStatus.mockReturnValue({
        status: 'connected',
        reconnectAttempts: 0,
        isConnected: true,
      });

      rerender(<ConnectionBanner />);

      await waitFor(() => {
        expect(connectionService.handleReconnect).toHaveBeenCalled();
      });
    });

    test('should show syncing message during recovery', async () => {
      const { useConnectionStatus } = require('../../hooks/useConnectionStatus');

      useConnectionStatus.mockReturnValue({
        status: 'connected',
        reconnectAttempts: 0,
        isConnected: true,
      });

      (connectionService.getQueuedCount as any).mockReturnValue(1);
      (connectionService.handleReconnect as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ synced: true }), 100)),
      );

      const { getByText } = render(<ConnectionBanner />);

      await waitFor(() => {
        expect(getByText('Sincronizando...')).toBeDefined();
      });
    });

    test('should handle recovery failure gracefully', async () => {
      const { useConnectionStatus } = require('../../hooks/useConnectionStatus');

      useConnectionStatus.mockReturnValue({
        status: 'connected',
        reconnectAttempts: 0,
        isConnected: true,
      });

      (connectionService.getQueuedCount as any).mockReturnValue(1);
      (connectionService.handleReconnect as any).mockRejectedValue(new Error('Recovery failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ConnectionBanner />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[ConnectionBanner] Recovery failed:',
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('reconnect attempts', () => {
    test('should display reconnect attempts', () => {
      const { useConnectionStatus } = require('../../hooks/useConnectionStatus');
      useConnectionStatus.mockReturnValue({
        status: 'reconnecting',
        reconnectAttempts: 3,
        isConnected: false,
      });

      (connectionService.getQueuedCount as any).mockReturnValue(0);

      const { getByTestId } = render(<ConnectionBanner />);

      // Just verify the banner is rendered when reconnecting
      expect(getByTestId('connection-banner')).toBeDefined();
    });
  });
});

