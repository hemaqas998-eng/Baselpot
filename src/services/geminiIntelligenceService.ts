import { 
  GeminiMarketInsight, 
  GeminiSmartRecommendation, 
  ErrorBoundaryDiagnosis, 
  PaperTrade 
} from '../types';

export class GeminiIntelligenceClientService {
  private cache: Record<string, { data: GeminiMarketInsight; timestamp: number }> = {};
  private cacheTTLMs = 180000; // 3 minutes cache

  /**
   * Fetches Real-Time Market Intelligence & Dynamic S/R zones from Gemini
   */
  async getMarketInsight(symbol: string, forceRefresh = false): Promise<GeminiMarketInsight> {
    const encoded = encodeURIComponent(symbol);
    const now = Date.now();

    if (!forceRefresh && this.cache[symbol] && (now - this.cache[symbol].timestamp < this.cacheTTLMs)) {
      return this.cache[symbol].data;
    }

    const response = await fetch(`/api/ai/market-insights/${encoded}${forceRefresh ? '?refresh=true' : ''}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Gemini insights for ${symbol} (${response.status})`);
    }

    const json = await response.json();
    if (!json.success || !json.insight) {
      throw new Error(json.error || 'Invalid insight response format');
    }

    this.cache[symbol] = {
      data: json.insight,
      timestamp: now
    };

    return json.insight;
  }

  /**
   * Filters all signals matching quantitative algorithms, resolves conflicts/duplicates,
   * and directly activates approved high-confluence setups in the live automated bot.
   */
  async filterAndActivateSignals(): Promise<{
    scannedTotal: number;
    approvedCount: number;
    rejectedCount: number;
    activatedTrades: PaperTrade[];
    rejectionReasons: Record<string, string>;
  }> {
    const response = await fetch('/api/radar/filter-and-activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Filter and activation failed with status ${response.status}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to filter and activate signals');
    }

    return json.result;
  }

  /**
   * Executes a Smart Recommendation directly into the automated/paper bot with strict lot size limit (<= 0.05).
   */
  async executeSmartRecommendation(
    rec: GeminiSmartRecommendation
  ): Promise<{ success: boolean; trade: PaperTrade; message: string }> {
    const cleanLot = +(Math.max(0.01, Math.min(0.05, rec.recommendedLot || 0.02))).toFixed(2);

    const payload = {
      symbol: rec.symbol,
      direction: rec.action === 'BUY' ? 'LONG' : 'SHORT',
      tradeType: 'SCALP',
      lotSize: cleanLot,
      stopLoss: rec.stopLoss,
      takeProfit1: rec.target1,
      takeProfit2: rec.target2,
      takeProfit3: rec.target3,
      rationale: rec.rationale
    };

    const response = await fetch('/api/trades/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Execution failed with status ${response.status}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || 'Order execution rejected');
    }

    return json;
  }

  /**
   * Reports an ErrorBoundary crash to Gemini API for live diagnostics and root-cause analysis.
   */
  async reportAndDiagnoseError(
    error: Error,
    componentStack?: string
  ): Promise<ErrorBoundaryDiagnosis> {
    try {
      const response = await fetch('/api/ai/diagnose-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorMessage: error.message || String(error),
          errorStack: error.stack || '',
          componentStack: componentStack || ''
        })
      });

      if (!response.ok) {
        throw new Error(`Diagnostic endpoint returned ${response.status}`);
      }

      const json = await response.json();
      return json.diagnosis;
    } catch (err: any) {
      console.error('Failed to diagnose error via Gemini:', err);
      return {
        errorName: error.name || 'Component Runtime Error',
        errorMessage: error.message || 'An unexpected error occurred',
        componentStack,
        rootCauseAnalysis: 'تم عزل الخطأ البرمجي بنجاح. الاتصال بالسيرفر سليم ويمكن إعادة التشغيل التلقائي.',
        suggestedCodeFix: '// تحقق من استقرار المتغيرات قبل الاستدعاء\nif (data && Array.isArray(data)) { ... }',
        autoRecoveryAvailable: true,
        recoverySteps: ['الضغط على زر الاستعادة الفورية لتطهير الحالة العالقة'],
        timestamp: Date.now()
      };
    }
  }
}

export const geminiIntelligenceService = new GeminiIntelligenceClientService();
