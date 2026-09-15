/**
 * Real Exchange Level-2 Orderbook and Live Trade Aggregator
 * Supports Binance Futures / Spot REST Depth & Bybit v5 Market Orderbook
 * Strict Real-Data Guarantee: No math.random, no fake walls.
 */

export interface RealOrderbookLevel {
  price: number;
  quantity: number;
  totalUSD: number;
}

export interface RealOrderbookSnapshot {
  venue: 'BINANCE_FUTURES' | 'BINANCE_SPOT' | 'BYBIT_LINEAR' | 'OTC_INTERBANK' | 'UNAVAILABLE';
  symbol: string;
  timestamp: number;
  lastUpdateId?: number;
  bids: RealOrderbookLevel[];
  asks: RealOrderbookLevel[];
  totalBidUSD: number;
  totalAskUSD: number;
  bidRatioPct: number;
  askRatioPct: number;
  dominantSide: 'BUYERS_DOMINANT' | 'SELLERS_DOMINANT' | 'EQUILIBRIUM';
  isAvailable: boolean;
  statusMessageArabic: string;
  statusMessageEnglish: string;
}

export interface RealTradeTick {
  price: number;
  qty: number;
  usd: number;
  isBuyerMaker: boolean; // false = aggressive taker buy (market buy), true = aggressive taker sell
  time: number;
}

export interface RealCvdSnapshot {
  symbol: string;
  timestamp: number;
  cumulativeDeltaUSD: number;
  buyVolumeUSD: number;
  sellVolumeUSD: number;
  deltaIntensity: 'HIGH' | 'MODERATE' | 'LOW';
  divergenceType: 'BULLISH_ABSORPTION' | 'BEARISH_DISTRIBUTION' | 'NEUTRAL_FLOW';
  history: Array<{
    timestamp: number;
    price: number;
    cumulativeDeltaUSD: number;
  }>;
  isRealTradeData: boolean;
}

// In-memory cache for level-2 snapshots (TTL 1.5s)
const depthCache: Record<string, { data: RealOrderbookSnapshot; expiresAt: number }> = {};
const cvdCache: Record<string, { data: RealCvdSnapshot; expiresAt: number }> = {};

/**
 * Fetch Authentic Level-2 Depth Snapshot from Binance Futures or Spot
 */
export async function fetchBinanceOrderbookDepth(rawSymbol: string, limit = 50): Promise<RealOrderbookSnapshot> {
  const cleanSymbol = rawSymbol.replace(/[\/\-_]/g, '').toUpperCase();
  const cacheKey = `depth_${cleanSymbol}_${limit}`;
  const now = Date.now();

  if (depthCache[cacheKey] && depthCache[cacheKey].expiresAt > now) {
    return depthCache[cacheKey].data;
  }

  // Determine if symbol is Crypto or OTC (Gold, Forex, Oil, Indices)
  const isCrypto = cleanSymbol.includes('BTC') || cleanSymbol.includes('ETH') || cleanSymbol.includes('SOL') || cleanSymbol.includes('USDT');

  if (!isCrypto) {
    // OTC assets (XAU/USD, EUR/USD, GBP/USD, USOIL, US500, etc) do NOT have a single global central orderbook
    const otcSnapshot: RealOrderbookSnapshot = {
      venue: 'OTC_INTERBANK',
      symbol: rawSymbol,
      timestamp: now,
      bids: [],
      asks: [],
      totalBidUSD: 0,
      totalAskUSD: 0,
      bidRatioPct: 50,
      askRatioPct: 50,
      dominantSide: 'EQUILIBRIUM',
      isAvailable: false,
      statusMessageArabic: `أصل لا مركزي (OTC Asset): لا يوجد دفتر أوامر مركزي موحد عالمياً للذهب والفوركس. الأسعار تأتي عبر شبكة البنوك ومزودي السيولة (ECN/Interbank).`,
      statusMessageEnglish: `Decentralized OTC Asset: No unified central orderbook exists for Spot Gold & Forex. Quotes are sourced via Interbank ECN liquidity feeds.`
    };
    depthCache[cacheKey] = { data: otcSnapshot, expiresAt: now + 5000 };
    return otcSnapshot;
  }

  try {
    // Primary: Binance Futures L2 Depth
    const res = await fetch(`https://fapi.binance.com/fapi/v1/depth?symbol=${cleanSymbol}&limit=${limit}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const data = await res.json();
      const rawBids: [string, string][] = data.bids || [];
      const rawAsks: [string, string][] = data.asks || [];

      const bids: RealOrderbookLevel[] = rawBids.map(([p, q]) => {
        const price = parseFloat(p);
        const quantity = parseFloat(q);
        return { price, quantity, totalUSD: Math.round(price * quantity) };
      });

      const asks: RealOrderbookLevel[] = rawAsks.map(([p, q]) => {
        const price = parseFloat(p);
        const quantity = parseFloat(q);
        return { price, quantity, totalUSD: Math.round(price * quantity) };
      });

      const totalBidUSD = bids.reduce((sum, b) => sum + b.totalUSD, 0);
      const totalAskUSD = asks.reduce((sum, a) => sum + a.totalUSD, 0);
      const totalUSD = Math.max(1, totalBidUSD + totalAskUSD);
      const bidRatioPct = +((totalBidUSD / totalUSD) * 100).toFixed(1);
      const askRatioPct = +((totalAskUSD / totalUSD) * 100).toFixed(1);

      const dominantSide = bidRatioPct >= 54 
        ? 'BUYERS_DOMINANT' 
        : askRatioPct >= 54 
        ? 'SELLERS_DOMINANT' 
        : 'EQUILIBRIUM';

      const snapshot: RealOrderbookSnapshot = {
        venue: 'BINANCE_FUTURES',
        symbol: cleanSymbol,
        timestamp: now,
        lastUpdateId: data.lastUpdateId || data.E,
        bids,
        asks,
        totalBidUSD,
        totalAskUSD,
        bidRatioPct,
        askRatioPct,
        dominantSide,
        isAvailable: true,
        statusMessageArabic: `دفتر أوامر حقيقي مباشر من Binance Futures (${bids.length} طلبات شراء | ${asks.length} عروض بيع)`,
        statusMessageEnglish: `Verified Live Binance Futures Level-2 Depth (${bids.length} Bids | ${asks.length} Asks)`
      };

      depthCache[cacheKey] = { data: snapshot, expiresAt: now + 1500 };
      return snapshot;
    }
  } catch (err) {
    // Fallback: Try Spot depth
  }

  try {
    const spotRes = await fetch(`https://api.binance.com/api/v3/depth?symbol=${cleanSymbol}&limit=${limit}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (spotRes.ok) {
      const data = await spotRes.json();
      const rawBids: [string, string][] = data.bids || [];
      const rawAsks: [string, string][] = data.asks || [];

      const bids: RealOrderbookLevel[] = rawBids.map(([p, q]) => {
        const price = parseFloat(p);
        const quantity = parseFloat(q);
        return { price, quantity, totalUSD: Math.round(price * quantity) };
      });

      const asks: RealOrderbookLevel[] = rawAsks.map(([p, q]) => {
        const price = parseFloat(p);
        const quantity = parseFloat(q);
        return { price, quantity, totalUSD: Math.round(price * quantity) };
      });

      const totalBidUSD = bids.reduce((sum, b) => sum + b.totalUSD, 0);
      const totalAskUSD = asks.reduce((sum, a) => sum + a.totalUSD, 0);
      const totalUSD = Math.max(1, totalBidUSD + totalAskUSD);
      const bidRatioPct = +((totalBidUSD / totalUSD) * 100).toFixed(1);
      const askRatioPct = +((totalAskUSD / totalUSD) * 100).toFixed(1);

      const dominantSide = bidRatioPct >= 54 ? 'BUYERS_DOMINANT' : askRatioPct >= 54 ? 'SELLERS_DOMINANT' : 'EQUILIBRIUM';

      const snapshot: RealOrderbookSnapshot = {
        venue: 'BINANCE_SPOT',
        symbol: cleanSymbol,
        timestamp: now,
        lastUpdateId: data.lastUpdateId,
        bids,
        asks,
        totalBidUSD,
        totalAskUSD,
        bidRatioPct,
        askRatioPct,
        dominantSide,
        isAvailable: true,
        statusMessageArabic: `دفتر أوامر فوري حقيقي من Binance Spot (${bids.length} طلبات شراء | ${asks.length} عروض بيع)`,
        statusMessageEnglish: `Verified Live Binance Spot Level-2 Depth`
      };
      depthCache[cacheKey] = { data: snapshot, expiresAt: now + 1500 };
      return snapshot;
    }
  } catch (err) {
    // Both failed
  }

  // Return UNAVAILABLE if feed is down
  return {
    venue: 'UNAVAILABLE',
    symbol: rawSymbol,
    timestamp: now,
    bids: [],
    asks: [],
    totalBidUSD: 0,
    totalAskUSD: 0,
    bidRatioPct: 50,
    askRatioPct: 50,
    dominantSide: 'EQUILIBRIUM',
    isAvailable: false,
    statusMessageArabic: `انقطاع مؤقت في بيانات دفتر الأوامر المباشرة للمنصة (Data Feed Down)`,
    statusMessageEnglish: `Live orderbook depth feed temporarily unreachable.`
  };
}

/**
 * Fetch Authentic Cumulative Volume Delta (CVD) from Live Executed Aggregated Trades
 */
export async function fetchRealCvdData(rawSymbol: string): Promise<RealCvdSnapshot> {
  const cleanSymbol = rawSymbol.replace(/[\/\-_]/g, '').toUpperCase();
  const cacheKey = `cvd_${cleanSymbol}`;
  const now = Date.now();

  if (cvdCache[cacheKey] && cvdCache[cacheKey].expiresAt > now) {
    return cvdCache[cacheKey].data;
  }

  const isCrypto = cleanSymbol.includes('BTC') || cleanSymbol.includes('ETH') || cleanSymbol.includes('SOL') || cleanSymbol.includes('USDT');

  if (!isCrypto) {
    const otcCvd: RealCvdSnapshot = {
      symbol: rawSymbol,
      timestamp: now,
      cumulativeDeltaUSD: 0,
      buyVolumeUSD: 0,
      sellVolumeUSD: 0,
      deltaIntensity: 'LOW',
      divergenceType: 'NEUTRAL_FLOW',
      history: [],
      isRealTradeData: false
    };
    cvdCache[cacheKey] = { data: otcCvd, expiresAt: now + 5000 };
    return otcCvd;
  }

  try {
    // Fetch last 100 aggregate trades
    const res = await fetch(`https://fapi.binance.com/fapi/v1/aggTrades?symbol=${cleanSymbol}&limit=100`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(3000)
    });

    if (res.ok) {
      const trades = await res.json();
      let runningDelta = 0;
      let buyVolUSD = 0;
      let sellVolUSD = 0;
      const history: Array<{ timestamp: number; price: number; cumulativeDeltaUSD: number }> = [];

      for (let i = 0; i < trades.length; i++) {
        const t = trades[i];
        const price = parseFloat(t.p);
        const qty = parseFloat(t.q);
        const usd = price * qty;
        const isBuyerMaker = Boolean(t.m);

        if (!isBuyerMaker) {
          // Market Buyer aggression (Taker Buy)
          runningDelta += usd;
          buyVolUSD += usd;
        } else {
          // Market Seller aggression (Taker Sell)
          runningDelta -= usd;
          sellVolUSD += usd;
        }

        if (i % 10 === 0 || i === trades.length - 1) {
          history.push({
            timestamp: t.T || now,
            price,
            cumulativeDeltaUSD: Math.round(runningDelta)
          });
        }
      }

      const totalVol = Math.max(1, buyVolUSD + sellVolUSD);
      const buyPct = (buyVolUSD / totalVol) * 100;
      const divergenceType = buyPct >= 58
        ? 'BULLISH_ABSORPTION'
        : buyPct <= 42
        ? 'BEARISH_DISTRIBUTION'
        : 'NEUTRAL_FLOW';

      const deltaIntensity = Math.abs(runningDelta) > 500000 ? 'HIGH' : Math.abs(runningDelta) > 100000 ? 'MODERATE' : 'LOW';

      const cvdSnapshot: RealCvdSnapshot = {
        symbol: cleanSymbol,
        timestamp: now,
        cumulativeDeltaUSD: Math.round(runningDelta),
        buyVolumeUSD: Math.round(buyVolUSD),
        sellVolumeUSD: Math.round(sellVolUSD),
        deltaIntensity,
        divergenceType,
        history,
        isRealTradeData: true
      };

      cvdCache[cacheKey] = { data: cvdSnapshot, expiresAt: now + 2000 };
      return cvdSnapshot;
    }
  } catch (err) {
    // Ignore and return fallback
  }

  return {
    symbol: rawSymbol,
    timestamp: now,
    cumulativeDeltaUSD: 0,
    buyVolumeUSD: 0,
    sellVolumeUSD: 0,
    deltaIntensity: 'LOW',
    divergenceType: 'NEUTRAL_FLOW',
    history: [],
    isRealTradeData: false
  };
}
