import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'checking';

interface ConnectionInfo {
  status: ConnectionStatus;
  isOnline: boolean;
  lastConnectedAt?: number;
  reconnectAttempts: number;
}

export function useConnectionStatus() {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    status: 'checking',
    isOnline: true,
    reconnectAttempts: 0,
  });
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  
  useEffect(() => {
    let isSubscribed = true;
    
    // Monitor app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, check connection
        checkConnection();
      }
    };
    
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Periodic connection check (simplified for now)
    const checkConnection = async () => {
      try {
        // For now, we'll assume we're connected
        // In a real app, you'd check the actual Convex connection status
        setConnectionInfo(prev => ({
          ...prev,
          status: 'connected',
          isOnline: true,
          lastConnectedAt: Date.now(),
        }));
      } catch (error) {
        console.error('Connection check failed:', error);
        setConnectionInfo(prev => ({
          ...prev,
          status: 'disconnected',
          isOnline: false,
        }));
      }
    };
    
    // Handle reconnection with exponential backoff
    const handleReconnect = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      setConnectionInfo(prev => ({
        ...prev,
        status: 'reconnecting',
        reconnectAttempts: reconnectAttemptsRef.current,
      }));
      
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        checkConnection();
      }, backoffDelay);
    };
    
    // Initial check
    checkConnection();
    
    // Set up periodic checks
    const checkInterval = setInterval(checkConnection, 10000); // Check every 10 seconds
    
    return () => {
      isSubscribed = false;
      appStateSubscription.remove();
      clearInterval(checkInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset reconnect attempts when connected
  useEffect(() => {
    if (connectionInfo.status === 'connected') {
      reconnectAttemptsRef.current = 0;
    }
  }, [connectionInfo.status]);
  
  return {
    ...connectionInfo,
    isConnected: connectionInfo.status === 'connected',
    isReconnecting: connectionInfo.status === 'reconnecting',
  };
}