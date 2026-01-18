import { useState, useEffect, useCallback, useRef } from 'react';
import { gameConfig } from '../config/gameConfig';

/**
 * Custom hook for WebSocket connection to receive live lane crossing updates
 */
export function useWebSocket() {
  const [crossings, setCrossings] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Don't reconnect if we've exceeded max attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError('Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    try {
      // Determine WebSocket URL based on environment
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}${gameConfig.api.wsUrl}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected to Chicken Road Tracker');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'crossing':
              // New lane crossing result
              setCrossings((prev) => {
                const newCrossings = [data.payload, ...prev];
                return newCrossings.slice(0, gameConfig.ui.liveFeedLimit);
              });
              break;

            case 'history':
              // Initial history load
              setCrossings(data.payload.slice(0, gameConfig.ui.liveFeedLimit));
              break;

            case 'stats':
              // Stats update - handled separately by useStats hook
              break;

            case 'ping':
              // Respond to ping with pong
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'pong' }));
              }
              break;

            default:
              console.log('[WebSocket] Unknown message type:', data.type);
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('Connection error occurred');
      };

      wsRef.current.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setConnected(false);

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Failed to connect:', err);
      setError('Failed to establish connection');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }

    setConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Clear crossings
  const clearCrossings = useCallback(() => {
    setCrossings([]);
  }, []);

  return {
    crossings,
    connected,
    error,
    connect,
    disconnect,
    sendMessage,
    clearCrossings,
  };
}

export default useWebSocket;
