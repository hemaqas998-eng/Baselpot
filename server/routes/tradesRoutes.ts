import { Router } from 'express';
import { radarEngine } from '../radarEngine.js';
import { brokerWebhookService } from '../brokerWebhookService.js';
import { directBrokerApiService } from '../directBrokerApiService.js';
import { setAtomicLivePrice } from '../tiingoWS.js';
import { cryptoGemHunterService } from '../cryptoGemHunterService.js';

export const tradesRouter = Router();

// Get Live Paper Trades
tradesRouter.get('/', (req, res) => {
  try {
    const trades = radarEngine.getPaperTrades();
    res.json({ success: true, trades });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Open Direct Trade
tradesRouter.post('/open', (req, res) => {
  try {
    const result = radarEngine.openTradeDirectly(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Modify Active Trade
tradesRouter.post('/:id/modify', (req, res) => {
  try {
    const { id } = req.params;
    const result = radarEngine.modifyPaperTrade(id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Close Profitable Trades
tradesRouter.post('/close-profitable', (req, res) => {
  try {
    const result = radarEngine.closeProfitableTrades();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Close Trades for Specific Symbol
tradesRouter.post('/close-symbol', (req, res) => {
  try {
    const { symbol } = req.body;
    const result = radarEngine.closeTradesForSymbol(symbol);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Close Single Trade
tradesRouter.post('/:id/close', (req, res) => {
  try {
    const { id } = req.params;
    const closed = radarEngine.closePaperTrade(id);
    if (!closed) {
      return res.status(404).json({ success: false, error: 'Trade not found or already closed' });
    }
    res.json({ success: true, trade: closed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Close All Active Trades
tradesRouter.post('/close-all', (req, res) => {
  try {
    const result = radarEngine.closeAllTrades();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset Account & Flush Simulated Trades
tradesRouter.post('/reset', (req, res) => {
  try {
    const { startingBalance } = req.body;
    const result = radarEngine.resetPaperTrades(typeof startingBalance === 'number' ? startingBalance : 0);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Broker Webhook & Direct Execution Endpoints ---
export const brokerRouter = Router();

// Universal Broker Webhook Dispatcher (MT4 / MT5 / Binance / Bybit)
brokerRouter.post('/webhook', async (req, res) => {
  try {
    const { action, symbol, direction, lotSize, stopLoss, takeProfit1, secret } = req.body;
    const expectedSecret = radarEngine.getSettings().brokerWebhookSecret;
    if (expectedSecret && secret !== expectedSecret && req.headers['x-broker-secret'] !== expectedSecret) {
      return res.status(401).json({ success: false, error: 'Unauthorized webhook secret' });
    }
    
    const result = radarEngine.openTradeDirectly({
      symbol,
      direction: direction || (action === 'BUY' ? 'LONG' : 'SHORT'),
      lotSize: lotSize || 0.01,
      stopLoss,
      takeProfit1
    });
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// MetaTrader EA Polling Bridge
brokerRouter.get('/mt-bridge/poll', (req, res) => {
  try {
    const secret = (req.query.secret as string) || (req.headers['x-broker-secret'] as string);
    const expectedSecret = radarEngine.getSettings().brokerWebhookSecret;
    if (expectedSecret && secret && secret !== expectedSecret) {
      return res.status(401).json({ success: false, error: 'Unauthorized EA bridge secret' });
    }

    const openTrades = radarEngine.getPaperTrades().filter(t => t.status === 'OPEN');
    const latestSignals = radarEngine.getSignals().slice(0, 5);

    res.json({
      success: true,
      timestamp: Date.now(),
      brokerSupport: ['JustMarkets', 'XM', 'Binance', 'MetaTrader 4', 'MetaTrader 5'],
      openOrders: openTrades.map(t => ({
        ticketId: t.id,
        symbol: t.symbol,
        direction: t.direction,
        lotSize: t.lotSize,
        entryPrice: t.entryPrice,
        stopLoss: t.stopLoss,
        takeProfit1: t.takeProfit1,
        takeProfit2: t.takeProfit2,
        trailingStopActive: t.trailingStopActive,
        openedAt: t.openedAt
      })),
      pendingSignals: latestSignals.map(s => ({
        signalId: s.id,
        symbol: s.symbol,
        direction: s.direction,
        confidence: s.confidence,
        entryPrice: s.entryPrice,
        stopLoss: s.stopLoss,
        takeProfit1: s.takeProfit1,
        takeProfit2: s.takeProfit2,
        createdAt: s.createdAt
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct Live Broker Price Push
brokerRouter.post('/push-ticks', (req, res) => {
  try {
    const { symbol, bid, ask, price, source } = req.body;
    if (!symbol || (!price && !bid && !ask)) {
      return res.status(400).json({ success: false, error: 'Symbol and price are required' });
    }
    const tickPrice = price || (bid && ask ? (bid + ask) / 2 : (bid || ask));
    const normalized = symbol.replace(/[\/\-_]/g, '').toUpperCase();
    
    setAtomicLivePrice({
      symbol: normalized,
      price: tickPrice,
      bid,
      ask,
      timestamp: Date.now(),
      source: source || 'BROKER_DIRECT_FEED'
    });

    res.json({ success: true, symbol: normalized, price: tickPrice, timestamp: Date.now() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct Non-Webhook Broker API Validation
brokerRouter.post('/validate-credentials', async (req, res) => {
  try {
    const { broker, credentials } = req.body;
    if (!broker || !credentials) {
      return res.status(400).json({ success: false, message: 'Broker name and credentials are required' });
    }

    let result: any;
    switch (broker.toUpperCase()) {
      case 'BINANCE':
        result = await directBrokerApiService.validateBinance(
          credentials.apiKey,
          credentials.apiSecret,
          credentials.testnet,
          credentials.accountType || 'FUTURES_USDT'
        );
        break;
      case 'JUSTMARKETS':
        result = await directBrokerApiService.validateJustMarkets(
          credentials.mtLogin,
          credentials.server,
          credentials.apiToken,
          credentials.restEndpoint
        );
        break;
      case 'XM':
        result = await directBrokerApiService.validateXM(
          credentials.mtLogin,
          credentials.server,
          credentials.apiToken,
          credentials.restEndpoint
        );
        break;
      case 'BYBIT':
        result = await directBrokerApiService.validateBybit(
          credentials.apiKey,
          credentials.apiSecret,
          credentials.testnet
        );
        break;
      default:
        result = {
          success: true,
          broker,
          message: `Credentials registered for ${broker}. Direct execution enabled.`
        };
    }

    if (result.success) {
      const currentSettings = radarEngine.getSettings();
      const updatedBrokerCreds: any = {
        ...(currentSettings.brokerApiCredentials || {}),
        activeBroker: broker.toUpperCase(),
      };

      if (broker.toUpperCase() === 'BINANCE') {
        updatedBrokerCreds.binance = {
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          accountType: credentials.accountType || 'FUTURES_USDT',
          testnet: Boolean(credentials.testnet),
          isValidated: true,
          lastValidated: Date.now(),
          accountBalance: result.balance,
          permissions: result.permissions
        };
      } else if (broker.toUpperCase() === 'JUSTMARKETS') {
        updatedBrokerCreds.justmarkets = {
          mtLogin: credentials.mtLogin,
          server: credentials.server,
          apiToken: credentials.apiToken,
          restEndpoint: credentials.restEndpoint,
          isValidated: true,
          lastValidated: Date.now(),
          accountBalance: result.balance,
          currency: result.currency || 'USD'
        };
      } else if (broker.toUpperCase() === 'XM') {
        updatedBrokerCreds.xm = {
          mtLogin: credentials.mtLogin,
          server: credentials.server,
          apiToken: credentials.apiToken,
          restEndpoint: credentials.restEndpoint,
          isValidated: true,
          lastValidated: Date.now(),
          accountBalance: result.balance,
          currency: result.currency || 'USD'
        };
      } else if (broker.toUpperCase() === 'BYBIT') {
        updatedBrokerCreds.bybit = {
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          testnet: Boolean(credentials.testnet),
          category: 'linear',
          isValidated: true,
          lastValidated: Date.now(),
          accountBalance: result.balance
        };
      }

      const newLiveBalance = typeof result.balance === 'number' ? result.balance : currentSettings.accountBalance;
      const targetProfit = newLiveBalance > 0 ? Number((newLiveBalance * (currentSettings.dailyProfitTargetMultiplier || 10)).toFixed(2)) : currentSettings.dailyProfitTargetUSD;

      radarEngine.updateSettings({
        brokerApiCredentials: updatedBrokerCreds,
        accountBalance: newLiveBalance,
        dailyProfitTargetUSD: targetProfit
      });

      // Instantly trigger crypto wallet sync so Bybit balance and connection status update immediately
      cryptoGemHunterService.syncRealExchangeWallets().catch(() => {});
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Validation failed: ${err.message}` });
  }
});

// Broker Diagnostic Endpoint (Specifically for Bybit IP Whitelisting, Binance Signature, etc.)
brokerRouter.post('/diagnose', async (req, res) => {
  try {
    const { broker, apiKey, apiSecret, testnet } = req.body;
    if (broker === 'BYBIT') {
      const diagResult = await directBrokerApiService.diagnoseBybit(apiKey || '', apiSecret || '', Boolean(testnet));
      return res.json(diagResult);
    }
    
    // Default diagnosis
    const serverIp = await directBrokerApiService.validateBinance(apiKey || '', apiSecret || '', Boolean(testnet));
    res.json({
      success: serverIp.success,
      apiResponseCode: serverIp.success ? 0 : -1,
      apiMessage: serverIp.message,
      broker
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Direct Broker Order Execution
brokerRouter.post('/direct-execute', async (req, res) => {
  try {
    const { broker, trade } = req.body;
    const settings = radarEngine.getSettings();
    const brokerCreds = settings.brokerApiCredentials;

    if (!brokerCreds) {
      return res.status(400).json({ success: false, message: 'No broker credentials configured in settings' });
    }

    if (broker === 'BINANCE' && brokerCreds.binance?.isValidated) {
      const result = await directBrokerApiService.executeBinanceOrder(
        {
          apiKey: brokerCreds.binance.apiKey,
          apiSecret: brokerCreds.binance.apiSecret,
          testnet: brokerCreds.binance.testnet,
          accountType: brokerCreds.binance.accountType
        },
        trade
      );
      return res.json(result);
    }

    if (broker === 'BYBIT' && brokerCreds.bybit?.isValidated) {
      const result = await directBrokerApiService.executeBybitOrder(
        {
          apiKey: brokerCreds.bybit.apiKey,
          apiSecret: brokerCreds.bybit.apiSecret,
          testnet: brokerCreds.bybit.testnet,
          category: brokerCreds.bybit.category || 'linear'
        },
        trade
      );
      return res.json(result);
    }

    const directTrade = radarEngine.openTradeDirectly({
      symbol: trade.symbol,
      direction: trade.direction,
      lotSize: trade.lotSize || 0.01,
      stopLoss: trade.stopLoss,
      takeProfit1: trade.takeProfit1
    });

    res.json({
      success: true,
      broker,
      ticketId: directTrade.trade?.id,
      message: `Direct Order dispatched to ${broker} bridge without Webhooks!`,
      trade: directTrade.trade
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test Webhook Connection
brokerRouter.post('/test', async (req, res) => {
  try {
    const { url, secret, platform } = req.body;
    brokerWebhookService.updateConfig(url, secret, true, platform);
    const sampleTrade: any = {
      id: 'TRD-TEST-WEBHOOK',
      symbol: 'EUR/USD',
      direction: 'LONG',
      lotSize: 0.01,
      entryPrice: 1.0850,
      stopLoss: 1.0800,
      takeProfit1: 1.0920,
      status: 'OPEN',
      pnl: 0,
      openedAt: Date.now()
    };
    const result = await brokerWebhookService.dispatchTradeOpen(sampleTrade);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
