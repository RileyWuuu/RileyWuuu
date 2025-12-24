// WebSocket Transport implementation

import { NetworkEnvelope, IntentPayload, EventPayload, SnapshotPayload } from './Messages';
import { Protocol } from './Protocol';
import { SequenceManager } from './Sequence';
import { logger } from '../logger';

export interface TransportConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WsTransport {
  private ws: WebSocket | null = null;
  private config: Required<TransportConfig>;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectAttempts: number = 0;
  private isManualClose: boolean = false;
  private sequenceManager: SequenceManager;
  private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();
  private onConnectHandler?: () => void;
  private onDisconnectHandler?: () => void;
  private onErrorHandler?: (error: Error) => void;

  constructor(config: TransportConfig) {
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000
    };
    this.sequenceManager = new SequenceManager();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false;
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          logger.info('WsTransport', 'WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onConnectHandler?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const envelope = Protocol.decode(event.data);
            this.handleEnvelope(envelope);
          } catch (error) {
            logger.error('WsTransport', 'Failed to handle envelope', error);
          }
        };

        this.ws.onerror = (error) => {
          logger.error('WsTransport', 'WebSocket error', error);
          this.onErrorHandler?.(new Error('WebSocket error'));
          reject(error);
        };

        this.ws.onclose = () => {
          logger.warn('WsTransport', 'WebSocket closed');
          this.stopHeartbeat();
          this.onDisconnectHandler?.();
          if (!this.isManualClose) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        logger.error('WsTransport', 'Failed to create WebSocket', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendIntent(intent: IntentPayload): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('WsTransport', 'Cannot send intent: WebSocket not connected');
      return;
    }

    const seq = this.sequenceManager.getNextSeq();
    const ack = this.sequenceManager.getLastAck();
    this.sequenceManager.addPendingIntent(seq, intent);

    const envelope = Protocol.createIntentEnvelope(intent, seq, ack);
    this.ws.send(Protocol.encode(envelope));
    logger.debug('WsTransport', 'Sent intent', { type: intent.type, seq });
  }

  onEvent(eventType: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  onConnect(handler: () => void): void {
    this.onConnectHandler = handler;
  }

  onDisconnect(handler: () => void): void {
    this.onDisconnectHandler = handler;
  }

  onError(handler: (error: Error) => void): void {
    this.onErrorHandler = handler;
  }

  requestSnapshot(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('WsTransport', 'Cannot request snapshot: WebSocket not connected');
      return;
    }

    const envelope = Protocol.createHeartbeatEnvelope(
      this.sequenceManager.getCurrentSeq(),
      this.sequenceManager.getLastAck()
    );
    this.ws.send(Protocol.encode(envelope));
    logger.debug('WsTransport', 'Requested snapshot');
  }

  private handleEnvelope(envelope: NetworkEnvelope): void {
    // Update ack from envelope
    if ('ack' in envelope) {
      this.sequenceManager.updateAck(envelope.ack);
    }

    if (Protocol.isEventEnvelope(envelope)) {
      const event = envelope.event;
      this.emitEvent(event.type, event.payload);
    } else if (Protocol.isSnapshotEnvelope(envelope)) {
      const snapshot = envelope.snapshot;
      this.emitEvent('snapshot', snapshot);
    } else if (Protocol.isAckEnvelope(envelope)) {
      // Ack already processed above
    } else if (Protocol.isHeartbeatEnvelope(envelope)) {
      this.sendAck();
    }
  }

  private emitEvent(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
    const allHandlers = this.eventHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler({ type: eventType, data }));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const envelope = Protocol.createHeartbeatEnvelope(
          this.sequenceManager.getCurrentSeq(),
          this.sequenceManager.getLastAck()
        );
        this.ws.send(Protocol.encode(envelope));
      }
    }, this.config.heartbeatInterval) as unknown as number;
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendAck(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const envelope = Protocol.createAckEnvelope(this.sequenceManager.getLastAck());
    this.ws.send(Protocol.encode(envelope));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('WsTransport', 'Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info('WsTransport', `Scheduling reconnect attempt ${this.reconnectAttempts}`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnect will be scheduled again in onclose
      });
    }, this.config.reconnectInterval) as unknown as number;
  }

  getSequenceManager(): SequenceManager {
    return this.sequenceManager;
  }
}
