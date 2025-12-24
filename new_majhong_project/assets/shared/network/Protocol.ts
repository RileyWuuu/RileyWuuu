// Network Protocol - Envelope encode/decode

import { NetworkEnvelope, IntentEnvelope, EventEnvelope, SnapshotEnvelope, HeartbeatEnvelope, AckEnvelope, IntentPayload, EventPayload, SnapshotPayload } from './Messages';
import { SequenceManager } from './Sequence';
import { logger } from '../logger';

export class Protocol {
  static encode(envelope: NetworkEnvelope): string {
    try {
      return JSON.stringify(envelope);
    } catch (error) {
      logger.error('Protocol', 'Failed to encode envelope', error);
      throw error;
    }
  }

  static decode(data: string): NetworkEnvelope {
    try {
      const envelope = JSON.parse(data) as NetworkEnvelope;
      return envelope;
    } catch (error) {
      logger.error('Protocol', 'Failed to decode envelope', error);
      throw error;
    }
  }

  static createIntentEnvelope(intent: IntentPayload, seq: number, ack: number): IntentEnvelope {
    return {
      type: 'intent',
      seq,
      ack,
      intent
    };
  }

  static createEventEnvelope(event: EventPayload, seq: number, ack: number): EventEnvelope {
    return {
      type: 'event',
      seq,
      ack,
      event
    };
  }

  static createSnapshotEnvelope(snapshot: SnapshotPayload, seq: number, ack: number): SnapshotEnvelope {
    return {
      type: 'snapshot',
      seq,
      ack,
      snapshot
    };
  }

  static createHeartbeatEnvelope(seq: number, ack: number): HeartbeatEnvelope {
    return {
      type: 'heartbeat',
      seq,
      ack
    };
  }

  static createAckEnvelope(ack: number): AckEnvelope {
    return {
      type: 'ack',
      ack
    };
  }

  static isIntentEnvelope(envelope: NetworkEnvelope): envelope is IntentEnvelope {
    return envelope.type === 'intent';
  }

  static isEventEnvelope(envelope: NetworkEnvelope): envelope is EventEnvelope {
    return envelope.type === 'event';
  }

  static isSnapshotEnvelope(envelope: NetworkEnvelope): envelope is SnapshotEnvelope {
    return envelope.type === 'snapshot';
  }

  static isHeartbeatEnvelope(envelope: NetworkEnvelope): envelope is HeartbeatEnvelope {
    return envelope.type === 'heartbeat';
  }

  static isAckEnvelope(envelope: NetworkEnvelope): envelope is AckEnvelope {
    return envelope.type === 'ack';
  }
}
