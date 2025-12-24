// Network Client - Centralized network message handling

import { IntentPayload, EventPayload, SnapshotPayload, NetworkEnvelope } from './Messages';
import { Protocol } from './Protocol';
import { SequenceManager } from './Sequence';
import { WsTransport, TransportConfig } from './WsTransport';
import { logger } from '../logger';

export interface SnapshotApplyStrategy {
  apply(snapshot: SnapshotPayload): void;
}

export interface NetworkClientConfig extends TransportConfig {
  mockMode?: boolean; // Enable mock mode for testing
}

export class NetworkClient {
  private transport: WsTransport;
  private sequenceManager: SequenceManager;
  private eventHandlers: Map<string, Array<(payload: any) => void>> = new Map();
  private snapshotStrategy: SnapshotApplyStrategy | null = null;
  private networkLog: Array<{ timestamp: number; type: string; data: any }> = [];
  private maxLogSize: number = 100;
  private mockMode: boolean = false;
  private mockEventSeq: number = 0;

  constructor(config: NetworkClientConfig) {
    this.transport = new WsTransport(config);
    this.sequenceManager = this.transport.getSequenceManager();
    this.mockMode = config.mockMode ?? false;
    this.setupTransportHandlers();
  }

  private setupTransportHandlers(): void {
    // Handle incoming events from transport
    // Transport emits events with payload directly after envelope processing
    this.transport.onEvent('TILE_PLAYED', (payload) => {
      this.handleIncoming('event', { type: 'TILE_PLAYED', payload });
    });

    this.transport.onEvent('TURN_CHANGED', (payload) => {
      this.handleIncoming('event', { type: 'TURN_CHANGED', payload });
    });

    this.transport.onEvent('snapshot', (snapshot) => {
      this.handleIncoming('snapshot', snapshot);
    });

    // Handle wildcard events (for other event types)
    this.transport.onEvent('*', (data: { type: string; data: any }) => {
      // Transport already processed envelope, just forward the event
      if (data.type && data.type !== 'TILE_PLAYED' && data.type !== 'TURN_CHANGED' && data.type !== 'snapshot') {
        this.handleIncoming('event', { type: data.type, payload: data.data });
      }
    });
  }

  connect(): Promise<void> {
    return this.transport.connect();
  }

  disconnect(): void {
    this.transport.disconnect();
  }

  sendIntent(intent: IntentPayload): void {
    // Automatically wrap in envelope with seq
    const seq = this.sequenceManager.getNextSeq();
    const ack = this.sequenceManager.getLastAck();
    
    this.sequenceManager.addPendingIntent(seq, intent);
    
    this.addNetworkLog('intent', { type: intent.type, seq, ack, payload: intent.payload });
    logger.debug('NetworkClient', 'Sent intent', { type: intent.type, seq });

    if (this.mockMode) {
      // In mock mode, simulate server response
      this.simulateMockResponse(intent);
    } else {
      this.transport.sendIntent(intent);
    }
  }

  private simulateMockResponse(intent: IntentPayload): void {
    // Simulate server response for mock mode
    if (intent.type === 'PLAY_TILE') {
      const payload = intent.payload as { tileId: string };
      
      // Simulate delay
      setTimeout(() => {
        // Send TILE_PLAYED event
        const tilePlayedEvent: EventPayload = {
          type: 'TILE_PLAYED',
          payload: {
            playerId: 'player_1', // Mock player ID
            tileId: payload.tileId
          },
          seq: ++this.mockEventSeq
        };
        
        this.handleIncoming('event', tilePlayedEvent);
        
        // Send TURN_CHANGED event after a short delay
        setTimeout(() => {
          const turnChangedEvent: EventPayload = {
            type: 'TURN_CHANGED',
            payload: {
              playerIndex: 1 // Next player
            },
            seq: ++this.mockEventSeq
          };
          
          this.handleIncoming('event', turnChangedEvent);
        }, 100);
      }, 200);
    }
  }

  handleIncoming(type: string, data: any): void {
    // Process incoming event or snapshot
    if (type === 'event') {
      const event = data as EventPayload;
      // seq is handled by transport's envelope processing
      this.addNetworkLog('event', { type: event.type, payload: event.payload });
      this.dispatchEvent(event.type, event.payload);
    } else if (type === 'snapshot') {
      const snapshot = data as SnapshotPayload;
      this.addNetworkLog('snapshot', { seq: snapshot.seq, state: snapshot.state });
      this.applySnapshot(snapshot);
    }
  }

  private dispatchEvent(eventType: string, payload: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
    
    // Also emit to wildcard handlers
    const wildcardHandlers = this.eventHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler({ type: eventType, payload }));
    }
  }

  private applySnapshot(snapshot: SnapshotPayload): void {
    if (this.snapshotStrategy) {
      this.snapshotStrategy.apply(snapshot);
      logger.info('NetworkClient', `Applied snapshot seq: ${snapshot.seq}`);
    } else {
      logger.warn('NetworkClient', 'No snapshot strategy set, snapshot ignored');
    }
  }

  onEvent(eventType: string, handler: (payload: any) => void): () => void {
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

  setSnapshotStrategy(strategy: SnapshotApplyStrategy): void {
    this.snapshotStrategy = strategy;
  }

  requestSnapshot(): void {
    this.transport.requestSnapshot();
  }

  getSequenceManager(): SequenceManager {
    return this.sequenceManager;
  }

  getTransport(): WsTransport {
    return this.transport;
  }

  getNetworkLog(count: number = 20): Array<{ timestamp: number; type: string; data: any }> {
    return this.networkLog.slice(-count);
  }

  private addNetworkLog(type: string, data: any): void {
    this.networkLog.push({
      timestamp: Date.now(),
      type,
      data
    });
    
    if (this.networkLog.length > this.maxLogSize) {
      this.networkLog.shift();
    }
  }
}

