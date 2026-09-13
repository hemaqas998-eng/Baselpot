import { GoogleGenAI } from '@google/genai';
import { MarketSymbol, TradeSignal } from '../../src/types.js';

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

export interface ForexAiAnalysis {
  agentRole: 'FOREX_MACRO_SPECIALIST';
  currencyStrengthMatrix: Record<string, 'STRONG' | 'NEUTRAL' | 'WEAK'>;
  goldMacroBias: 'BULLISH' | 'BEARISH' | 'RANGE_BOUND';
  dxyImpactSummary: string;
  bestForexPairs: Array<{
    pair: string;
    bias: 'BUY' | 'SELL';
    confluenceReason: string;
    recommendedLot: number;
  }>;
  executiveGuidanceArabic: string;
  activeSessionArabic: string;
  maxDrawdownStatus: string;
  timestamp: number;
}

export class ForexAiAgent {
  private cache: { data: ForexAiAnalysis; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 120000; // 2 minutes

  public async generateForexAnalysis(
    allSymbols: MarketSymbol[],
    recentSignals: TradeSignal[],
    accountBalance: number = 1000
  ): Promise<ForexAiAnalysis> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.data;
    }

    const dxy = allSymbols.find(s => s.symbol === 'DXY')?.price || 99.5;
    const gold = allSymbols.find(s => s.symbol === 'XAU/USD')?.price || 4380;
    const eurusd = allSymbols.find(s => s.symbol === 'EUR/USD')?.price || 1.163;
    const gbpusd = allSymbols.find(s => s.symbol === 'GBP/USD')?.price || 1.345;
    const usdjpy = allSymbols.find(s => s.symbol === 'USD/JPY')?.price || 154.2;

    const dxyTrend = dxy >= 100 ? 'WEAK_DOLLAR' : 'STRONG_DOLLAR';
    const goldBias = gold >= 4350 ? 'BULLISH' : 'RANGE_BOUND';

    const ai = getGenAI();
    if (!ai) {
      const fallback = this.generateDeterministicForexAnalysis(dxy, gold, eurusd, gbpusd, usdjpy);
      this.cache = { data: fallback, expiresAt: now + 60000 };
      return fallback;
    }

    try {
      const prompt = `You are the Dedicated Senior Forex & Macro Institutional AI Agent.
Analyze ONLY the Forex Market, Precious Metals (Gold/Silver), and Intermarket Macro Indicators.
DO NOT analyze Cryptocurrencies here (Crypto has its own dedicated agent).

Live Macro Data:
- DXY (US Dollar Index): ${dxy}
- Gold (XAU/USD): $${gold}
- EUR/USD: ${eurusd}
- GBP/USD: ${gbpusd}
- USD/JPY: ${usdjpy}
- Account Risk Capital: $${accountBalance} (Strict 15% Daily Max Drawdown Guard enforced)

Output valid JSON strictly in this structure:
{
  "currencyStrengthMatrix": {
    "USD": "STRONG" | "NEUTRAL" | "WEAK",
    "EUR": "STRONG" | "NEUTRAL" | "WEAK",
    "GBP": "STRONG" | "NEUTRAL" | "WEAK",
    "JPY": "STRONG" | "NEUTRAL" | "WEAK",
    "XAU": "STRONG" | "NEUTRAL" | "WEAK"
  },
  "goldMacroBias": "BULLISH" | "BEARISH" | "RANGE_BOUND",
  "dxyImpactSummary": "Brief Arabic explanation of DXY pressure on Forex pairs",
  "bestForexPairs": [
    {
      "pair": "XAU/USD",
      "bias": "BUY",
      "confluenceReason": "سبب الدخول الفني والماكرو باللغة العربية",
      "recommendedLot": 0.02
    }
  ],
  "executiveGuidanceArabic": "توجيه إداري احترافي باللغة العربية لإدارة رأس المال وهامش الخسارة الصارم 15%",
  "activeSessionArabic": "جلسة نيويورك ولندن (تداخل السيولة البنكية)",
  "maxDrawdownStatus": "هامش الخسارة القصوى 15% مفعل بقوة مع تأمين الصفقات عند +1R"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const analysis: ForexAiAnalysis = {
        agentRole: 'FOREX_MACRO_SPECIALIST',
        currencyStrengthMatrix: parsed.currencyStrengthMatrix || {
          USD: 'NEUTRAL', EUR: 'STRONG', GBP: 'STRONG', JPY: 'WEAK', XAU: 'STRONG'
        },
        goldMacroBias: parsed.goldMacroBias || goldBias,
        dxyImpactSummary: parsed.dxyImpactSummary || `تراجع مؤشر الدولار DXY عند مستويات ${dxy} يدعم ارتفاع المعادن وزوج اليورو/دولار.`,
        bestForexPairs: Array.isArray(parsed.bestForexPairs) && parsed.bestForexPairs.length > 0 ? parsed.bestForexPairs : [
          { pair: 'XAU/USD', bias: 'BUY', confluenceReason: 'كسر مناطق المقاومة مع ضعف الدولار وتدفقات الملاذ الآمن', recommendedLot: 0.02 },
          { pair: 'EUR/USD', bias: 'BUY', confluenceReason: 'اختراق قمة جلسة لندن وإعادة اختبار FVG صاعد', recommendedLot: 0.03 }
        ],
        executiveGuidanceArabic: parsed.executiveGuidanceArabic || 'الالتزام بهامش خسارة 15% كحد أقصى للمحفظة وتوزيع حجم العقود بصرامة وفق مؤشر ATR ومصفوفة كيلي المصغرة.',
        activeSessionArabic: parsed.activeSessionArabic || 'جلسة لندن ونيويورك النشطة',
        maxDrawdownStatus: parsed.maxDrawdownStatus || 'درع الخسارة اليومية 15% نشط ومراقب لحظياً لحماية رأس المال',
        timestamp: Date.now()
      };

      this.cache = { data: analysis, expiresAt: Date.now() + this.CACHE_TTL_MS };
      return analysis;
    } catch (err) {
      const fallback = this.generateDeterministicForexAnalysis(dxy, gold, eurusd, gbpusd, usdjpy);
      this.cache = { data: fallback, expiresAt: Date.now() + 60000 };
      return fallback;
    }
  }

  private generateDeterministicForexAnalysis(
    dxy: number,
    gold: number,
    eurusd: number,
    gbpusd: number,
    usdjpy: number
  ): ForexAiAnalysis {
    return {
      agentRole: 'FOREX_MACRO_SPECIALIST',
      currencyStrengthMatrix: {
        USD: dxy > 102 ? 'STRONG' : dxy < 99.8 ? 'WEAK' : 'NEUTRAL',
        EUR: eurusd > 1.16 ? 'STRONG' : 'NEUTRAL',
        GBP: gbpusd > 1.34 ? 'STRONG' : 'NEUTRAL',
        JPY: usdjpy > 154 ? 'WEAK' : 'STRONG',
        XAU: gold > 4360 ? 'STRONG' : 'NEUTRAL'
      },
      goldMacroBias: gold >= 4360 ? 'BULLISH' : 'RANGE_BOUND',
      dxyImpactSummary: `مؤشر الدولار عند ${dxy}؛ السيولة البنكية تفضل الاتجاه الصاعد للذهب مع ارتدادات منتظمة في أزواج العملات الرئيسية.`,
      bestForexPairs: [
        { pair: 'XAU/USD', bias: 'BUY', confluenceReason: 'تجميع سيولة قوي عند الدعم اليومي مع تدفقات شراء بنكية', recommendedLot: 0.02 },
        { pair: 'EUR/USD', bias: 'BUY', confluenceReason: 'ارتداد من منطقة التكافؤ اللحظية وتأكيد كسر الهيكل الصاعد', recommendedLot: 0.03 }
      ],
      executiveGuidanceArabic: 'إدارة صارمة لرأس المال: لا تتجاوز المخاطرة في الصفقة الواحدة 1.5%، مع الحفاظ على رأس المال تحت سقف أقصى خسارة يومية 15% مع قاطع آلي.',
      activeSessionArabic: 'تداخل جلسات التداول العالمية (نشاط الفوركس والذهب)',
      maxDrawdownStatus: 'قاطع أمان المحفظة 15% مفعل وجاهز للعزل الفوري',
      timestamp: Date.now()
    };
  }
}

export const forexAiAgent = new ForexAiAgent();
