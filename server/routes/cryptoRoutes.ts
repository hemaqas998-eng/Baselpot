import { Router } from 'express';
import { cryptoGemHunterService } from '../cryptoGemHunterService.js';
import { forexAiAgent } from '../agents/forexAiAgent.js';
import { cryptoAiAgent } from '../agents/cryptoAiAgent.js';
import { radarEngine } from '../radarEngine.js';

export const cryptoRouter = Router();
export const agentsRouter = Router();

// --- Crypto Hub & Top 100 Routes ---

cryptoRouter.get('/top-100', async (req, res) => {
  try {
    const symbols = cryptoGemHunterService.getAllSymbols();
    const allocation = cryptoGemHunterService.getPortfolioAllocation();
    res.json({
      success: true,
      totalCount: symbols.length,
      allocation,
      symbols
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

cryptoRouter.get('/gems-pumps', (req, res) => {
  try {
    const gems = cryptoGemHunterService.getGemsAndPumps();
    res.json({
      success: true,
      count: gems.length,
      gems
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

cryptoRouter.get('/scalp-trades', (req, res) => {
  try {
    const openTrades = cryptoGemHunterService.getOpenTrades();
    const closedTrades = cryptoGemHunterService.getClosedTrades();
    const allocation = cryptoGemHunterService.getPortfolioAllocation();
    res.json({
      success: true,
      isRunning: cryptoGemHunterService.isRunning(),
      maxSlots: 5,
      activeTradesCount: openTrades.length,
      openTrades,
      closedTrades,
      allocation
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

cryptoRouter.post('/scalp-trades/open', (req, res) => {
  try {
    const { symbol, direction } = req.body;
    const allSymbols = cryptoGemHunterService.getAllSymbols();
    const target = allSymbols.find(s => s.symbol === symbol || s.baseAsset === symbol);

    if (!target) {
      return res.status(404).json({ success: false, message: 'رمز العملة غير موجود في قائمة أفضل 100 عملة.' });
    }

    const trade = cryptoGemHunterService.openScalpTrade(target, direction || 'LONG');
    if (!trade) {
      return res.status(400).json({
        success: false,
        message: 'تعذر فتح الصفقة: إما تم الوصول للحد الأقصى (5 صفقات متزامنة)، أو تم تفعيل قاطع هامش الخسارة 15% لحماية رأس المال.'
      });
    }

    res.json({ success: true, trade, allocation: cryptoGemHunterService.getPortfolioAllocation() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

cryptoRouter.post('/scalp-trades/:id/close', (req, res) => {
  try {
    const tradeId = req.params.id;
    const closed = cryptoGemHunterService.closeScalpTrade(tradeId, 'MANUAL_USER_CLOSE');
    if (!closed) {
      return res.status(404).json({ success: false, message: 'الصفقة غير موجودة أو تم إغلاقها بالفعل.' });
    }
    res.json({ success: true, trade: closed, allocation: cryptoGemHunterService.getPortfolioAllocation() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

cryptoRouter.get('/portfolio-allocation', (req, res) => {
  try {
    const allocation = cryptoGemHunterService.getPortfolioAllocation();
    res.json({ success: true, allocation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

cryptoRouter.post('/settings', (req, res) => {
  try {
    const { isRunning, totalEquityUSD, cryptoAllocationPct, maxDailyLossPct, resetDrawdown } = req.body;

    if (typeof isRunning === 'boolean') {
      cryptoGemHunterService.setBotRunning(isRunning);
    }
    if (typeof totalEquityUSD === 'number' && totalEquityUSD > 0) {
      cryptoGemHunterService.setPortfolioEquity(totalEquityUSD);
    }
    if (typeof cryptoAllocationPct === 'number') {
      cryptoGemHunterService.setCryptoAllocationPct(cryptoAllocationPct);
    }
    if (typeof maxDailyLossPct === 'number') {
      cryptoGemHunterService.setMaxDailyLossPct(maxDailyLossPct);
    }
    if (resetDrawdown === true) {
      cryptoGemHunterService.resetDailyDrawdown();
    }

    res.json({
      success: true,
      message: 'تم تحديث إعدادات محفظة الكريبتو وإدارة رأس المال بنجاح.',
      isRunning: cryptoGemHunterService.isRunning(),
      allocation: cryptoGemHunterService.getPortfolioAllocation()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Dedicated AI Agents Routes (Forex Agent & Crypto Agent Independently) ---

agentsRouter.get('/forex', async (req, res) => {
  try {
    const symbols = radarEngine.getSymbols();
    const signals = radarEngine.getSignals();
    const balance = radarEngine.getSettings().accountBalance || 1000;

    const analysis = await forexAiAgent.generateForexAnalysis(symbols, signals, balance);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

agentsRouter.get('/crypto', async (req, res) => {
  try {
    const gems = cryptoGemHunterService.getGemsAndPumps();
    const openScalps = cryptoGemHunterService.getOpenTrades();
    const allocation = cryptoGemHunterService.getPortfolioAllocation();

    const analysis = await cryptoAiAgent.generateCryptoAnalysis(gems, openScalps, allocation.cryptoAllocatedUSD);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
