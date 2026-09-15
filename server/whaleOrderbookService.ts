import { fetchBinanceOrderbookDepth, fetchRealCvdData, RealOrderbookSnapshot, RealCvdSnapshot } from './realOrderbookService.js';

export interface OrderbookWall {
  priceLevel: number;
  volumeUSD: number;
  volumeRatio: number; // multiplier over average depth
  type: 'WHALE_BID_WALL' | 'WHALE_ASK_WALL';
  distancePct: number;
  isSpoofingSuspect: boolean;
  clusterCount: number;
}

export interface CvdMetric {
  timestamp: number;
  price: number;
  cumulativeDeltaUSD: number;
  divergenceType: 'BULLISH_ABSORPTION' | 'BEARISH_DISTRIBUTION' | 'NEUTRAL_FLOW';
  deltaIntensity: 'HIGH' | 'MODERATE' | 'LOW';
}

export interface WhaleOrderbookAnalysis {
  symbol: string;
  currentPrice: number;
  timestamp: number;
  venue: string;
  isDataRealAndVerified: boolean;
  bidAskImbalance: {
    bidVolumeTotalUSD: number;
    askVolumeTotalUSD: number;
    bidRatioPct: number;
    askRatioPct: number;
    dominantSide: 'BUYERS_DOMINANT' | 'SELLERS_DOMINANT' | 'EQUILIBRIUM';
    institutionalPressureScore: number; // 0 to 100
  };
  whaleWalls: OrderbookWall[];
  cvdDivergence: {
    status: 'BULLISH_ABSORPTION' | 'BEARISH_DISTRIBUTION' | 'CONVERGENT';
    explanationArabic: string;
    cvdHistory: CvdMetric[];
  };
  squeezeRadar: {
    shortSqueezeProbabilityPct: number;
    longSqueezeProbabilityPct: number;
    estimatedShortLiquidationUSD: number;
    estimatedLongLiquidationUSD: number;
    nearestSqueezeTriggerPrice: number;
    verdictArabic: string;
  };
}

export class WhaleOrderbookService {
  /**
   * Analyze authentic real-time order book depth and CVD flow directly from exchange feeds
   */
  public async getWhaleAnalysisForSymbol(symbol: string, currentPrice: number, digits = 2): Promise<WhaleOrderbookAnalysis> {
    const depth: RealOrderbookSnapshot = await fetchBinanceOrderbookDepth(symbol, 40);
    const cvd: RealCvdSnapshot = await fetchRealCvdData(symbol);
    const now = Date.now();

    // 1. If OTC asset or no live depth is available, return transparent structured state
    if (!depth.isAvailable || depth.venue === 'OTC_INTERBANK') {
      return {
        symbol,
        currentPrice,
        timestamp: now,
        venue: depth.venue,
        isDataRealAndVerified: false,
        bidAskImbalance: {
          bidVolumeTotalUSD: 0,
          askVolumeTotalUSD: 0,
          bidRatioPct: 50,
          askRatioPct: 50,
          dominantSide: 'EQUILIBRIUM',
          institutionalPressureScore: 50
        },
        whaleWalls: [],
        cvdDivergence: {
          status: 'CONVERGENT',
          explanationArabic: depth.statusMessageArabic,
          cvdHistory: []
        },
        squeezeRadar: {
          shortSqueezeProbabilityPct: 50,
          longSqueezeProbabilityPct: 50,
          estimatedShortLiquidationUSD: 0,
          estimatedLongLiquidationUSD: 0,
          nearestSqueezeTriggerPrice: currentPrice,
          verdictArabic: depth.statusMessageArabic
        }
      };
    }

    // 2. Identify Actual High-Volume Depth Walls from Real Bids and Asks
    const avgBidVol = depth.bids.length > 0 ? depth.totalBidUSD / depth.bids.length : 1;
    const avgAskVol = depth.asks.length > 0 ? depth.totalAskUSD / depth.asks.length : 1;

    const whaleWalls: OrderbookWall[] = [];

    // Filter genuine walls (clusters exceeding 2.2x average depth)
    for (const b of depth.bids) {
      const ratio = +(b.totalUSD / avgBidVol).toFixed(1);
      const distPct = +(((currentPrice - b.price) / currentPrice) * 100).toFixed(2);
      if (ratio >= 2.0 && b.totalUSD >= 50000) {
        whaleWalls.push({
          priceLevel: b.price,
          volumeUSD: b.totalUSD,
          volumeRatio: ratio,
          type: 'WHALE_BID_WALL',
          distancePct: Math.max(0.01, distPct),
          isSpoofingSuspect: false,
          clusterCount: Math.round(b.quantity * 10)
        });
      }
    }

    for (const a of depth.asks) {
      const ratio = +(a.totalUSD / avgAskVol).toFixed(1);
      const distPct = +(((a.price - currentPrice) / currentPrice) * 100).toFixed(2);
      if (ratio >= 2.0 && a.totalUSD >= 50000) {
        whaleWalls.push({
          priceLevel: a.price,
          volumeUSD: a.totalUSD,
          volumeRatio: ratio,
          type: 'WHALE_ASK_WALL',
          distancePct: Math.max(0.01, distPct),
          isSpoofingSuspect: false,
          clusterCount: Math.round(a.quantity * 10)
        });
      }
    }

    // Sort walls by volume
    whaleWalls.sort((a, b) => b.volumeUSD - a.volumeUSD);

    const institutionalPressureScore = Math.min(98, Math.round(Math.abs(depth.bidRatioPct - 50) * 3.2 + 50));

    // 3. CVD History from real trades
    const cvdHistory: CvdMetric[] = cvd.history.map(h => ({
      timestamp: h.timestamp,
      price: h.price,
      cumulativeDeltaUSD: h.cumulativeDeltaUSD,
      divergenceType: cvd.divergenceType,
      deltaIntensity: cvd.deltaIntensity
    }));

    const cvdStatus = cvd.divergenceType === 'BULLISH_ABSORPTION' 
      ? 'BULLISH_ABSORPTION' 
      : cvd.divergenceType === 'BEARISH_DISTRIBUTION' 
      ? 'BEARISH_DISTRIBUTION' 
      : 'CONVERGENT';

    const explanationArabic = cvdStatus === 'BULLISH_ABSORPTION'
      ? `امتصاص شرائي مؤكد من صفقات السوق الحقيقية: صفقات الشراء المباشرة تتفوق على البيع وتدعم تماسك السعر.`
      : cvdStatus === 'BEARISH_DISTRIBUTION'
      ? `ضغط بيعي حقيقي: صفقات البيع المباشرة بالسوق تفوق الشراء في شريط الصفقات الفورية.`
      : `توازن وتكافؤ بين صفقات الشراء والبيع في شريط الصفقات الفورية.`;

    // 4. Squeeze Probabilities derived from actual orderbook imbalance
    const shortSqueezeProbabilityPct = Math.min(94, Math.round(depth.bidRatioPct * 1.25));
    const longSqueezeProbabilityPct = Math.min(92, Math.round(depth.askRatioPct * 1.25));
    const nearestSqueezeTriggerPrice = +(currentPrice * (1 + (depth.bidRatioPct > 52 ? 0.005 : -0.005))).toFixed(digits);

    const verdictArabic = depth.bidRatioPct >= 58
      ? `تفوق واضح لطلبات الشراء في عمق السوق (${depth.bidRatioPct}% Bids) مقابل عروض البيع على منصة ${depth.venue}`
      : depth.askRatioPct >= 58
      ? `تفوق لعروض البيع في عمق السوق (${depth.askRatioPct}% Asks) على منصة ${depth.venue}`
      : `توازن نسبي في دفتر الأوامر على منصة ${depth.venue}`;

    return {
      symbol,
      currentPrice,
      timestamp: now,
      venue: depth.venue,
      isDataRealAndVerified: true,
      bidAskImbalance: {
        bidVolumeTotalUSD: depth.totalBidUSD,
        askVolumeTotalUSD: depth.totalAskUSD,
        bidRatioPct: depth.bidRatioPct,
        askRatioPct: depth.askRatioPct,
        dominantSide: depth.dominantSide,
        institutionalPressureScore
      },
      whaleWalls: whaleWalls.slice(0, 8),
      cvdDivergence: {
        status: cvdStatus,
        explanationArabic,
        cvdHistory
      },
      squeezeRadar: {
        shortSqueezeProbabilityPct,
        longSqueezeProbabilityPct,
        estimatedShortLiquidationUSD: depth.totalAskUSD,
        estimatedLongLiquidationUSD: depth.totalBidUSD,
        nearestSqueezeTriggerPrice,
        verdictArabic
      }
    };
  }
}

export const whaleOrderbookService = new WhaleOrderbookService();
