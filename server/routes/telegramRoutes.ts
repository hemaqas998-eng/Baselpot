import { Router } from 'express';
import { telegramService } from '../telegramService.js';
import { radarEngine } from '../radarEngine.js';

export const telegramRouter = Router();

// Test Telegram & Discord Alert
telegramRouter.post('/test', async (req, res) => {
  try {
    const { botToken, chatId, discordWebhookUrl, appUrl } = req.body;
    if (botToken && chatId) {
      telegramService.updateCredentials(botToken, chatId, true, discordWebhookUrl, Boolean(discordWebhookUrl));
    }
    const result = await telegramService.sendTestMessage(appUrl || '');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bot Info
telegramRouter.get('/bot-info', async (req, res) => {
  try {
    const botInfo = await telegramService.getBotMe();
    res.json(botInfo);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ping
telegramRouter.get('/ping', async (req, res) => {
  try {
    const botInfo = await telegramService.getBotMe();
    res.json(botInfo);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Set Mini App Menu Button
telegramRouter.post('/set-menu-button', async (req, res) => {
  try {
    const { webAppUrl } = req.body;
    if (!webAppUrl) {
      return res.status(400).json({ success: false, error: 'webAppUrl is required' });
    }
    const result = await telegramService.setChatMenuButton(webAppUrl);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dispatch Telegram Command
telegramRouter.post('/command', async (req, res) => {
  try {
    const { command } = req.body;
    const status = radarEngine.getStatus();
    let reply = '';

    if (command === '/status') {
      reply = `🤖 *Radar Bot Status:* ${status.isRunning ? 'ACTIVE 🟢' : 'PAUSED ⏸️'}\n` +
        `• Total Signals: ${status.totalSignalsGenerated}\n` +
        `• Win Rate: ${status.winRatePct}%\n` +
        `• Total PnL: $${status.totalPnL}\n` +
        `• Fear & Greed: ${status.fearAndGreed.sentiment} (${status.fearAndGreed.value}/100)`;
    } else if (command === '/scan') {
      const scanRes = await radarEngine.executeMarketScan();
      reply = `⚡ *Instant Scan Completed!*\nScanned ${scanRes.scannedCount} pairs. Generated ${scanRes.newSignals.length} new high-confluence setups.`;
    } else {
      reply = `ℹ️ *Available Bot Commands:*\n/status - View live bot performance\n/scan - Trigger instant market radar scan\n/signals - View top active setups`;
    }

    await telegramService.sendRawMessage(reply);
    res.json({ success: true, reply });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Signal Alert to Telegram & Discord
telegramRouter.post('/send-signal', async (req, res) => {
  try {
    const { signalId, appUrl } = req.body;
    const signals = radarEngine.getSignals();
    const signal = signals.find(s => s.id === signalId);
    if (!signal) {
      return res.status(404).json({ success: false, error: 'Signal not found' });
    }

    const result = await telegramService.sendSignalAlert(signal, appUrl);
    if (result.success) {
      signal.telegramSent = true;
      signal.telegramMessageId = result.messageId;
      signal.discordSent = true;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Webhook Receiver - Accepts only POST with optional secret token verification
telegramRouter.post(['/webhook', '/webhook/:secretToken'], async (req, res) => {
  try {
    const { secretToken } = req.params;
    const headerToken = req.headers['x-telegram-bot-api-secret-token'];
    
    // If a secretToken is provided in the URL or header, verify it
    if (secretToken && headerToken && secretToken !== headerToken) {
      return res.status(403).json({ ok: false, error: 'Unauthorized secret token mismatch' });
    }

    await telegramService.handleIncomingUpdate(req.body, radarEngine);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Explicitly reject GET or other methods on webhook to prevent HTML rendering or route confusion
telegramRouter.all(['/webhook', '/webhook/:secretToken'], (req, res) => {
  res.status(405).json({
    ok: false,
    error: 'Method Not Allowed. Telegram Webhook endpoint strictly accepts POST requests with JSON payload.',
    endpoint: '/api/telegram/webhook'
  });
});

