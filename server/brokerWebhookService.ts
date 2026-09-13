import { PaperTrade, TradeSignal } from '../src/types.js';

export interface BrokerExecutionPayload {
  action: 'BUY' | 'SELL' | 'CLOSE' | 'MODIFY_SL_TP';
  symbol: string;
  ticket?: string;
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  takeProfit3?: number;
  trailingSl?: number;
  secret?: string;
  source: string;
  timestamp: number;
}

export class BrokerWebhookService {
  private webhookUrl: string = '';
  private webhookSecret: string = '';
  private isEnabled: boolean = false;
  private platform: 'METATRADER_5' | 'METATRADER_4' | 'BINANCE' | 'BYBIT' | 'TRADINGVIEW_CUSTOM' = 'METATRADER_5';

  public updateConfig(url: string, secret: string, enabled: boolean, platform: any = 'METATRADER_5') {
    this.webhookUrl = url;
    this.webhookSecret = secret;
    this.isEnabled = enabled;
    this.platform = platform || 'METATRADER_5';
  }

  public isConfigured(): boolean {
    return Boolean(this.isEnabled && this.webhookUrl);
  }

  public getPlatform(): string {
    return this.platform;
  }

  /**
   * Dispatches trade opening to the configured broker Webhook / EA bridge
   */
  public async dispatchTradeOpen(trade: PaperTrade): Promise<{ success: boolean; message: string }> {
    if (!this.isEnabled || !this.webhookUrl) {
      return { success: false, message: 'Broker webhook is not enabled or URL is empty' };
    }

    try {
      const payload: BrokerExecutionPayload = {
        action: trade.direction === 'LONG' ? 'BUY' : 'SELL',
        symbol: trade.symbol.replace('/', ''),
        ticket: trade.id,
        lotSize: trade.lotSize || 0.02,
        entryPrice: trade.entryPrice,
        stopLoss: trade.stopLoss,
        takeProfit1: trade.takeProfit1,
        takeProfit2: trade.takeProfit2,
        takeProfit3: trade.takeProfit3,
        secret: this.webhookSecret,
        source: 'MarketRadar_24_7_Cloud_Daemon',
        timestamp: Date.now()
      };

      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Broker-Secret': this.webhookSecret,
          'User-Agent': 'MarketRadar-Autonomous-Broker-Bridge/3.0'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        return { success: true, message: `Dispatched ${trade.direction} on ${trade.symbol} to Broker Webhook (${this.platform})` };
      } else {
        const text = await res.text();
        return { success: false, message: `Broker Webhook error (${res.status}): ${text}` };
      }
    } catch (err: any) {
      return { success: false, message: `Broker Webhook network failed: ${err.message}` };
    }
  }

  /**
   * Dispatches trade closure (TP/SL/Trailing SL hit) to the configured broker Webhook
   */
  public async dispatchTradeClose(trade: PaperTrade): Promise<{ success: boolean; message: string }> {
    if (!this.isEnabled || !this.webhookUrl) {
      return { success: false, message: 'Broker webhook is not enabled or URL is empty' };
    }

    try {
      const payload: any = {
        action: 'CLOSE',
        symbol: trade.symbol.replace('/', ''),
        ticket: trade.id,
        closeReason: trade.closeReason,
        closePrice: trade.currentPrice,
        pnlUSD: trade.pnl,
        secret: this.webhookSecret,
        source: 'MarketRadar_24_7_Cloud_Daemon',
        timestamp: Date.now()
      };

      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Broker-Secret': this.webhookSecret
        },
        body: JSON.stringify(payload)
      });

      return { success: res.ok, message: `Dispatched close for ${trade.symbol}` };
    } catch (err: any) {
      return { success: false, message: `Broker Webhook close failed: ${err.message}` };
    }
  }

  /**
   * Dispatches Trailing Stop Loss update to the broker EA to lock profits on-broker
   */
  public async dispatchTrailingSlUpdate(trade: PaperTrade, newTrailingSl: number): Promise<{ success: boolean; message: string }> {
    if (!this.isEnabled || !this.webhookUrl) {
      return { success: false, message: 'Broker webhook not enabled' };
    }

    try {
      const payload: any = {
        action: 'MODIFY_SL_TP',
        symbol: trade.symbol.replace('/', ''),
        ticket: trade.id,
        stopLoss: newTrailingSl,
        takeProfit1: trade.takeProfit1,
        secret: this.webhookSecret,
        source: 'MarketRadar_24_7_Cloud_Daemon',
        timestamp: Date.now()
      };

      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Broker-Secret': this.webhookSecret
        },
        body: JSON.stringify(payload)
      });

      return { success: res.ok, message: `Dispatched Trailing SL modify for ${trade.symbol}` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const brokerWebhookService = new BrokerWebhookService();
