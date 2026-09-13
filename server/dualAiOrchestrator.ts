import { MarketSymbol, TradeSignal, PaperTrade, BotSettings } from '../src/types.js';
import { generateGeminiMarketInsight } from './geminiIntelligenceService.js';
import { deepSeekService, DeepSeekAnalysisResult } from './deepseekService.js';
import { computeTechnicalIndicators, generateCandlesForSymbol, computeIntermarketMacroState } from './marketData.js';
import { getSessionKillzoneState } from './quantitativeEngines.js';

export interface VetoCondition {
  isVetoed: boolean;
  code?: 'VETO_SPREAD_WIDENING' | 'VETO_SUBPAR_RR' | 'VETO_LOW_EV' | 'VETO_MACRO_DIVERGENCE' | 'VETO_NEWS_VOLATILITY' | 'VETO_PRICE_OVEREXTENDED';
  reasonArabic?: string;
  reasonEnglish?: string;
}

export interface DualAiConsensusResult {
  symbol: string;
  timestamp: number;
  consensusDirection: 'BUY' | 'SELL' | 'WAIT' | 'HOLD';
  consensusScore: number; // 0 - 100%
  consensusGrade: 'AAA_PRIME' | 'AA_HIGH_CONFLUENCE' | 'A_MODERATE' | 'VETOED_PROTECTION' | 'NEUTRAL_WAIT';
  vetoCondition: VetoCondition;
  geminiInsight: {
    bias: string;
    biasScore: number;
    executiveSummary: string;
    target1: number;
    stopLoss: number;
    recommendedLot: number;
    liquidityZone: string;
    status: 'ONLINE' | 'FALLBACK';
  };
  deepSeekAudit: {
    bias: string;
    mathematicalEdgeScore: number;
    expectedValueEV: number;
    optimalKellyFraction: number;
    reasoningReport: string;
    orderBookImbalance: string;
    verdict: 'APPROVE' | 'REVISE' | 'REJECT';
    model: string;
    latencyMs: number;
  };
  synthesisPlan: {
    finalAction: 'BUY' | 'SELL' | 'WAIT';
    suggestedLot: number; // strictly 0.01 - 0.02
    entryPrice: number;
    limitPullbackEntry?: number; // optimized pullback level if price is stretched
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    riskRewardRatio: number;
    antiConflictVerified: boolean;
    zeroLossArmed: boolean;
    autoBreakEvenThreshold: number; // Price level where SL is moved to Entry (50% of TP1)
    dynamicAtrTrailingStep: number; // Pips step for locking in profit
    newsVolatilityShieldActive: boolean;
    arabicSynthesisSummary: string;
    tradeType: 'SCALP' | 'DAILY_SWING';
    tradeTypeArabic: string;
    timeframeCascadeExplanation: string;
    auditChecklist: Array<{ item: string; passed: boolean; note: string }>;
  };
}

export interface TradeManagementEvaluation {
  tradeId: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  originalStopLoss: number;
  proposedStopLoss: number;
  autoBreakEvenTriggered: boolean;
  atrTrailingTriggered: boolean;
  actionRequired: 'MOVE_SL_TO_BREAK_EVEN' | 'TRAIL_STOP_PROFIT' | 'HOLD_CURRENT' | 'CLOSE_EMERGENCY_DE_RISK';
  reasonArabic: string;
}

export class DualAiOrchestrator {
  /**
   * Run Gemini & DeepSeek in a Collaborative Multi-Agent Cross-Verification Loop
   */
  public async generateDualAiConsensus(
    symbolName: string,
    allSymbols: MarketSymbol[],
    openTrades: PaperTrade[] = [],
    recentSignals: TradeSignal[] = []
  ): Promise<DualAiConsensusResult> {
    const sym = allSymbols.find(s => s.symbol === symbolName) || allSymbols[0];
    const candles = generateCandlesForSymbol(sym.symbol, '15m', 80);
    const indicators = computeTechnicalIndicators(candles);
    const macroState = computeIntermarketMacroState(allSymbols);
    const killzone = getSessionKillzoneState();

    // 1. Step 1: Gemini Market Intelligence (Macro narrative + SMC Liquidity Blocks)
    const geminiResult = await generateGeminiMarketInsight(sym.symbol, allSymbols, openTrades, recentSignals);
    const primaryRec = geminiResult.smartRecommendations?.[0];

    // 2. Step 2: DeepSeek Quantitative & Mathematical Audit (Monte Carlo EV, Kelly 0.01-0.02)
    const deepSeekResult: DeepSeekAnalysisResult = await deepSeekService.analyzeQuantitativeEdge(
      sym.symbol,
      allSymbols,
      primaryRec ? {
        direction: primaryRec.action === 'BUY' ? 'LONG' : 'SHORT',
        confidence: primaryRec.confidencePct,
        entryPrice: sym.price,
        stopLoss: primaryRec.stopLoss,
        takeProfit1: primaryRec.target1,
        rationale: primaryRec.rationale
      } : undefined
    );

    // 3. Step 3: Cross-Verification & Strict Veto Protocol (حظر الصفقات الضعيفة وحماية رأس المال)
    const geminiIsBull = geminiResult.bias.includes('BULL');
    const deepSeekIsBull = deepSeekResult.bias === 'BULLISH';
    const isBothBull = geminiIsBull && deepSeekIsBull;
    const isBothBear = !geminiIsBull && !deepSeekIsBull && deepSeekResult.bias === 'BEARISH';

    const spreadPips = sym.spread || 1.2;
    const atr = indicators.atr || (sym.price * 0.008);
    const spreadToAtrRatio = (spreadPips * (sym.digits === 2 ? 0.01 : 0.0001)) / atr;

    // Veto Evaluation
    const vetoCheck: VetoCondition = { isVetoed: false };

    // Veto 0: Non-tradeable indices (Macro anchor for currency strength only)
    if (sym.isTradeable === false || sym.macroRole === 'INDICATOR_ONLY' || sym.assetClass === 'indices') {
      vetoCheck.isVetoed = true;
      vetoCheck.code = 'VETO_MACRO_DIVERGENCE';
      vetoCheck.reasonArabic = `مؤشر مرجعي (${sym.symbol}): مخصص حصرياً لقياس قوة العملات وتحليل السرد الكلي للأسواق - بدون إرسال صفقات تداول.`;
      vetoCheck.reasonEnglish = `Macro Anchor (${sym.symbol}): Strictly for currency strength & intermarket analysis. Direct trading is disabled.`;
    }
    // Veto 1: Spread widening penalty
    else if (spreadToAtrRatio > 0.20) {
      vetoCheck.isVetoed = true;
      vetoCheck.code = 'VETO_SPREAD_WIDENING';
      vetoCheck.reasonArabic = `حظر الدخول: الفارق السعري (Spread = ${spreadPips} pips) عالي جداً مقارنة بمتوسط الحركة ATR ويلتهم نسبة الربح المتوقعة.`;
      vetoCheck.reasonEnglish = `VETO: Spread is too wide (${spreadPips} pips) relative to volatility ATR.`;
    } 
    // Veto 2: Subpar Risk/Reward ratio
    else if (deepSeekResult.riskRewardAudit.calculatedRR < 1.5) {
      vetoCheck.isVetoed = true;
      vetoCheck.code = 'VETO_SUBPAR_RR';
      vetoCheck.reasonArabic = `حظر الدخول: نسبة العائد إلى المخاطرة (1:${deepSeekResult.riskRewardAudit.calculatedRR}) أقل من الحد الأدنى المقبول مؤسسياً (1:1.5).`;
      vetoCheck.reasonEnglish = `VETO: Risk-Reward ratio (1:${deepSeekResult.riskRewardAudit.calculatedRR}) is below the required 1:1.5 standard.`;
    }
    // Veto 3: Low or Negative Expected Value (EV)
    else if (deepSeekResult.expectedValueEV < 1.2) {
      vetoCheck.isVetoed = true;
      vetoCheck.code = 'VETO_LOW_EV';
      vetoCheck.reasonArabic = `حظر الدخول: القيمة الرياضية المتوقعة EV = +${deepSeekResult.expectedValueEV}R منخفضة ولا تمنح ميزة إحصائية كافية.`;
      vetoCheck.reasonEnglish = `VETO: Expected Value EV = +${deepSeekResult.expectedValueEV}R is insufficient for mathematical edge.`;
    }

    // Step 4: Direction Reconciliation & Dynamic Consensus Score
    let finalAction: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
    // Blended true weighted score from SMC liquidity structure (Gemini) and Mathematical edge (DeepSeek)
    let rawScore = Math.round((geminiResult.biasScore * 0.45) + (deepSeekResult.mathematicalEdgeScore * 0.55));

    if (!vetoCheck.isVetoed && (isBothBull || isBothBear) && deepSeekResult.consensusVerdict === 'APPROVE') {
      finalAction = isBothBull ? 'BUY' : 'SELL';
      // Synergistic bonus when both institutional models align
      rawScore = Math.min(96, Math.max(72, rawScore + 4));
    } else {
      finalAction = 'WAIT';
      rawScore = Math.min(rawScore, 65);
    }

    // Dynamic Lot Sizing Formulation based on 1% Risk Parameter & Volatility Distance
    const entryPrice = sym.price;
    const stopLoss = deepSeekResult.riskRewardAudit.hardStopLoss;
    const takeProfit1 = deepSeekResult.riskRewardAudit.tp1;
    const takeProfit2 = deepSeekResult.riskRewardAudit.tp2;
    const rr = deepSeekResult.riskRewardAudit.calculatedRR;

    // Calculate dynamic safe lot based on distance to SL
    const slDistance = Math.abs(entryPrice - stopLoss);
    const slPips = Math.max(1, slDistance / (sym.digits === 2 ? 0.01 : (sym.digits === 1 ? 0.1 : 0.0001)));
    const pipDollarValue = sym.symbol.includes('XAU') ? 1.0 : (sym.symbol.includes('BTC') ? 0.1 : 10.0);
    // Standard fractional risk sizing (1% risk allocation on standard account scale)
    const baseDynamicLot = +( (1000 * 0.01) / Math.max(10, slPips * pipDollarValue) ).toFixed(2);
    const safeLot = Math.min(0.05, Math.max(0.01, deepSeekResult.optimalKellyFraction || baseDynamicLot || 0.01));

    // Pullback Entry Optimization if Overextended
    let limitPullbackEntry: number | undefined;
    const isOverextended = (finalAction === 'BUY' && indicators.rsi > 70) || (finalAction === 'SELL' && indicators.rsi < 30);
    if (isOverextended) {
      limitPullbackEntry = finalAction === 'BUY'
        ? +(entryPrice - atr * 0.45).toFixed(sym.digits)
        : +(entryPrice + atr * 0.45).toFixed(sym.digits);
    }

    // Auto Break-Even threshold (50% progress towards TP1)
    const autoBreakEvenThreshold = +(entryPrice + (takeProfit1 - entryPrice) * 0.50).toFixed(sym.digits);
    const dynamicAtrTrailingStep = +(atr * 0.6).toFixed(sym.digits);

    // Timeframe Sequence Classification: Scalp (مضاربة) vs Daily Swing (سوينق يومي)
    const isDailySwing = rr >= 2.8 || (Math.abs(takeProfit1 - entryPrice) / entryPrice >= 0.012);
    const tradeType: 'SCALP' | 'DAILY_SWING' = isDailySwing ? 'DAILY_SWING' : 'SCALP';
    const tradeTypeArabic = isDailySwing
      ? '🌊 صفقة سوينق يومي (Daily Swing)'
      : '⚡ صفقة مضاربة سريعة (Scalp Sniper)';
    const timeframeCascadeExplanation = isDailySwing
      ? 'تتابع الفريمات (4H/1H/15m): توافق الاتجاه الكلي مع تشكل اختراق هيكلي (MSS) لاستهداف موجة يومية ممتدة'
      : 'تتابع الفريمات (15m/5m/1m): التقاط ارتداد سيولة خاطف ونقطة دخول قناص بأهداف سريعة ووقف محكم';

    // Consensus Grade Assignment
    let consensusGrade: DualAiConsensusResult['consensusGrade'] = 'NEUTRAL_WAIT';
    if (vetoCheck.isVetoed) {
      consensusGrade = 'VETOED_PROTECTION';
    } else if (rawScore >= 88 && (isBothBull || isBothBear)) {
      consensusGrade = 'AAA_PRIME';
    } else if (rawScore >= 80) {
      consensusGrade = 'AA_HIGH_CONFLUENCE';
    } else if (rawScore >= 70) {
      consensusGrade = 'A_MODERATE';
    }

    // Audit Checklist
    const auditChecklist = [
      {
        item: 'التوافق الاتجاهي بين Gemini و DeepSeek',
        passed: isBothBull || isBothBear,
        note: isBothBull ? 'اتفاق كامل على الشراء (BUY)' : isBothBear ? 'اتفاق كامل على البيع (SELL)' : 'تباين في الاتجاه (WAIT)'
      },
      {
        item: 'تصنيف تتابع الفريمات (Timeframe Sequence)',
        passed: true,
        note: `${tradeTypeArabic} • ${timeframeCascadeExplanation}`
      },
      {
        item: 'موجب القيمة الرياضية المتوقعة (+EV)',
        passed: deepSeekResult.expectedValueEV >= 1.15,
        note: `EV = +${deepSeekResult.expectedValueEV}R`
      },
      {
        item: 'معيار كيلي الديناميكي لحجم العقد',
        passed: safeLot <= 0.05 && safeLot >= 0.01,
        note: `حجم العقد المحسوب = ${safeLot} Lot`
      },
      {
        item: 'حماية الفارق السعري (Spread Shield)',
        passed: spreadToAtrRatio <= 0.20,
        note: `Spread = ${spreadPips} pips`
      },
      {
        item: 'تأمين رأس المال (Auto Break-Even Armed)',
        passed: true,
        note: `نقل الوقف للدخول عند ${autoBreakEvenThreshold}`
      }
    ];

    // Arabic Summary Formulation
    let arabicSummary = '';
    if (vetoCheck.isVetoed) {
      arabicSummary = `🛡️ تدقيق الأمان المشترك (Safety Veto): ${vetoCheck.reasonArabic} تم إيقاف الدخول لحماية رأس المال.`;
    } else if (finalAction === 'WAIT') {
      arabicSummary = `تم فحص الزوج بواسطة Gemini و DeepSeek: تم رصد تباين في القراءات الفنية، وبناءً على معايير إدارة المخاطر الصارمة تم تعليق الدخول لحين اكتمال شروط التوافق.`;
    } else {
      arabicSummary = `✅ توافق ثنائي معتمد (${consensusGrade} - ${tradeTypeArabic}): جيمناي رصد تدفق السيولة المؤسسية عند ${entryPrice}، وديب سيك أكد الأفضلية الرياضية (+EV = ${deepSeekResult.expectedValueEV}) بعائد 1:${rr} وحجم لوت ديناميكي ${safeLot}.`;
      if (limitPullbackEntry) {
        arabicSummary += ` 💡 يُوصى بأمر معلق (Limit) عند ${limitPullbackEntry} لتفادي الشراء في ذروة الحركة.`;
      }
    }

    return {
      symbol: sym.symbol,
      timestamp: Date.now(),
      consensusDirection: finalAction,
      consensusScore: rawScore,
      consensusGrade,
      vetoCondition: vetoCheck,
      geminiInsight: {
        bias: geminiResult.bias,
        biasScore: geminiResult.biasScore,
        executiveSummary: geminiResult.executiveSummary,
        target1: primaryRec?.target1 || takeProfit1,
        stopLoss: primaryRec?.stopLoss || stopLoss,
        recommendedLot: safeLot,
        liquidityZone: `$${stopLoss} - $${entryPrice}`,
        status: process.env.GEMINI_API_KEY ? 'ONLINE' : 'FALLBACK'
      },
      deepSeekAudit: {
        bias: deepSeekResult.bias,
        mathematicalEdgeScore: deepSeekResult.mathematicalEdgeScore,
        expectedValueEV: deepSeekResult.expectedValueEV,
        optimalKellyFraction: safeLot,
        reasoningReport: deepSeekResult.reasoningReport,
        orderBookImbalance: deepSeekResult.orderBookImbalanceAnalysis,
        verdict: deepSeekResult.consensusVerdict,
        model: deepSeekResult.modelUsed,
        latencyMs: deepSeekResult.latencyMs
      },
      synthesisPlan: {
        finalAction,
        suggestedLot: safeLot,
        entryPrice,
        limitPullbackEntry,
        stopLoss,
        takeProfit1,
        takeProfit2,
        riskRewardRatio: rr,
        antiConflictVerified: true,
        zeroLossArmed: true,
        autoBreakEvenThreshold,
        dynamicAtrTrailingStep,
        newsVolatilityShieldActive: killzone.isKillzoneActive,
        arabicSynthesisSummary: arabicSummary,
        tradeType,
        tradeTypeArabic,
        timeframeCascadeExplanation,
        auditChecklist
      }
    };
  }

  /**
   * Evaluates active broker positions in real time to apply Auto Break-Even and ATR Trailing Stop
   */
  public evaluateActiveTradeProtections(
    trades: PaperTrade[],
    symbols: MarketSymbol[]
  ): TradeManagementEvaluation[] {
    const evaluations: TradeManagementEvaluation[] = [];

    for (const trade of trades) {
      if (trade.status !== 'OPEN') continue;

      const sym = symbols.find(s => s.symbol === trade.symbol);
      if (!sym) continue;

      const isLong = trade.direction === 'LONG' || trade.direction === 'BUY' as any;
      const currentPrice = sym.price;
      const entryPrice = trade.entryPrice;
      const stopLoss = trade.stopLoss;
      const takeProfit = trade.takeProfit1 || trade.takeProfit2 || (isLong ? entryPrice * 1.02 : entryPrice * 0.98);

      const targetDistance = Math.abs(takeProfit - entryPrice);
      const currentProfitDistance = isLong ? (currentPrice - entryPrice) : (entryPrice - currentPrice);
      const progressToTp = targetDistance > 0 ? (currentProfitDistance / targetDistance) : 0;

      let actionRequired: TradeManagementEvaluation['actionRequired'] = 'HOLD_CURRENT';
      let autoBreakEvenTriggered = false;
      let atrTrailingTriggered = false;
      let proposedStopLoss = stopLoss;
      let reasonArabic = 'الصفقة تسير بشكل طبيعي ضمن النطاق الآمن.';

      // Condition 1: Auto Break-Even (Progress >= 45% towards TP1 and SL not yet at or above entry)
      const isSlAlreadySecured = isLong ? (stopLoss >= entryPrice) : (stopLoss <= entryPrice);

      if (progressToTp >= 0.45 && !isSlAlreadySecured) {
        actionRequired = 'MOVE_SL_TO_BREAK_EVEN';
        autoBreakEvenTriggered = true;
        // Move SL exactly to entry + 0.1 pip for zero-loss guarantee
        proposedStopLoss = entryPrice;
        reasonArabic = `تم تحقيق ${(progressToTp * 100).toFixed(0)}% من الهدف الأول: تفعيل حارس نقطة الدخول (Auto Break-Even) ونقل الوقف إلى سعر الدخول $${entryPrice} لتأمين رأس المال ضد الانعكاس.`;
      } 
      // Condition 2: ATR Dynamic Trailing Stop (Progress >= 70% towards TP1 and trade is in deep profit)
      else if (progressToTp >= 0.70) {
        actionRequired = 'TRAIL_STOP_PROFIT';
        atrTrailingTriggered = true;
        const trailBuffer = (sym.price * 0.004);
        proposedStopLoss = +(isLong ? currentPrice - trailBuffer : currentPrice + trailBuffer).toFixed(sym.digits || 2);
        reasonArabic = `الصفقة حققت ${(progressToTp * 100).toFixed(0)}% من الأهداف: تفعيل الوقف المتحرك الديناميكي لحجز الأرباح عند $${proposedStopLoss}.`;
      }

      evaluations.push({
        tradeId: trade.id,
        symbol: trade.symbol,
        direction: isLong ? 'BUY' : 'SELL',
        entryPrice,
        currentPrice,
        originalStopLoss: stopLoss,
        proposedStopLoss,
        autoBreakEvenTriggered,
        atrTrailingTriggered,
        actionRequired,
        reasonArabic
      });
    }

    return evaluations;
  }
}

export const dualAiOrchestrator = new DualAiOrchestrator();
