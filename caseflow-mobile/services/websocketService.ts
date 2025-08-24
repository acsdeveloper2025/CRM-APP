/**
 * WebSocket Service for CaseFlow Mobile
 * Handles real-time communication with the backend server
 */

import { io, Socket } from 'socket.io-client';
import { authService } from './authService';
import { caseService } from './caseService';
import { getEnvironmentConfig } from '../config/environment';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';

export interface WebSocketConfig {
  url: string;
  autoConnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  timeout: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
}

export interface CaseAssignmentNotification {
  type: 'CASE_ASSIGNED';
  case: any;
  timestamp: string;
  priority: string;
  requiresImmediate: boolean;
}

export interface CaseStatusChangeNotification {
  type: 'CASE_STATUS_CHANGED';
  caseId: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: string;
  timestamp: string;
}

export interface CasePriorityChangeNotification {
  type: 'CASE_PRIORITY_CHANGED';
  caseId: string;
  oldPriority: number;
  newPriority: number;
  updatedBy: string;
  timestamp: string;
  requiresImmediate: boolean;
}

export interface WebSocketEventHandlers {
  onConnected?: (data: any) => void;
  onDisconnected?: (reason: string) => void;
  onError?: (error: string) => void;
  onCaseAssigned?: (notification: CaseAssignmentNotification) => void;
  onCaseStatusChanged?: (notification: CaseStatusChangeNotification) => void;
  onCasePriorityChanged?: (notification: CasePriorityChangeNotification) => void;
  onSyncCompleted?: (data: any) => void;
  onSyncTrigger?: (data: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private state: WebSocketState;
  private eventHandlers: WebSocketEventHandlers = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private deviceInfo: any = null;
  private isConnecting: boolean = false;
  private lastConnectionAttempt: number = 0;
  private CONNECTION_THROTTLE_MS = 10000; // 10 seconds between attempts for offline-first
  private offlineMode: boolean = false;
  private connectionRetryCount: number = 0;
  private MAX_RETRY_ATTEMPTS = 3; // Reduced for offline-first approach

  constructor() {
    const envConfig = getEnvironmentConfig();
    
    this.config = {
      url: envConfig.api.wsUrl,
      autoConnect: false, // Disabled for offline-first approach
      reconnectAttempts: 3, // Reduced for offline-first
      reconnectDelay: 10000, // Longer delay for offline-first
      timeout: 15000, // Longer timeout
    };

    this.state = {
      isConnected: false,
      isConnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    };

    // Check if offline mode should be enabled
    this.offlineMode = !navigator.onLine || !envConfig.features.enableRealTimeUpdates;

    this.initializeDeviceInfo();
    this.setupConnectivityListeners();
  }

  /**
   * Initialize device information for WebSocket authentication
   */
  private async initializeDeviceInfo(): Promise<void> {
    try {
      this.deviceInfo = await Device.getInfo();
    } catch (error) {
      console.error('Failed to get device info:', error);
      this.deviceInfo = { platform: 'unknown', model: 'unknown' };
    }
  }

  /**
   * Set up connectivity listeners for offline-first operation
   */
  private setupConnectivityListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.offlineMode = false;
      this.connectionRetryCount = 0;
      // Only attempt connection for critical operations
      setTimeout(() => this.attemptCriticalConnection(), 2000);
    });

    window.addEventListener('offline', () => {
      this.offlineMode = true;
      this.disconnect();
    });

    // App state listener with reduced reconnection
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && !this.offlineMode && !this.isConnected() && this.connectionRetryCount < this.MAX_RETRY_ATTEMPTS) {
        // Only reconnect if we haven't exceeded retry attempts
        setTimeout(() => this.attemptCriticalConnection(), 5000);
      }
    });
  }

  /**
   * Attempt connection only for critical operations (case assignment, submit, sync)
   */
  private attemptCriticalConnection(): void {
    if (this.offlineMode || this.isConnecting || this.connectionRetryCount >= this.MAX_RETRY_ATTEMPTS) {
      return;
    }
    
    this.connectionRetryCount++;
    this.connect().catch(() => {
      // Silently fail and rely on offline capabilities
    });
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // Prevent multiple simultaneous connection attempts
      if (this.isConnecting) {
        resolve();
        return;
      }

      if (this.socket?.connected) {
        resolve();
        return;
      }

      // Throttle connection attempts
      const now = Date.now();
      if (now - this.lastConnectionAttempt < this.CONNECTION_THROTTLE_MS) {
        reject(new Error('Connection attempts throttled'));
        return;
      }

      this.lastConnectionAttempt = now;
      this.isConnecting = true;

      const token = await authService.getAccessToken();
      if (!token) {
        this.isConnecting = false;
        reject(new Error('No authentication token available'));
        return;
      }

      this.state.isConnecting = true;
      this.state.error = null;

      // Ensure device info is available
      if (!this.deviceInfo) {
        await this.initializeDeviceInfo();
      }

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(this.config.url, {
        auth: {
          token,
          platform: 'mobile',
          deviceId: this.deviceInfo?.identifier || 'unknown',
        },
        transports: ['websocket'],
        timeout: this.config.timeout,
        forceNew: true,
      });

      this.setupEventListeners();

      this.socket.on('connect', () => {
        this.isConnecting = false;
        this.state.isConnected = true;
        this.state.isConnecting = false;
        this.state.lastConnected = new Date();
        this.state.reconnectAttempts = 0;
        

        this.eventHandlers.onConnected?.({
          message: 'Connected to CaseFlow WebSocket server',
          timestamp: new Date().toISOString(),
        });
        
        resolve();
      });

      this.socket.on('connect_error', (error: any) => {
        this.isConnecting = false;
        this.state.isConnecting = false;
        this.state.error = error.message;
        

        this.eventHandlers.onError?.(error.message);
        
        if (this.state.reconnectAttempts < this.config.reconnectAttempts) {
          this.scheduleReconnect();
        } else {
          reject(error);
        }
      });
    });
  }

  /**
   * Set up event listeners for critical WebSocket events only
   * Focus on: case assignment, submission confirmations, and sync triggers
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      this.state.isConnected = false;
      this.eventHandlers.onDisconnected?.(reason);
      
      // Only auto-reconnect for critical disconnections, not manual ones
      if (reason !== 'io client disconnect' && !this.offlineMode && this.connectionRetryCount < this.MAX_RETRY_ATTEMPTS) {
        this.scheduleReconnect();
      }
    });

    // CRITICAL: Case assignment notifications (offline-first)
    this.socket.on('mobile:case:assigned', (data: CaseAssignmentNotification & { notificationId?: string }) => {
      // Acknowledge notification
      if (data.notificationId) {
        this.acknowledgeNotification(data.notificationId);
      }

      this.eventHandlers.onCaseAssigned?.(data);

      // Trigger case sync for new assignment
      caseService.syncCases().catch(() => {
        // Silently fail - offline mode will handle this
      });
    });

    // CRITICAL: Sync triggers (for offline-first operation)
    this.socket.on('mobile:sync:trigger', (data: any) => {
      this.eventHandlers.onSyncTrigger?.(data);
      
      // Trigger intelligent sync
      caseService.syncCases().catch(() => {
        // Silently fail - will be handled by periodic sync
      });
    });

    // CRITICAL: Sync completion notifications
    this.socket.on('mobile:sync:completed', (data: any) => {
      this.eventHandlers.onSyncCompleted?.(data);
    });

    // Optional: Case status changes (less critical for offline-first)
    this.socket.on('mobile:case:status:changed', (data: CaseStatusChangeNotification & { notificationId?: string }) => {
      if (data.notificationId) {
        this.acknowledgeNotification(data.notificationId);
      }
      this.eventHandlers.onCaseStatusChanged?.(data);
    });
  }

  /**
   * Schedule reconnection with offline-first approach
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.offlineMode || this.connectionRetryCount >= this.MAX_RETRY_ATTEMPTS) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.state.reconnectAttempts++;
    this.connectionRetryCount++;
    
    // Exponential backoff with maximum delay for offline-first
    const delay = Math.min(this.config.reconnectDelay * Math.pow(2, this.state.reconnectAttempts - 1), 60000);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Silently fail - offline mode will handle operations
      });
    }, delay);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = false;
    this.state.isConnected = false;
    this.state.isConnecting = false;
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Get connection state
   */
  getState(): WebSocketState {
    return { ...this.state };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected && this.socket?.connected === true;
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Subscribe to case updates
   */
  subscribeToCase(caseId: string): void {
    this.emit('subscribe:case', caseId);
  }

  /**
   * Unsubscribe from case updates
   */
  unsubscribeFromCase(caseId: string): void {
    this.emit('unsubscribe:case', caseId);
  }

  /**
   * Send app state change notification
   */
  notifyAppStateChange(state: 'foreground' | 'background' | 'inactive'): void {
    this.emit('mobile:app:state', { state });
  }

  /**
   * Send connectivity status update
   */
  notifyConnectivityChange(isOnline: boolean, connectionType: string, pendingSync: number): void {
    this.emit('mobile:connectivity', { isOnline, connectionType, pendingSync });
  }

  /**
   * Send notification acknowledgment
   */
  acknowledgeNotification(notificationId: string): void {
    this.emit('mobile:notification:ack', { notificationId });
  }

  /**
   * Trigger sync operation (offline-first)
   */
  triggerSync(): void {
    if (this.isConnected()) {
      this.emit('mobile:sync:request', {
        timestamp: new Date().toISOString(),
        offline: false
      });
    } else {
      // Trigger local sync when offline
      caseService.syncCases().catch(() => {
        // Local sync failed - will be retried later
      });
    }
  }

  /**
   * Notify case submission (for real-time confirmation)
   */
  notifyCaseSubmission(caseId: string, offline: boolean = false): void {
    if (this.isConnected()) {
      this.emit('mobile:case:submit', {
        caseId,
        timestamp: new Date().toISOString(),
        offline
      });
    }
    // If offline, submission will be handled by case service queue
  }

  /**
   * Request case assignment updates (when coming online)
   */
  requestCaseUpdates(): void {
    if (this.isConnected()) {
      this.emit('mobile:cases:refresh', {
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check if offline mode is enabled
   */
  isOffline(): boolean {
    return this.offlineMode || !navigator.onLine;
  }

  /**
   * Enable offline-first mode
   */
  enableOfflineMode(): void {
    this.offlineMode = true;
    this.disconnect();
  }

  /**
   * Disable offline mode and attempt connection
   */
  disableOfflineMode(): void {
    this.offlineMode = false;
    this.connectionRetryCount = 0;
    if (navigator.onLine) {
      this.attemptCriticalConnection();
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
