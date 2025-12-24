// Sequence number management for network messages

export class SequenceManager {
  private nextSeq: number = 0;
  private lastAck: number = 0;
  private pendingIntents: Map<number, { intent: any; timestamp: number }> = new Map();

  getNextSeq(): number {
    return ++this.nextSeq;
  }

  getCurrentSeq(): number {
    return this.nextSeq;
  }

  getLastAck(): number {
    return this.lastAck;
  }

  updateAck(ack: number): void {
    if (ack > this.lastAck) {
      this.lastAck = ack;
      // Remove acknowledged intents
      for (const [seq, _] of this.pendingIntents) {
        if (seq <= ack) {
          this.pendingIntents.delete(seq);
        }
      }
    }
  }

  addPendingIntent(seq: number, intent: any): void {
    this.pendingIntents.set(seq, {
      intent,
      timestamp: Date.now()
    });
  }

  getPendingIntents(): Map<number, { intent: any; timestamp: number }> {
    return new Map(this.pendingIntents);
  }

  clearPendingIntents(): void {
    this.pendingIntents.clear();
  }

  reset(): void {
    this.nextSeq = 0;
    this.lastAck = 0;
    this.pendingIntents.clear();
  }
}
