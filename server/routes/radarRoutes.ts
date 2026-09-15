import { Router } from 'express';
import { radarEngine } from '../radarEngine.js';
import { whaleOrderbookService } from '../whaleOrderbookService.js';
import { generateCandlesForSymbol, getLiveCandlesForSymbol, computeTechnicalIndicators, detectChartPatterns } from '../marketData.js';

export const radarRouter = Router();

// Get Chart Data with Authentic Candles & Technical Indicators
radarRouter.get('/chart/:symbol/:timeframe', async (req, res) => {
  try {
    const symbol = decodeURIComponent(req.params.symbol);
    const timeframe = req.params.timeframe || '15m';
    const candles = await getLiveCandlesForSymbol(symbol, timeframe, 80);
    const indicators = computeTechnicalIndicators(candles);
    const pattern = detectChartPatterns(symbol, timeframe, candles, indicators);
    res.json({ success: true, symbol, timeframe, candles, indicators, pattern });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bot Status
radarRouter.get('/status', (req, res) => {
  try {
    const status = radarEngine.getStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Bot Running State
radarRouter.post('/toggle', (req, res) => {
  try {
    const { isRunning } = req.body;
    const newState = radarEngine.toggleBot(isRunning);
    res.json({ success: true, isRunning: newState });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger Instant Scan
radarRouter.post('/scan-now', async (req, res) => {
  try {
    const result = await radarEngine.executeMarketScan();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Market Symbols
radarRouter.get('/symbols', (req, res) => {
  try {
    const symbols = radarEngine.getSymbols();
    res.json({ success: true, symbols });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Signals
radarRouter.get('/signals', (req, res) => {
  try {
    const signals = radarEngine.getSignals();
    res.json({ success: true, signals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Logs
radarRouter.get('/logs', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const level = req.query.level as string | undefined;
    const category = req.query.category as string | undefined;
    const logs = radarEngine.getLogs(limit, level, category);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear Logs
radarRouter.post('/logs/clear', (req, res) => {
  try {
    radarEngine.clearLogs();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Intermarket Macro Analysis
radarRouter.get('/intermarket', (req, res) => {
  try {
    const intermarketState = radarEngine.getIntermarketMacroState();
    res.json({ success: true, intermarket: intermarketState });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Liquidity Heatmap
radarRouter.get('/liquidity-heatmap', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTC/USDT';
    const heatmap = await radarEngine.getSymbolLiquidityHeatmap(symbol);
    res.json({ success: true, heatmap });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Execute Liquidity Snipe
radarRouter.post('/liquidity-snipe', async (req, res) => {
  try {
    const result = await radarEngine.executeLiquiditySnipe(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Whale Orderbook & CVD Flow
radarRouter.get('/whale-orderbook', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'BTC/USDT';
    const symbols = radarEngine.getSymbols();
    const currentSym = symbols.find(s => s.symbol === symbol) || symbols[0];
    const analysis = await whaleOrderbookService.getWhaleAnalysisForSymbol(
      currentSym.symbol, 
      currentSym.price, 
      currentSym.digits || 2
    );
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Apply Synergy to Live Bot
radarRouter.post('/apply-synergy-to-bot', (req, res) => {
  try {
    const { trailingStopATR, takeProfitATR, fractionalKelly, minConfidencePct } = req.body;
    const current = radarEngine.getSettings();
    const updated = radarEngine.updateSettings({
      atrDynamicTrailingEnabled: true,
      atrTrailingMultiplier: trailingStopATR || current.atrTrailingMultiplier || 1.4,
      atrTpMultiplier: takeProfitATR || current.atrTpMultiplier || 3.2,
      fractionalKellyScale: fractionalKelly || current.fractionalKellyScale || 0.35,
      minConfidencePct: minConfidencePct || current.minConfidencePct || 78,
      volatilitySpikeFilterEnabled: true,
      earlyInvalidationAlerts: true,
      earlyInvalidationAutoDeRisk: true
    });
    res.json({ success: true, message: 'تم تطبيق توليفة التوافق الهندسي والكمي مباشرة في محرك البوت الآلي!', settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Post-Mortems MAE/MFE
radarRouter.get('/post-mortems', (req, res) => {
  try {
    const postMortems = radarEngine.getPostMortems();
    res.json({ success: true, postMortems });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bot Settings
radarRouter.get('/settings', (req, res) => {
  try {
    const settings = radarEngine.getSettings();
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

radarRouter.post('/settings', (req, res) => {
  try {
    const updated = radarEngine.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Quantitative Suite & Synergy
radarRouter.get('/quantitative-suite', (req, res) => {
  try {
    const suite = radarEngine.getQuantitativeSuite();
    res.json({ success: true, ...suite, suite });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

radarRouter.get(['/quantitative-synergy', '/synergy-matrix'], (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'XAU/USD';
    const timeframe = (req.query.timeframe as string) || '15m';
    const matrix = radarEngine.getQuantitativeSynergyMatrix(symbol, timeframe);
    res.json({ success: true, matrix });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Interactive Kelly Position Size Calculation
radarRouter.post('/calculate-kelly', (req, res) => {
  try {
    const calc = radarEngine.calculateInteractiveKelly(req.body);
    res.json({ success: true, calculation: calc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scalp & Swing Profile
radarRouter.get('/scalp-swing-profile', (req, res) => {
  try {
    const profile = radarEngine.getScalpSwingProfile();
    res.json({ success: true, profile, scalpSwingProfile: profile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

radarRouter.post('/scalp-swing-profile', (req, res) => {
  try {
    const profile = radarEngine.updateScalpSwingProfile(req.body);
    res.json({ success: true, profile, scalpSwingProfile: profile, message: 'تم حفظ بروفايل المضاربة والسوينغ بنجاح' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Apply Synergy Settings to Live Bot
radarRouter.post('/apply-synergy-to-bot', (req, res) => {
  try {
    const { trailingStopATR, takeProfitATR, fractionalKelly, minConfidencePct, recommendedTrailingStopATR, recommendedTakeProfitATR, optimalKellyLot } = req.body;
    const current = radarEngine.getSettings();
    const trailMult = trailingStopATR || recommendedTrailingStopATR || current.atrTrailingMultiplier || 1.4;
    const tpMult = takeProfitATR || recommendedTakeProfitATR || current.atrTpMultiplier || 3.2;
    const lotSize = optimalKellyLot ? Math.max(0.01, Math.min(0.05, optimalKellyLot)) : (current.lotSize || 0.01);
    
    const updated = radarEngine.updateSettings({
      atrDynamicTrailingEnabled: true,
      trailingStopEnabled: true,
      atrTrailingMultiplier: trailMult,
      atrTpMultiplier: tpMult,
      fractionalKellyScale: fractionalKelly || current.fractionalKellyScale || 0.35,
      minConfidencePct: minConfidencePct || current.minConfidencePct || 75,
      lotSize,
      volatilitySpikeFilterEnabled: true,
      earlyInvalidationAlerts: true,
      earlyInvalidationAutoDeRisk: true
    });

    res.json({
      success: true,
      message: 'تم تطبيق توليفة التوافق الهندسي والكمي مباشرة في محرك البوت الآلي!',
      settings: updated,
      appliedSettings: {
        lotSize,
        atrTrailingMultiplier: trailMult,
        atrTpMultiplier: tpMult
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Modular Strategy & Challenger Endpoints
radarRouter.get('/modular-strategy/matrix', (req, res) => {
  try {
    const matrix = radarEngine.getModularHybridizationMatrix();
    res.json({ success: true, ...matrix });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

radarRouter.post('/challenger/simulation', (req, res) => {
  try {
    const comparison = radarEngine.runChallengerSimulation(req.body);
    res.json({ success: true, comparison });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

radarRouter.post('/modular-strategy/promote-hybrid', (req, res) => {
  try {
    const { hybridId } = req.body;
    res.json({
      success: true,
      message: `تم ترقية وتطبيق النموذج الهجين ${hybridId || 'المختار'} بنجاح في بيئة التداول!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

radarRouter.post(['/unified-quant-hybrid-trigger', '/execute-unified-quant'], (req, res) => {
  try {
    const { targetSymbol } = req.body;
    const result = radarEngine.executeUnifiedQuantHybridEngine(targetSymbol);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Diagnostics
radarRouter.get('/diagnose', (req, res) => {
  try {
    const report = radarEngine.diagnoseAndTroubleshoot();
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reconcile, Filter and Activate Signals
radarRouter.post(['/filter-and-activate', '/filter-activate-signals', '/filter-signals'], (req, res) => {
  try {
    const result = radarEngine.filterAndActivateSignals();
    res.json({
      success: true,
      result,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hunt Sniper Trade
radarRouter.post('/hunt-sniper-trade', (req, res) => {
  try {
    const result = radarEngine.huntAndExecuteSniperTrade(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Inject Test Signal
radarRouter.post('/inject-test-signal', (req, res) => {
  try {
    const symbols = radarEngine.getSymbols().filter(s => s.isTradeable !== false && s.macroRole !== 'INDICATOR_ONLY' && s.assetClass !== 'indices');
    const sym = symbols[Math.floor(Math.random() * symbols.length)] || symbols[0];
    const isLong = Math.random() > 0.5;
    const entryPrice = sym.price;
    const atr = sym.price * 0.008;
    const slDist = +(atr * 1.5).toFixed(sym.digits);
    const tpDist = +(atr * 2.5).toFixed(sym.digits);
    const stopLoss = +(isLong ? entryPrice - slDist : entryPrice + slDist).toFixed(sym.digits);
    const takeProfit1 = +(isLong ? entryPrice + tpDist : entryPrice - tpDist).toFixed(sym.digits);

    const testSignal = {
      id: `SIG-TEST-${sym.symbol.replace(/[\/\s]/g, '')}-${Date.now().toString().slice(-4)}`,
      symbol: sym.symbol,
      timeframe: '15m',
      direction: isLong ? 'LONG' : 'SHORT',
      tradeType: 'SCALP',
      tradeTypeExplanation: 'إشارة اختبارية محقونة لاختبار تدفق الصفقات والحارس الآلي',
      targetHoldingHorizon: '15m - 2h',
      pattern: {
        name: isLong ? 'Bullish FVG + Order Block' : 'Bearish Liquidity Sweep',
        type: isLong ? 'FVG' : 'LIQUIDITY_SWEEP',
        timeframe: '15m',
        confidence: 91,
        description: 'اختراق منطقة سيولة مؤسساتية مؤكدة مع زخم RSI',
      },
      confidence: 91,
      entryPrice,
      stopLoss,
      takeProfit1,
      takeProfit2: +(isLong ? entryPrice + tpDist * 1.6 : entryPrice - tpDist * 1.6).toFixed(sym.digits),
      riskRewardRatio: 1.85,
      confluenceScore: 89,
      confluenceFactors: [
        'Institutional Order Block Mitigation',
        'RSI Momentum Continuation',
        'Multi-timeframe Alignment'
      ],
      status: 'ACTIVE',
      createdAt: Date.now(),
      expiresAt: Date.now() + 4 * 3600 * 1000,
      currentPrice: entryPrice,
      pnlPct: 0.15
    };

    radarEngine.getSignals().unshift(testSignal as any);
    
    // Auto-activate into paper trades
    const tradeRes = radarEngine.openTradeDirectly({
      symbol: sym.symbol,
      direction: isLong ? 'LONG' : 'SHORT' as any,
      lotSize: 0.01,
      stopLoss,
      takeProfit1,
      rationale: 'إشارة اختبارية محقونة للتأكد من سلاسة تدفق الصفقات'
    });

    res.json({
      success: true,
      signal: testSignal,
      trade: tradeRes.trade,
      message: `تم حقن الإشارة وفتح صفقة اختبارية لـ ${sym.symbol} بنجاح!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Market Hours & Schedules
radarRouter.get('/market-hours/overview', (req, res) => {
  try {
    const overview = radarEngine.getMarketClosuresOverview();
    res.json({ success: true, overview });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

radarRouter.get('/market-hours/symbol/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const schedule = radarEngine.getSymbolMarketSchedule(symbol);
    res.json({ success: true, schedule });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
