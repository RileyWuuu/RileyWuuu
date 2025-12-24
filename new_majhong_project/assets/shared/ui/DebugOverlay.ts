// Debug Overlay for displaying logs with category filtering and network events

import { _decorator, Component, Node, Label, EditBox } from 'cc';
import { Logger } from '../logger';
import { NetworkClient } from '../network/NetworkClient';
import { ReplayLog } from '../../features/room/replay/ReplayLog';

const { ccclass, property } = _decorator;

@ccclass('DebugOverlay')
export class DebugOverlay extends Component {
  @property(Label)
  logLabel: Label = null!;

  @property(Node)
  toggleButton: Node = null!;

  @property(EditBox)
  categoryFilterInput: EditBox = null!;

  @property(Label)
  networkLogLabel: Label = null!;

  @property(Label)
  replayLogLabel: Label = null!;

  private isVisible: boolean = false;
  private unsubscribe: (() => void) | null = null;
  private updateInterval: number | null = null;
  private categoryFilter: string = '';
  private networkClient: NetworkClient | null = null;
  private replayLog: ReplayLog | null = null;

  onLoad() {
    if (this.logLabel) {
      this.logLabel.node.active = false;
    }
    if (this.networkLogLabel) {
      this.networkLogLabel.node.active = false;
    }
    if (this.replayLogLabel) {
      this.replayLogLabel.node.active = false;
    }
  }

  start() {
    // Subscribe to logger
    const loggerInstance = Logger.getInstance();
    this.unsubscribe = loggerInstance.subscribe(() => {
      this.updateLogs();
    });

    // Update logs periodically
    this.updateInterval = setInterval(() => {
      this.updateLogs();
      this.updateNetworkLogs();
      this.updateReplayLogs();
    }, 500) as unknown as number;

    // Toggle button
    if (this.toggleButton) {
      this.toggleButton.on('touch-end', this.toggle, this);
    }

    // Category filter input
    if (this.categoryFilterInput) {
      this.categoryFilterInput.node.on('text-changed', this.onCategoryFilterChanged, this);
    }
  }

  setNetworkClient(client: NetworkClient): void {
    this.networkClient = client;
  }

  setReplayLog(replayLog: ReplayLog): void {
    this.replayLog = replayLog;
  }

  onDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  toggle() {
    this.isVisible = !this.isVisible;
    if (this.logLabel) {
      this.logLabel.node.active = this.isVisible;
    }
    if (this.networkLogLabel) {
      this.networkLogLabel.node.active = this.isVisible;
    }
    if (this.replayLogLabel) {
      this.replayLogLabel.node.active = this.isVisible;
    }
  }

  private onCategoryFilterChanged() {
    if (this.categoryFilterInput) {
      this.categoryFilter = this.categoryFilterInput.string.trim();
      this.updateLogs();
    }
  }

  private updateLogs() {
    if (!this.logLabel || !this.isVisible) {
      return;
    }

    const loggerInstance = Logger.getInstance();
    const categoryFilter = this.categoryFilter || undefined;
    const logs = loggerInstance.getRecentLogs(20, categoryFilter);
    
    const logText = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const level = log.level.toUpperCase().padEnd(5);
      return `[${time}] ${level} [${log.category}] ${log.message}`;
    }).join('\n');

    this.logLabel.string = logText || 'No logs';
  }

  private updateNetworkLogs() {
    if (!this.networkLogLabel || !this.isVisible || !this.networkClient) {
      return;
    }

    const networkLogs = this.networkClient.getNetworkLog(15);
    
    const logText = networkLogs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const type = log.type.toUpperCase().padEnd(8);
      const dataStr = JSON.stringify(log.data).substring(0, 50);
      return `[${time}] ${type} ${dataStr}${dataStr.length >= 50 ? '...' : ''}`;
    }).join('\n');

    this.networkLogLabel.string = logText || 'No network events';
  }

  private updateReplayLogs() {
    if (!this.replayLogLabel || !this.isVisible || !this.replayLog) {
      return;
    }

    const events = this.replayLog.getRecentEvents(10);
    
    const logText = events.map(event => {
      const time = `${(event.timestamp / 1000).toFixed(1)}s`;
      return `[${time}] ${event.event.type}`;
    }).join('\n');

    this.replayLogLabel.string = logText || 'No replay events';
  }
}
