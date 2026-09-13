/**
 * 24/7 Autonomous Cloud Daemon Keep-Alive & Heartbeat Monitor
 * Keeps the Cloud Run / VPS node environment hot, monitors market connectivity,
 * and ensures continuous execution even if all browser tabs are closed.
 */

export class DaemonKeepAliveService {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private heartbeatCount: number = 0;
  private lastHeartbeatTimestamp: number = Date.now();
  private selfPingUrl: string = 'http://localhost:3000/api/daemon/heartbeat';

  public start(radarEngineRef: any) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🛡️ 24/7 Autonomous Cloud Keep-Alive Daemon Engine initialized.');

    // Heartbeat every 45 seconds to keep the Cloud container warm and active
    this.intervalTimer = setInterval(async () => {
      this.heartbeatCount++;
      this.lastHeartbeatTimestamp = Date.now();

      try {
        // Self-ping local express endpoint to prevent container sleep
        await fetch(this.selfPingUrl).catch(() => {});
        
        // Ensure radar engine daemon loop is running smoothly
        const status = radarEngineRef.getStatus();
        if (status.isRunning) {
          // Verify price freshness & manage open trades trailing stop loss
          radarEngineRef.updateOpenTradesWithLivePrices?.();
        }
      } catch (err: any) {
        // Ignore background ping errors
      }
    }, 45000);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      heartbeatCount: this.heartbeatCount,
      lastHeartbeat: this.lastHeartbeatTimestamp,
      uptimeSeconds: Math.floor((Date.now() - (this.lastHeartbeatTimestamp - (this.heartbeatCount * 45000))) / 1000),
      mode: '24/7 AUTONOMOUS CLOUD DAEMON'
    };
  }
}

export const daemonKeepAliveService = new DaemonKeepAliveService();
