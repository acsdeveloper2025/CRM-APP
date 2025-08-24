/**
 * React Hook for WebSocket functionality in CaseFlow Mobile
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { webSocketService, WebSocketEventHandlers, WebSocketState } from '../services/websocketService';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CaseContext';
import { caseService } from '../services/caseService';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  enableNotifications?: boolean;
  onCaseAssigned?: (notification: any) => void;
  onCaseStatusChanged?: (notification: any) => void;
  onCasePriorityChanged?: (notification: any) => void;
  onError?: (error: string) => void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToCase: (caseId: string) => void;
  unsubscribeFromCase: (caseId: string) => void;
  notifyAppStateChange: (state: 'foreground' | 'background' | 'inactive') => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = false, // Disabled for offline-first
    enableNotifications = true,
    onCaseAssigned,
    onCaseStatusChanged,
    onCasePriorityChanged,
    onError,
  } = options;

  const { isAuthenticated } = useAuth();
  const { fetchCases } = useCases();
  const [state, setState] = useState<WebSocketState>(webSocketService.getState());
  const stateUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Create stable references for callbacks to prevent infinite re-renders
  const callbacksRef = useRef({
    onCaseAssigned,
    onCaseStatusChanged, 
    onCasePriorityChanged,
    onError,
    fetchCases,
  });
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onCaseAssigned,
      onCaseStatusChanged,
      onCasePriorityChanged, 
      onError,
      fetchCases,
    };
  }, [onCaseAssigned, onCaseStatusChanged, onCasePriorityChanged, onError, fetchCases]);

  /**
   * Show local notification for case assignment
   */
  const showCaseAssignmentNotification = useCallback(async (notification: any) => {
    if (!enableNotifications || !Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'New Case Assigned',
            body: `Case ${notification.case.caseId}: ${notification.case.customerName}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              caseId: notification.case.caseId,
              type: 'case_assigned',
            },
          },
        ],
      });
    } catch (error) {

    }
  }, [enableNotifications]);

  /**
   * Show local notification for case status change
   */
  const showCaseStatusChangeNotification = useCallback(async (notification: any) => {
    if (!enableNotifications || !Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Case Status Updated',
            body: `Case ${notification.caseId} status changed to ${notification.newStatus}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              caseId: notification.caseId,
              type: 'case_status_changed',
            },
          },
        ],
      });
    } catch (error) {

    }
  }, [enableNotifications]);

  /**
   * Show local notification for case priority change
   */
  const showCasePriorityChangeNotification = useCallback(async (notification: any) => {
    if (!enableNotifications || !Capacitor.isNativePlatform()) return;

    // Only show notification for high priority cases
    if (notification.newPriority < 3) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'High Priority Case',
            body: `Case ${notification.caseId} priority changed to ${notification.newPriority === 3 ? 'HIGH' : 'URGENT'}`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              caseId: notification.caseId,
              type: 'case_priority_changed',
            },
          },
        ],
      });
    } catch (error) {

    }
  }, [enableNotifications]);

  /**
   * Set up WebSocket event handlers
   */
  const setupEventHandlers = useCallback(() => {
    const handlers: WebSocketEventHandlers = {
      onConnected: (data) => {
        // WebSocket connected
        setState(webSocketService.getState());
      },

      onDisconnected: (reason) => {
        // WebSocket disconnected
        setState(webSocketService.getState());
      },

      onError: (error) => {
        setState(webSocketService.getState());
        callbacksRef.current.onError?.(error);
      },

      onCaseAssigned: async (notification) => {
        console.log('📋 Case assigned notification received:', notification);

        // Show local notification
        await showCaseAssignmentNotification(notification);

        // Trigger intelligent sync for real-time updates
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Real-time sync result:', syncResult);

        // Refresh case list in UI
        await callbacksRef.current.fetchCases();

        // Call custom handler
        callbacksRef.current.onCaseAssigned?.(notification);
      },

      onCaseStatusChanged: async (notification) => {
        console.log('📊 Case status changed notification received:', notification);

        // Show local notification
        await showCaseStatusChangeNotification(notification);

        // Trigger intelligent sync for real-time updates
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Real-time sync result:', syncResult);

        // Refresh case list in UI
        await callbacksRef.current.fetchCases();

        // Call custom handler
        callbacksRef.current.onCaseStatusChanged?.(notification);
      },

      onCasePriorityChanged: async (notification) => {
        console.log('⚡ Case priority changed notification received:', notification);

        // Show local notification for high priority cases
        await showCasePriorityChangeNotification(notification);

        // Trigger intelligent sync for real-time updates
        const syncResult = await caseService.forceSyncCases();
        console.log('🔄 Real-time sync result:', syncResult);

        // Refresh case list in UI
        await callbacksRef.current.fetchCases();

        // Call custom handler
        callbacksRef.current.onCasePriorityChanged?.(notification);
      },

      onSyncCompleted: async (data) => {
        // Sync completed notification
        // Trigger intelligent sync
        const syncResult = await caseService.forceSyncCases();
        // Refresh case list in UI
        await callbacksRef.current.fetchCases();
      },

      onSyncTrigger: async (data) => {
        // Sync trigger received
        // Trigger intelligent sync
        const syncResult = await caseService.forceSyncCases();
        // Refresh case list in UI
        await callbacksRef.current.fetchCases();
      },
    };

    webSocketService.setEventHandlers(handlers);
  }, [
    showCaseAssignmentNotification,
    showCaseStatusChangeNotification,
    showCasePriorityChangeNotification,
  ]);

  /**
   * Connect to WebSocket (offline-first approach)
   */
  const connect = useCallback(async () => {
    if (!isAuthenticated || !navigator.onLine) {
      return;
    }

    try {
      await webSocketService.connect();
      setState(webSocketService.getState());
    } catch (error) {
      // Silently fail for offline-first approach
      setState(webSocketService.getState());
    }
  }, [isAuthenticated]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setState(webSocketService.getState());
  }, []);

  /**
   * Subscribe to case updates
   */
  const subscribeToCase = useCallback((caseId: string) => {
    webSocketService.subscribeToCase(caseId);
  }, []);

  /**
   * Unsubscribe from case updates
   */
  const unsubscribeFromCase = useCallback((caseId: string) => {
    webSocketService.unsubscribeFromCase(caseId);
  }, []);

  /**
   * Notify app state change
   */
  const notifyAppStateChange = useCallback((appState: 'foreground' | 'background' | 'inactive') => {
    webSocketService.notifyAppStateChange(appState);
  }, []);

  /**
   * Set up periodic state updates
   */
  useEffect(() => {
    stateUpdateInterval.current = setInterval(() => {
      setState(webSocketService.getState());
    }, 1000);

    return () => {
      if (stateUpdateInterval.current) {
        clearInterval(stateUpdateInterval.current);
      }
    };
  }, []);

  /**
   * Initialize WebSocket connection and event handlers
   */
  useEffect(() => {
    setupEventHandlers();

    if (autoConnect && isAuthenticated && !webSocketService.isConnected() && !webSocketService.getState().isConnecting) {
      // Delayed connection to prevent flooding
      setTimeout(() => connect(), 3000);
    }

    return () => {
      if (!autoConnect) {
        disconnect();
      }
    };
  }, [setupEventHandlers, autoConnect, isAuthenticated, connect, disconnect]);

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    if (!isAuthenticated && webSocketService.isConnected()) {
      disconnect();
    } else if (isAuthenticated && autoConnect && !webSocketService.isConnected() && !webSocketService.getState().isConnecting) {
      // Only connect if not already connecting
      setTimeout(() => connect(), 2000); // Delayed connection to prevent flooding
    }
  }, [isAuthenticated, autoConnect, connect, disconnect]);

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastConnected: state.lastConnected,
    reconnectAttempts: state.reconnectAttempts,
    connect,
    disconnect,
    subscribeToCase,
    unsubscribeFromCase,
    notifyAppStateChange,
  };
};
