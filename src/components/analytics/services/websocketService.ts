'use client';

import { WebSocketMessage, RealTimeData } from '../types/analytics.types';

type EventCallback = (data: any) => void;
type ConnectionCallback = (status: 'connected' | 'disconnected' | 'reconnecting' | 'error') => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private siteId: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  
  // Event callbacks
  private eventCallbacks = new Map<string, EventCallback[]>();
  private connectionCallbacks: ConnectionCallback[] = [];
  
  // Fallback polling
  private fallbackInterval: NodeJS.Timeout | null = null;
  private fallbackEnabled = false;
  private fallbackDelay = 60000; // 1 minute fallback polling
  
  constructor() {
    this.setupEnvironment();
  }

  private setupEnvironment(): void {
    // Set WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    this.url = `${protocol}//${host}/api/analytics/live`;
  }

  // Connection Management
  connect(siteId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.siteId = siteId;
    this.isIntentionalClose = false;
    this.createConnection();
  }

  private createConnection(): void {
    try {
      const wsUrl = `${this.url}?siteId=${this.siteId}`;
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
      
      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection timeout');
          this.ws.close();
          this.handleConnectionFailure();
        }
      }, 10000); // 10-second timeout

      this.ws.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
      });

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleConnectionFailure();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.stopFallbackPolling();
      this.startHeartbeat();
      this.notifyConnectionCallbacks('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.cleanup();
      
      if (!this.isIntentionalClose) {
        this.notifyConnectionCallbacks('disconnected');
        this.handleReconnection();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifyConnectionCallbacks('error');
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle different message types
    switch (message.type) {
      case 'visitor_update':
        this.notifyCallbacks('visitor_update', message.payload);
        break;
      case 'engagement_update':
        this.notifyCallbacks('engagement_update', message.payload);
        break;
      case 'content_update':
        this.notifyCallbacks('content_update', message.payload);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }

    // Also notify generic listeners
    this.notifyCallbacks('message', message);
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached, starting fallback polling');
      this.startFallbackPolling();
      return;
    }

    this.reconnectAttempts++;
    this.notifyConnectionCallbacks('reconnecting');
    
    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const delay = Math.min(this.reconnectDelay + jitter, this.maxReconnectDelay);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.createConnection();
    }, delay);

    // Increase delay for next attempt
    this.reconnectDelay *= 2;
  }

  private handleConnectionFailure(): void {
    this.notifyConnectionCallbacks('error');
    if (!this.fallbackEnabled) {
      this.startFallbackPolling();
    }
  }

  // Heartbeat mechanism
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000); // 30-second heartbeat
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Fallback polling mechanism
  private async startFallbackPolling(): Promise<void> {
    if (this.fallbackEnabled) return;
    
    this.fallbackEnabled = true;
    console.log('Starting fallback polling for real-time data');

    const pollData = async () => {
      try {
        const response = await fetch(`/api/analytics/realtime?siteId=${this.siteId}`);
        const data = await response.json();
        
        if (data.success) {
          // Simulate WebSocket message format
          this.notifyCallbacks('visitor_update', data.data);
        }
      } catch (error) {
        console.error('Fallback polling failed:', error);
      }
    };

    // Initial poll
    await pollData();

    // Set up interval
    this.fallbackInterval = setInterval(pollData, this.fallbackDelay);
  }

  private stopFallbackPolling(): void {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
      this.fallbackEnabled = false;
      console.log('Stopped fallback polling');
    }
  }

  // Event subscription
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    
    this.eventCallbacks.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.eventCallbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  private notifyCallbacks(eventType: string, data: any): void {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} callback:`, error);
        }
      });
    }
  }

  private notifyConnectionCallbacks(status: 'connected' | 'disconnected' | 'reconnecting' | 'error'): void {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in connection callback:', error);
      }
    });
  }

  // Public API
  disconnect(): void {
    this.isIntentionalClose = true;
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
    }
  }

  private cleanup(): void {
    this.stopHeartbeat();
    this.stopFallbackPolling();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Send message (if needed for future functionality)
  send(message: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    
    console.warn('Cannot send message: WebSocket not connected');
    return false;
  }

  // Status getters
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  get isUsingFallback(): boolean {
    return this.fallbackEnabled;
  }

  getStats(): {
    connectionState: string;
    reconnectAttempts: number;
    isUsingFallback: boolean;
    subscriberCount: number;
  } {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      isUsingFallback: this.fallbackEnabled,
      subscriberCount: Array.from(this.eventCallbacks.values())
        .reduce((total, callbacks) => total + callbacks.length, 0),
    };
  }

  // Configure fallback settings
  configureFallback(enabled: boolean, delay: number = 60000): void {
    this.fallbackDelay = delay;
    
    if (enabled && !this.isConnected) {
      this.startFallbackPolling();
    } else if (!enabled) {
      this.stopFallbackPolling();
    }
  }

  // Configure reconnection settings
  configureReconnection(maxAttempts: number = 5, initialDelay: number = 1000, maxDelay: number = 30000): void {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectDelay = initialDelay;
    this.maxReconnectDelay = maxDelay;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export class for testing
export { WebSocketService }; 