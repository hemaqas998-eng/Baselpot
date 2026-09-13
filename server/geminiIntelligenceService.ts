import { GoogleGenAI, Type } from '@google/genai';
import { 
  MarketSymbol, 
  TradeSignal, 
  PaperTrade, 
  IntermarketMacroState, 
  GeminiMarketInsight, 
  GeminiSmartRecommendation, 
  GeminiDynamicLevels,
  ErrorBoundaryDiagnosis 
} from '../src/types.js';
import { generateCandlesForSymbol, computeTechnicalIndicators, computeIntermarketMacroState } from './marketData.js';
import { getSessionKillzoneState } from './quantitativeEngines.js';

let aiClient: GoogleGenAI | null = null;

// Server-side in-memory cache to prevent repeated API calls
const insightCache = new Map<string, { data: GeminiMarketInsight; expiresAt: number }>();
const INSIGHT_CACHE_TTL_MS = 180000; // 3 minutes cache per symbol

// Circuit breaker for API rate limits and quota resets
let geminiRateLimitUntil = 0;

function getGenAI(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiClient;
}

/**
 * Generates Real-Time Market Intelligence, Price Movement Predictions, 
 * Dynamic Support/Resistance Zones, and Smart BUY/SELL Recommendations.
 */
export async function generateGeminiMarketInsight(
  symbolName: string,
  allSymbols: MarketSymbol[],
  openTrades: PaperTrade[],
  recentSignals: TradeSignal[],
  forceRefresh = false
): Promise<GeminiMarketInsight> {
  const sym = allSymbols.find(s => s.symbol === symbolName) || allSymbols[0];
  const timeframe = '15m';
  const candles = generateCandlesForSymbol(sym.symbol, timeframe, 100);
  const indicators = computeTechnicalIndicators(candles);
  const macroState = computeIntermarketMacroState(allSymbols);
  const sessionState = getSessionKillzoneState();

  // Calculate Zero-Loss & Reversal Guard metrics
  const activeProtectedTrades = openTrades.filter(t => t.status === 'OPEN' && (t.trailingStopActive || (t.lockedProfitUSD && t.lockedProfitUSD > 0)));
  const lockedProfitTotalUSD = +openTrades
    .filter(t => t.status === 'OPEN')
    .reduce((sum, t) => sum + (t.lockedProfitUSD || 0), 0)
    .toFixed(2);

  // Compute standard dynamic math levels
  const atr = indicators.atr || (sym.price * 0.008);
  const currentPrice = sym.price;
  const s1 = +(currentPrice - atr * 1.2).toFixed(sym.digits);
  const s2 = +(currentPrice - atr * 2.4).toFixed(sym.digits);
  const r1 = +(currentPrice + atr * 1.2).toFixed(sym.digits);
  const r2 = +(currentPrice + atr * 2.4).toFixed(sym.digits);
  const poc = +(indicators.ema20 || currentPrice).toFixed(sym.digits);

  const fallbackDynamicLevels: GeminiDynamicLevels = {
    support1: s1,
    support2: s2,
    resistance1: r1,
    resistance2: r2,
    poc,
    dynamicRange: `${s2} — ${r2}`
  };

  const now = Date.now();

  // 1. Check in-memory server cache
  if (!forceRefresh) {
    const cached = insightCache.get(sym.symbol);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }
  }

  // 2. Check if currently backing off due to rate limit or quota
  if (now < geminiRateLimitUntil) {
    return generateFallbackInsight(sym, indicators, macroState, sessionState, fallbackDynamicLevels, activeProtectedTrades.length, lockedProfitTotalUSD);
  }

  const ai = getGenAI();

  if (!ai) {
    return generateFallbackInsight(sym, indicators, macroState, sessionState, fallbackDynamicLevels, activeProtectedTrades.length, lockedProfitTotalUSD);
  }

  try {
    const prompt = `
أنت كبير المحللين الكميين وخبير التدفق المؤسسي (Institutional Flow & Quant Strategist).
قم بتحليل بيانات السوق اللحظية لزوج ${sym.symbol} بناءً على البيانات الدقيقة التالية:

بيانات السوق الحية:
- السعر الحالي: ${sym.price} (${sym.change24h > 0 ? '+' : ''}${sym.change24h}%)
- المدى اليومي (High/Low): ${sym.low24h} - ${sym.high24h}
- مؤشر RSI: ${indicators.rsi.toFixed(1)} (${indicators.rsiSignal})
- تقاطع MACD: ${indicators.macd.crossover}
- الاتجاه العام: ${indicators.trend}
- متوسط المدى الحقيقي (ATR): ${atr.toFixed(sym.digits)}
- الجلسة المصرفية الحالية: ${sessionState.sessionNameArabic} (${sessionState.isKillzoneActive ? 'منطقة قنص سيولة نشطة Killzone' : 'جلسة قياسية'})
- حالة مؤشر الدولار (DXY): ${macroState.dxy.price} (${macroState.dxy.trend})
- عوائد السندات الأمريكية 10 سنوات: ${macroState.us10y.yield}% (${macroState.us10y.trend})
- علاقة الأسواق المتقاطعة للذهب/الفوركس: ${macroState.goldMacroBias.explanation}

المطلوب:
1. صياغة ملخص تنفيذي احترافي، بليغ وموجز جداً باللغة العربية حول اتجاه السعر المتوقع ونقاط تجمع السيولة.
2. تحديد الدعم والمقاومة الديناميكية ومستويات POC (Point of Control).
3. تقديم توصية ذكية واضحة (BUY أو SELL أو WAIT) مع حجم لوت مقترح محكم (بين 0.01 و 0.05 فقط لا غير).
4. تحليل التدفق المؤسسي ومصائد السيولة (Liquidity Pools / Retail Traps).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bias: {
              type: Type.STRING,
              enum: ['STRONG_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'STRONG_BEARISH']
            },
            biasScore: { type: Type.INTEGER, description: 'Score between 50 and 99' },
            executiveSummary: { type: Type.STRING, description: 'Executive summary in professional Arabic' },
            dynamicLevels: {
              type: Type.OBJECT,
              properties: {
                support1: { type: Type.NUMBER },
                support2: { type: Type.NUMBER },
                resistance1: { type: Type.NUMBER },
                resistance2: { type: Type.NUMBER },
                poc: { type: Type.NUMBER },
                dynamicRange: { type: Type.STRING }
              },
              required: ['support1', 'support2', 'resistance1', 'resistance2', 'poc', 'dynamicRange']
            },
            orderFlowInsights: {
              type: Type.OBJECT,
              properties: {
                dominantPressure: { type: Type.STRING },
                institutionalFootprint: { type: Type.STRING },
                liquidityPools: { type: Type.STRING },
                retailTraps: { type: Type.STRING }
              },
              required: ['dominantPressure', 'institutionalFootprint', 'liquidityPools', 'retailTraps']
            },
            intermarketContext: {
              type: Type.OBJECT,
              properties: {
                dxyImpact: { type: Type.STRING },
                yieldsImpact: { type: Type.STRING },
                macroConfluence: { type: Type.STRING }
              },
              required: ['dxyImpact', 'yieldsImpact', 'macroConfluence']
            },
            smartRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING, enum: ['BUY', 'SELL', 'WAIT'] },
                  entryZone: { type: Type.STRING },
                  stopLoss: { type: Type.NUMBER },
                  target1: { type: Type.NUMBER },
                  target2: { type: Type.NUMBER },
                  target3: { type: Type.NUMBER },
                  recommendedLot: { type: Type.NUMBER, description: 'Must be between 0.01 and 0.05' },
                  riskRewardRatio: { type: Type.NUMBER },
                  confidencePct: { type: Type.NUMBER },
                  rationale: { type: Type.STRING },
                  source: { type: Type.STRING, enum: ['INTERMARKET_REALTIME', 'ORDER_FLOW', 'FVG_LIQUIDITY'] }
                },
                required: ['action', 'entryZone', 'stopLoss', 'target1', 'target2', 'recommendedLot', 'riskRewardRatio', 'confidencePct', 'rationale', 'source']
              }
            }
          },
          required: ['bias', 'biasScore', 'executiveSummary', 'dynamicLevels', 'orderFlowInsights', 'intermarketContext', 'smartRecommendations']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    // Ensure lot size is strictly capped <= 0.05
    const recs: GeminiSmartRecommendation[] = (parsed.smartRecommendations || []).map((r: any) => ({
      ...r,
      symbol: sym.symbol,
      recommendedLot: +(Math.max(0.01, Math.min(0.05, r.recommendedLot || 0.02))).toFixed(2)
    }));

    const resultInsight: GeminiMarketInsight = {
      symbol: sym.symbol,
      timeframe,
      currentPrice: sym.price,
      bias: parsed.bias || 'BULLISH',
      biasScore: parsed.biasScore || 84,
      executiveSummary: parsed.executiveSummary || `تحليل جيمناي اللحظي يرصد تمركز السيولة المؤسسية على زوج ${sym.symbol} مع زخم اتجاهي متوافق.`,
      dynamicLevels: {
        support1: +(parsed.dynamicLevels?.support1 || s1).toFixed(sym.digits),
        support2: +(parsed.dynamicLevels?.support2 || s2).toFixed(sym.digits),
        resistance1: +(parsed.dynamicLevels?.resistance1 || r1).toFixed(sym.digits),
        resistance2: +(parsed.dynamicLevels?.resistance2 || r2).toFixed(sym.digits),
        poc: +(parsed.dynamicLevels?.poc || poc).toFixed(sym.digits),
        dynamicRange: parsed.dynamicLevels?.dynamicRange || `${s2} — ${r2}`
      },
      orderFlowInsights: parsed.orderFlowInsights || {
        dominantPressure: 'شراء تجميعي في مناطق الفجوات السعرية (FVG)',
        institutionalFootprint: 'امتصاص عروض البيع فوق مستويات الدعم اللحظية',
        liquidityPools: `مناطق سحب السيولة متمركزة حول ${r1}`,
        retailTraps: 'تجنب الدخول مع الاختراقات الوهمية السريعة'
      },
      intermarketContext: parsed.intermarketContext || {
        dxyImpact: `مؤشر الدولار عند ${macroState.dxy.price} (${macroState.dxy.trend})`,
        yieldsImpact: `العوائد عند ${macroState.us10y.yield}%`,
        macroConfluence: macroState.goldMacroBias.explanation
      },
      smartRecommendations: recs.length > 0 ? recs : [
        {
          action: sym.change24h >= 0 ? 'BUY' : 'SELL',
          symbol: sym.symbol,
          entryZone: `${sym.price} ± ${+(atr * 0.15).toFixed(sym.digits)}`,
          stopLoss: +(sym.change24h >= 0 ? sym.price - atr * 1.2 : sym.price + atr * 1.2).toFixed(sym.digits),
          target1: +(sym.change24h >= 0 ? sym.price + atr * 1.8 : sym.price - atr * 1.8).toFixed(sym.digits),
          target2: +(sym.change24h >= 0 ? sym.price + atr * 3.0 : sym.price - atr * 3.0).toFixed(sym.digits),
          recommendedLot: 0.02,
          riskRewardRatio: 2.2,
          confidencePct: 86,
          rationale: `صفقة خوارزمية ذكية متوافقة مع قنص السيولة لجلسة ${sessionState.sessionNameArabic}`,
          source: 'INTERMARKET_REALTIME'
        }
      ],
      zeroLossMetrics: {
        activeProtectedTradesCount: activeProtectedTrades.length,
        lockedProfitTotalUSD,
        averageSecuredR: 1.4
      },
      lastUpdated: Date.now()
    };

    // Store in cache
    insightCache.set(sym.symbol, { data: resultInsight, expiresAt: Date.now() + INSIGHT_CACHE_TTL_MS });

    return resultInsight;
  } catch (err: any) {
    const errString = String(err?.message || err);
    const isRateLimit = err?.status === 429 || err?.code === 429 || errString.includes('429') || errString.includes('quota') || errString.includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      let retrySeconds = 60;
      try {
        const match = errString.match(/retry in ([0-9.]+)s/i);
        if (match && match[1]) {
          retrySeconds = Math.max(15, Math.ceil(parseFloat(match[1])));
        }
      } catch {}
      geminiRateLimitUntil = Date.now() + retrySeconds * 1000;
      console.info(`ℹ️ Gemini quota limit reached for free tier. Seamlessly utilizing quantitative math engine (auto-resumes in ${retrySeconds}s).`);
    } else {
      console.warn('Gemini insight generation fallback engaged:', err?.message || err);
    }

    const fallback = generateFallbackInsight(sym, indicators, macroState, sessionState, fallbackDynamicLevels, activeProtectedTrades.length, lockedProfitTotalUSD);
    // Cache fallback briefly (30s) so we avoid thrashing
    insightCache.set(sym.symbol, { data: fallback, expiresAt: Date.now() + 30000 });
    return fallback;
  }
}

function generateFallbackInsight(
  sym: MarketSymbol,
  indicators: any,
  macroState: IntermarketMacroState,
  sessionState: any,
  dynamicLevels: GeminiDynamicLevels,
  activeProtectedTradesCount: number,
  lockedProfitTotalUSD: number
): GeminiMarketInsight {
  const isBull = indicators.rsi > 50 || indicators.trend.includes('BULLISH');
  const atr = indicators.atr || (sym.price * 0.008);

  // Dynamic Bias Score based on momentum alignment & RSI distance from 50
  const rsiPower = Math.abs(indicators.rsi - 50);
  const trendBonus = indicators.trend.includes('STRONG') ? 8 : (indicators.trend.includes('BULLISH') === isBull ? 4 : 0);
  const sessionBonus = sessionState.isKillzoneActive ? 5 : 0;
  const calculatedBiasScore = Math.min(95, Math.max(60, Math.round(62 + rsiPower * 0.6 + trendBonus + sessionBonus)));

  const stopLossPrice = +(isBull ? sym.price - atr * 1.35 : sym.price + atr * 1.35).toFixed(sym.digits);
  const target1Price = +(isBull ? sym.price + atr * 2.1 : sym.price - atr * 2.1).toFixed(sym.digits);
  const target2Price = +(isBull ? sym.price + atr * 3.4 : sym.price - atr * 3.4).toFixed(sym.digits);
  const calculatedRR = +((Math.abs(target1Price - sym.price) / Math.abs(sym.price - stopLossPrice))).toFixed(2);

  const smartRec: GeminiSmartRecommendation = {
    action: isBull ? 'BUY' : 'SELL',
    symbol: sym.symbol,
    entryZone: `${sym.price}`,
    stopLoss: stopLossPrice,
    target1: target1Price,
    target2: target2Price,
    recommendedLot: 0.01,
    riskRewardRatio: calculatedRR,
    confidencePct: calculatedBiasScore,
    rationale: `تحليل خوارزمي فوري مبني على توازن مؤشرات الـ EMA والـ RSI وجلسة ${sessionState.sessionNameArabic}`,
    source: 'INTERMARKET_REALTIME'
  };

  return {
    symbol: sym.symbol,
    timeframe: '15m',
    currentPrice: sym.price,
    bias: isBull ? 'BULLISH' : 'BEARISH',
    biasScore: calculatedBiasScore,
    executiveSummary: `رصد تدفق سيولة ${isBull ? 'صاعد (Bullish Momentum)' : 'هابط (Bearish Pressure)'} على زوج ${sym.symbol}. مستويات الدعم والمقاومة الديناميكية محسوبة بالـ ATR ونظام حماية الصفقات بالوقف المحكم مفعل لتأمين رأس المال.`,
    dynamicLevels,
    orderFlowInsights: {
      dominantPressure: isBull ? 'ضغط شرائي منتظم من صناع السوق' : 'توزيع عروض بيعية عند القمم',
      institutionalFootprint: `تمركز كتل الأوامر حول مستويات الـ POC (${dynamicLevels.poc})`,
      liquidityPools: `تجمعات سيولة الإيقاف فوق المقاومة ${dynamicLevels.resistance1}`,
      retailTraps: 'الحذر من الارتداد السريع عند ملامسة المستويات اليومية القصوى'
    },
    intermarketContext: {
      dxyImpact: `مؤشر الدولار: ${macroState.dxy.price} (${macroState.dxy.trend})`,
      yieldsImpact: `عوائد السندات: ${macroState.us10y.yield}%`,
      macroConfluence: macroState.goldMacroBias.explanation
    },
    smartRecommendations: [smartRec],
    zeroLossMetrics: {
      activeProtectedTradesCount,
      lockedProfitTotalUSD,
      averageSecuredR: 1.3
    },
    lastUpdated: Date.now()
  };
}

/**
 * Diagnostic Service for ErrorBoundary:
 * Sends error details to Gemini API to analyze root cause and provide automated recovery solutions.
 */
export async function diagnoseErrorWithGemini(
  errorMessage: string,
  errorStack?: string,
  componentStack?: string
): Promise<ErrorBoundaryDiagnosis> {
  const timestamp = Date.now();

  if (Date.now() < geminiRateLimitUntil) {
    return {
      errorName: 'Client/Runtime Exception',
      errorMessage: errorMessage || 'Unknown Error',
      componentStack,
      rootCauseAnalysis: 'تم رصد استثناء في مكونات الواجهة. نظام العزل قام بحماية الاتصال الحي بالبوت.',
      suggestedCodeFix: '// تحقق من تهيئة الحالة الأولية والتحقق من وجود القيم قبل القراءة\nconst safeValue = data?.field ?? fallbackValue;',
      autoRecoveryAvailable: true,
      recoverySteps: [
        'إعادة تعيين الحالة الداخلية للمكون',
        'مزامنة البيانات الحية من الخادم',
        'تأكيد تشغيل نظام الأمان التلقائي'
      ],
      timestamp
    };
  }

  const ai = getGenAI();

  if (!ai) {
    return {
      errorName: 'Client/Runtime Exception',
      errorMessage: errorMessage || 'Unknown Error',
      componentStack,
      rootCauseAnalysis: 'تم رصد استثناء في مكونات الواجهة. نظام العزل قام بحماية الاتصال الحي بالبوت.',
      suggestedCodeFix: '// تحقق من تهيئة الحالة الأولية والتحقق من وجود القيم قبل القراءة\nconst safeValue = data?.field ?? fallbackValue;',
      autoRecoveryAvailable: true,
      recoverySteps: [
        'إعادة تعيين الحالة الداخلية للمكون',
        'مزامنة البيانات الحية من الخادم',
        'تأكيد تشغيل نظام الأمان التلقائي'
      ],
      timestamp
    };
  }

  try {
    const prompt = `
أنت مهندس برمجيات ونظم تداول خبير في React 18 و TypeScript.
حدث خطأ استثنائي داخل تطبيق منصة التداول الآلي، وإليك التفاصيل الفنية:

رسالة الخطأ (Error Message):
${errorMessage}

تتبع المكدس (Error Stack):
${errorStack || 'N/A'}

مكدس المكونات (Component Stack):
${componentStack || 'N/A'}

المطلوب:
1. تشخيص السبب الجذري للخطأ بدقة واختصار باللغة العربية.
2. اقتراح الكود النموذجي للإصلاح (Code snippet).
3. تقديم خطوات استعادة التشغيل التلقائي.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            errorName: { type: Type.STRING },
            rootCauseAnalysis: { type: Type.STRING, description: 'Technical root cause explanation in Arabic' },
            suggestedCodeFix: { type: Type.STRING, description: 'Code snippet to fix the issue' },
            autoRecoveryAvailable: { type: Type.BOOLEAN },
            recoverySteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['errorName', 'rootCauseAnalysis', 'suggestedCodeFix', 'autoRecoveryAvailable', 'recoverySteps']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    return {
      errorName: parsed.errorName || 'React Exception Caught',
      errorMessage,
      componentStack,
      rootCauseAnalysis: parsed.rootCauseAnalysis || 'خطأ في معالجة البيانات اللحظية أثناء تصيير المكون.',
      suggestedCodeFix: parsed.suggestedCodeFix || '// Safe optional chaining:\nconst val = obj?.prop ?? default;',
      autoRecoveryAvailable: parsed.autoRecoveryAvailable ?? true,
      recoverySteps: parsed.recoverySteps || ['إعادة ضبط الحالة للمكون', 'إعادة جلب البيانات الحية'],
      timestamp
    };
  } catch (err: any) {
    const errString = String(err?.message || err);
    if (err?.status === 429 || err?.code === 429 || errString.includes('429') || errString.includes('quota') || errString.includes('RESOURCE_EXHAUSTED')) {
      geminiRateLimitUntil = Date.now() + 60000;
      console.info('ℹ️ Gemini quota reached during error diagnosis. Using offline diagnostic template.');
    } else {
      console.warn('Error diagnosing with Gemini:', err?.message || err);
    }
    return {
      errorName: 'Diagnostic Exception',
      errorMessage,
      componentStack,
      rootCauseAnalysis: 'تعذر تشخيص الخطأ عبر الذكاء الاصطناعي بسبب استهلاك الحصة اليومية أو انقطاع الشبكة، وتم عزل الخطأ بنجاح.',
      suggestedCodeFix: '// Safe state reset\nsetState({ hasError: false });',
      autoRecoveryAvailable: true,
      recoverySteps: ['إعادة تحميل حالة المكون بالضغط على زر الاستعادة'],
      timestamp
    };
  }
}
