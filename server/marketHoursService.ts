import { 
  AssetClass, 
  MarketSessionStatus, 
  AssetClassMarketStatus, 
  MarketHoliday, 
  MarketSymbolSchedule, 
  MarketClosuresOverview,
  AssetMarketState
} from '../src/types.js';

// ==========================================
// Comprehensive Global Market Holidays 2025 - 2027
// ==========================================
export const GLOBAL_MARKET_HOLIDAYS: MarketHoliday[] = [
  // 2025 Holidays
  {
    id: 'hol-2025-01-01',
    name: "New Year's Day",
    nameArabic: "رأس السنة الميلادية (عطلة عالمية شاملة)",
    date: '2025-01-01',
    country: 'Global',
    countryFlag: '🌐',
    affectedAssetClasses: ['forex', 'commodity', 'indices', 'stock'],
    affectedMarkets: ['Global Forex', 'CME', 'NYSE', 'NASDAQ', 'LSE', 'Eurex', 'TSE'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'Halt all non-crypto algorithmic trading. Zero institutional liquidity.',
    botActionGuidanceArabic: 'إيقاف كامل لجميع صفقات البوت عدا الكريبتو نظراً لانعدام السيولة المؤسسية.'
  },
  {
    id: 'hol-2025-01-20',
    name: 'Martin Luther King Jr. Day',
    nameArabic: 'يوم مارتن لوثر كينغ (عطلة الأسواق الأمريكية)',
    date: '2025-01-20',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Futures Early Close 18:00 UTC'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC for Futures',
    impactLevel: 'HIGH',
    botActionGuidance: 'Avoid US equities and indices scalping. Thin afternoon liquidity.',
    botActionGuidanceArabic: 'تجنب المضاربة السريعة على المؤشرات والأسهم الأمريكية بسبب إغلاق وول ستريت.'
  },
  {
    id: 'hol-2025-02-17',
    name: "Washington's Birthday / Presidents' Day",
    nameArabic: 'يوم الرؤساء الأمريكي (عطلة البنوك الأمريكية)',
    date: '2025-02-17',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Metals & Oil Early Close 18:00 UTC'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'US Cash markets closed. CME closes early at 18:00 UTC. Widen SL buffers.',
    botActionGuidanceArabic: 'إغلاق البورصات الأمريكية وإغلاق مبكر لعقود السلع والمؤشرات الساعة 18:00 بتوقيت غرينتش.'
  },
  {
    id: 'hol-2025-04-18',
    name: 'Good Friday',
    nameArabic: 'الجمعة العظيمة (إغلاق الأسواق العالمية والسلع)',
    date: '2025-04-18',
    country: 'Global',
    countryFlag: '🌐',
    affectedAssetClasses: ['forex', 'commodity', 'indices', 'stock'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'LSE', 'Eurex', 'CME Gold/Oil', 'Interbank FX'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'Full market halt across Forex, Gold, and Equities. Crypto only.',
    botActionGuidanceArabic: 'إغلاق شامل لأسواق الفوركس والذهب والأسهم العالمية. ينصح بتداول الكريبتو فقط.'
  },
  {
    id: 'hol-2025-04-21',
    name: 'Easter Monday',
    nameArabic: 'إثنين الفصح (عطلة البنوك الأوروبية والبريطانية)',
    date: '2025-04-21',
    country: 'Europe / UK',
    countryFlag: '🇪🇺',
    affectedAssetClasses: ['forex', 'indices', 'stock'],
    affectedMarkets: ['LSE', 'DAX', 'CAC40', 'European Banks'],
    status: 'FULL_CLOSE',
    impactLevel: 'MEDIUM',
    botActionGuidance: 'European session closed. Low liquidity during London hours until NY opens.',
    botActionGuidanceArabic: 'إغلاق البورصات الأوروبية والبريطانية. سيولة منخفضة جداً حتى افتتاح نيويورك.'
  },
  {
    id: 'hol-2025-05-26',
    name: 'Memorial Day (US) & Spring Bank Holiday (UK)',
    nameArabic: 'يوم الذكرى الأمريكي وعطلة البنوك البريطانية',
    date: '2025-05-26',
    country: 'USA / UK',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity', 'forex'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'LSE', 'CME Futures Early Close'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '17:00 UTC for CME',
    impactLevel: 'HIGH',
    botActionGuidance: 'Major liquidity vacuum in London and New York. Strict guardrails active.',
    botActionGuidanceArabic: 'انعدام للسيولة في بورصتي لندن ونيويورك. تفعيل صمامات الأمان وإيقاف الصفقات الجديدة.'
  },
  {
    id: 'hol-2025-06-19',
    name: 'Juneteenth National Independence Day',
    nameArabic: 'يوم الاستقلال الوطني جونتينث (أمريكا)',
    date: '2025-06-19',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Early Close 18:00 UTC'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC',
    impactLevel: 'MEDIUM',
    botActionGuidance: 'US Equities closed. Forex normal with lower afternoon volume.',
    botActionGuidanceArabic: 'إغلاق الأسهم الأمريكية. أسواق الفوركس تعمل بنمط سيولة منخفض بعد الظهر.'
  },
  {
    id: 'hol-2025-07-04',
    name: 'US Independence Day',
    nameArabic: 'عيد الاستقلال الأمريكي (4 يوليو)',
    date: '2025-07-04',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Early Close 17:00 UTC'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '17:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'US cash markets closed. Gold & Oil early settlement. Reduce risk.',
    botActionGuidanceArabic: 'إغلاق بورصات وول ستريت وإغلاق مبكر لعقود الذهب والنفط. تقليص حجم المخاطرة.'
  },
  {
    id: 'hol-2025-09-01',
    name: 'US Labor Day',
    nameArabic: 'عيد العمال الأمريكي',
    date: '2025-09-01',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Early Close 17:00 UTC'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '17:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'US Cash markets shut. Thin institutional volume. Scalp trading throttled.',
    botActionGuidanceArabic: 'إغلاق الأسواق الأمريكية بالكامل. سيولة ضعيفة جداً وتقييد صفقات السكالبينج.'
  },
  {
    id: 'hol-2025-11-27',
    name: 'US Thanksgiving Day',
    nameArabic: 'عيد الشكر الأمريكي (إغلاق وول ستريت)',
    date: '2025-11-27',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Shut / Early Close'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'US Markets completely closed. Spread blowout risk across all USD pairs.',
    botActionGuidanceArabic: 'إغلاق شامل للأسواق الأمريكية ومخاطر اتساع السبريد على أزواج الدولار.'
  },
  {
    id: 'hol-2025-11-28',
    name: 'Black Friday (US Early Close)',
    nameArabic: 'الجمعة السوداء (إغلاق مبكر لأسواق الأسهم والعقود)',
    date: '2025-11-28',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE closes 18:00 UTC', 'NASDAQ closes 18:00 UTC', 'CME closes 18:15 UTC'],
    status: 'EARLY_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC',
    impactLevel: 'MEDIUM',
    botActionGuidance: 'US session closes early at 13:00 EST (18:00 UTC). Close intraday trades early.',
    botActionGuidanceArabic: 'إغلاق مبكر لجميع الأسواق الأمريكية في تمام الساعة 18:00 بتوقيت غرينتش.'
  },
  {
    id: 'hol-2025-12-24',
    name: 'Christmas Eve',
    nameArabic: 'عشية عيد الميلاد (إغلاق مبكر وسيولة شحيحة)',
    date: '2025-12-24',
    country: 'Global',
    countryFlag: '🌐',
    affectedAssetClasses: ['forex', 'commodity', 'indices', 'stock'],
    affectedMarkets: ['NYSE closes 18:00 UTC', 'LSE closes 12:30 UTC', 'Eurex closed'],
    status: 'EARLY_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'Severe holiday liquidity drought. High slippage warning.',
    botActionGuidanceArabic: 'جفاف حاد في السيولة العالمية وانزلاقات سعرية محتملة. تقييد التداول الآلي.'
  },
  {
    id: 'hol-2025-12-25',
    name: 'Christmas Day',
    nameArabic: 'عيد الميلاد المجيد (إغلاق عالمي شامل)',
    date: '2025-12-25',
    country: 'Global',
    countryFlag: '🌐',
    affectedAssetClasses: ['forex', 'commodity', 'indices', 'stock'],
    affectedMarkets: ['Global Interbank FX', 'NYSE', 'NASDAQ', 'CME', 'LSE', 'TSE'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'All financial exchanges closed globally. Crypto 24/7 active.',
    botActionGuidanceArabic: 'إغلاق عالمي شامل لكافة البورصات بدون استثناء. تداول العملات الرقمية فقط متاح.'
  },
  {
    id: 'hol-2025-12-26',
    name: 'Boxing Day',
    nameArabic: 'يوم البوكسينج (عطلة بريطانيا وأوروبا وكندا وأستراليا)',
    date: '2025-12-26',
    country: 'UK / EU / Commonwealth',
    countryFlag: '🇬🇧',
    affectedAssetClasses: ['forex', 'indices', 'stock'],
    affectedMarkets: ['LSE', 'ASX', 'TSX', 'Eurex'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'London and European hubs shut. US open with low participation.',
    botActionGuidanceArabic: 'إغلاق البورصات الأوروبية والبريطانية والكندية. أسواق أمريكا تفتح بسيولة خفيفة.'
  },

  // 2026 Holidays
  {
    id: 'hol-2026-01-01',
    name: "New Year's Day 2026",
    nameArabic: 'رأس السنة الميلادية 2026 (عطلة عالمية)',
    date: '2026-01-01',
    country: 'Global',
    countryFlag: '🌐',
    affectedAssetClasses: ['forex', 'commodity', 'indices', 'stock'],
    affectedMarkets: ['Global Exchanges'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'Full global exchange closure. Crypto 24/7 unaffected.',
    botActionGuidanceArabic: 'إغلاق عالمي شامل لكافة الأسواق المالية.'
  },
  {
    id: 'hol-2026-01-19',
    name: 'Martin Luther King Jr. Day 2026',
    nameArabic: 'يوم مارتن لوثر كينغ 2026',
    date: '2026-01-19',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Futures 18:00 UTC Close'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'US markets closed. Forex and Crypto active.',
    botActionGuidanceArabic: 'إغلاق الأسواق الأمريكية وعقود الفيوتشرز تغلق مبكراً.'
  },
  {
    id: 'hol-2026-02-16',
    name: "Washington's Birthday 2026",
    nameArabic: 'يوم الرؤساء الأمريكي 2026',
    date: '2026-02-16',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'US trading halted. Avoid USD index scalps in US session.',
    botActionGuidanceArabic: 'عطلة رسمية في الولايات المتحدة وتراجع في سيولة الدولار.'
  },
  {
    id: 'hol-2026-04-03',
    name: 'Good Friday 2026',
    nameArabic: 'الجمعة العظيمة 2026 (إغلاق عالمي)',
    date: '2026-04-03',
    country: 'Global',
    countryFlag: '🌐',
    affectedAssetClasses: ['forex', 'commodity', 'indices', 'stock'],
    affectedMarkets: ['Global Interbank FX', 'NYSE', 'LSE', 'CME'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'Global financial closure across FX and metals. Halt bot execution.',
    botActionGuidanceArabic: 'إغلاق عالمي لأسواق الفوركس والمعادن والمؤشرات.'
  },
  {
    id: 'hol-2026-04-06',
    name: 'Easter Monday 2026',
    nameArabic: 'إثنين الفصح 2026 (عطلة البنوك الأوروبية)',
    date: '2026-04-06',
    country: 'Europe / UK',
    countryFlag: '🇪🇺',
    affectedAssetClasses: ['forex', 'indices', 'stock'],
    affectedMarkets: ['LSE', 'DAX', 'CAC40'],
    status: 'FULL_CLOSE',
    impactLevel: 'MEDIUM',
    botActionGuidance: 'European markets closed. Wait for US cash market open at 13:30 UTC.',
    botActionGuidanceArabic: 'إغلاق البورصات الأوروبية. يفضل انتظار افتتاح جلسة نيويورك.'
  },
  {
    id: 'hol-2026-05-25',
    name: 'US Memorial Day & UK Spring Holiday 2026',
    nameArabic: 'يوم الذكرى الأمريكي وعطلة بريطانيا 2026',
    date: '2026-05-25',
    country: 'USA / UK',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'LSE', 'CME Early Close 17:00 UTC'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '17:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'No US cash session. Pause swing entries on US30 and SPX.',
    botActionGuidanceArabic: 'إغلاق بورصتي نيويورك ولندن. إيقاف الصفقات الكبيرة على المؤشرات.'
  },
  {
    id: 'hol-2026-07-03',
    name: 'US Independence Day (Observed)',
    nameArabic: 'يوم الاستقلال الأمريكي (يوم العطلة الفعلي)',
    date: '2026-07-03',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Early Close'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '17:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'US holiday closure. CME closes early. High spread risk.',
    botActionGuidanceArabic: 'عطلة رسمية لجميع البورصات الأمريكية وإغلاق مبكر لعقود الطاقة والمعادن.'
  },
  {
    id: 'hol-2026-09-07',
    name: 'US Labor Day 2026',
    nameArabic: 'عيد العمال الأمريكي 2026',
    date: '2026-09-07',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Early Close 17:00 UTC'],
    status: 'FULL_CLOSE',
    earlyCloseTimeUtc: '17:00 UTC',
    impactLevel: 'HIGH',
    botActionGuidance: 'US markets closed. Thin volume across currency pairs.',
    botActionGuidanceArabic: 'إغلاق البورصات الأمريكية بالكامل وتراجع في أحجام التداول.'
  },
  {
    id: 'hol-2026-11-26',
    name: 'US Thanksgiving Day 2026',
    nameArabic: 'عيد الشكر الأمريكي 2026',
    date: '2026-11-26',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE', 'NASDAQ', 'CME Shut'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'US markets closed. Spread blowout risk.',
    botActionGuidanceArabic: 'إغلاق الأسواق الأمريكية بالكامل. مخاطر انزلاق سعري واتساع السبريد.'
  },
  {
    id: 'hol-2026-11-27',
    name: 'Black Friday 2026 (Early Close)',
    nameArabic: 'الجمعة السوداء 2026 (إغلاق مبكر 18:00 غرينتش)',
    date: '2026-11-27',
    country: 'USA',
    countryFlag: '🇺🇸',
    affectedAssetClasses: ['stock', 'indices', 'commodity'],
    affectedMarkets: ['NYSE 18:00 UTC Close', 'NASDAQ 18:00 UTC Close'],
    status: 'EARLY_CLOSE',
    earlyCloseTimeUtc: '18:00 UTC',
    impactLevel: 'MEDIUM',
    botActionGuidance: 'Half-day trading session in US. Close all intraday scalps before 17:30 UTC.',
    botActionGuidanceArabic: 'جلسة نصف يوم في أمريكا. إغلاق الصفقات السريعة قبل الساعة 17:30 بتوقيت غرينتش.'
  },
  {
    id: 'hol-2026-12-25',
    name: 'Christmas Day 2026',
    nameArabic: 'عيد الميلاد المجيد 2026 (إغلاق سنوي شامل)',
    date: '2026-12-25',
    country: 'Global',
    countryFlag: '🌐',
    affectedAssetClasses: ['forex', 'commodity', 'indices', 'stock'],
    affectedMarkets: ['All Global Exchanges'],
    status: 'FULL_CLOSE',
    impactLevel: 'HIGH',
    botActionGuidance: 'Universal exchange shutdown. Automated bot trading fully paused.',
    botActionGuidanceArabic: 'إغلاق سنوي شامل لكافة البورصات والأسواق. إيقاف الصفقات الآلية تماماً.'
  }
];

export class MarketHoursService {
  private static instance: MarketHoursService;

  public static getInstance(): MarketHoursService {
    if (!MarketHoursService.instance) {
      MarketHoursService.instance = new MarketHoursService();
    }
    return MarketHoursService.instance;
  }

  /**
   * Evaluates current active sessions and their progress.
   */
  public getSessionsStatus(now: Date = new Date()): {
    allSessions: MarketSessionStatus[];
    activeSessions: MarketSessionStatus[];
    overlapWindow: {
      isOverlapActive: boolean;
      name: string;
      nameArabic: string;
      description: string;
      descriptionArabic: string;
    };
  } {
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const currentMinutesOfDay = utcHours * 60 + utcMinutes;

    // Helper to calculate progress and time remaining across UTC midnight
    const calcSession = (
      id: 'SYDNEY' | 'TOKYO' | 'LONDON' | 'NEW_YORK',
      name: string,
      nameArabic: string,
      city: string,
      flag: string,
      openUtc: string,
      closeUtc: string,
      openHour: number,
      closeHour: number,
      isKillzone: boolean,
      volatilityTier: 'HIGH' | 'MEDIUM' | 'LOW',
      activePairs: string[]
    ): MarketSessionStatus => {
      let openMins = openHour * 60;
      let closeMins = closeHour * 60;
      let isOpen = false;
      let progressPct = 0;
      let minsRemaining = 0;

      if (openHour < closeHour) {
        // Simple daytime session (e.g. London 07:00 to 16:00, NY 12:00 to 21:00, Tokyo 00:00 to 09:00)
        isOpen = currentMinutesOfDay >= openMins && currentMinutesOfDay < closeMins;
        const totalDuration = closeMins - openMins;
        if (isOpen) {
          const elapsed = currentMinutesOfDay - openMins;
          progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
          minsRemaining = closeMins - currentMinutesOfDay;
        } else {
          minsRemaining = currentMinutesOfDay < openMins ? (openMins - currentMinutesOfDay) : (24 * 60 - currentMinutesOfDay + openMins);
        }
      } else {
        // Spans across UTC midnight (e.g. Sydney 21:00 to 06:00)
        isOpen = currentMinutesOfDay >= openMins || currentMinutesOfDay < closeMins;
        const totalDuration = (24 * 60 - openMins) + closeMins;
        if (isOpen) {
          const elapsed = currentMinutesOfDay >= openMins 
            ? currentMinutesOfDay - openMins 
            : (24 * 60 - openMins) + currentMinutesOfDay;
          progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
          minsRemaining = currentMinutesOfDay >= openMins
            ? (24 * 60 - currentMinutesOfDay) + closeMins
            : closeMins - currentMinutesOfDay;
        } else {
          minsRemaining = openMins - currentMinutesOfDay;
        }
      }

      const hours = Math.floor(minsRemaining / 60);
      const mins = minsRemaining % 60;
      const timeRemaining = `${hours}h ${mins}m`;

      return {
        id,
        name,
        nameArabic,
        city,
        flag,
        openUtc,
        closeUtc,
        isOpen,
        progressPct,
        timeRemaining,
        secondsRemaining: minsRemaining * 60,
        isKillzone,
        volatilityTier,
        activePairs
      };
    };

    const sydney = calcSession(
      'SYDNEY', 'Sydney Session', 'جلسة سيدني (آسيا والمحيط الهادئ)', 'Sydney', '🇦🇺',
      '21:00', '06:00', 21, 6, false, 'LOW', ['AUD/USD', 'NZD/USD', 'AUD/JPY']
    );

    const tokyo = calcSession(
      'TOKYO', 'Tokyo / Asian Session', 'جلسة طوكيو (الآسيوية)', 'Tokyo', '🇯🇵',
      '00:00', '09:00', 0, 9, false, 'MEDIUM', ['USD/JPY', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY']
    );

    const london = calcSession(
      'LONDON', 'London / European Session', 'جلسة لندن (الأوروبية المؤسسية)', 'London', '🇬🇧',
      '07:00', '16:00', 7, 16, true, 'HIGH', ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'XAU/USD', 'DAX40']
    );

    const newYork = calcSession(
      'NEW_YORK', 'New York / US Session', 'جلسة نيويورك (الأمريكية الرئيسية)', 'New York', '🇺🇸',
      '12:00', '21:00', 12, 21, true, 'HIGH', ['EUR/USD', 'GBP/USD', 'USD/CAD', 'XAU/USD', 'SPX500', 'US30', 'BTC/USD']
    );

    const allSessions = [sydney, tokyo, london, newYork];
    const activeSessions = allSessions.filter(s => s.isOpen);

    // Overlap checks
    const isLondonNyOverlap = london.isOpen && newYork.isOpen; // 12:00 - 16:00 UTC
    const isTokyoLondonOverlap = tokyo.isOpen && london.isOpen; // 07:00 - 09:00 UTC

    let overlapWindow = {
      isOverlapActive: false,
      name: 'No Overlap (Single Session)',
      nameArabic: 'لا يوجد تداخل (جلسة مفردة)',
      description: 'Standard session volatility and normal institutional flow.',
      descriptionArabic: 'سيولة قياسية وفق الجلسة النشطة الحالية.'
    };

    if (isLondonNyOverlap) {
      overlapWindow = {
        isOverlapActive: true,
        name: '🔥 London & New York Overlap (Peak Liquidity)',
        nameArabic: '🔥 تداخل جلستي لندن ونيويورك (ذروة السيولة العالمية)',
        description: 'Highest trading volume window globally (12:00-16:00 UTC). Ideal for scalping and breakout execution.',
        descriptionArabic: 'أعلى معدل سيولة وحركة سعرية في الأسواق العالمية (12:00-16:00 UTC). نافذة مثالية للصفقات السريعة.'
      };
    } else if (isTokyoLondonOverlap) {
      overlapWindow = {
        isOverlapActive: true,
        name: '⚡ Tokyo & London Crossover',
        nameArabic: '⚡ تقاطع جلستي طوكيو ولندن',
        description: 'European market open with Asian session unwinding (07:00-09:00 UTC). High volatility in EUR & GBP pairs.',
        descriptionArabic: 'افتتاح البورصات الأوروبية مع نهاية آسيا (07:00-09:00 UTC). تقلبات نشطة في أزواج اليورو والباوند.'
      };
    }

    return { allSessions, activeSessions, overlapWindow };
  }

  /**
   * Retrieves today's active holidays and upcoming holiday events.
   */
  public getHolidaysInfo(now: Date = new Date()): {
    activeHolidaysToday: MarketHoliday[];
    upcomingHolidays: MarketHoliday[];
  } {
    const todayStr = now.toISOString().split('T')[0];
    const todayTime = new Date(todayStr).getTime();

    const activeHolidaysToday: MarketHoliday[] = [];
    const upcomingHolidays: MarketHoliday[] = [];

    GLOBAL_MARKET_HOLIDAYS.forEach(hol => {
      const holTime = new Date(hol.date).getTime();
      const diffDays = Math.round((holTime - todayTime) / (1000 * 60 * 60 * 24));

      if (hol.date === todayStr) {
        activeHolidaysToday.push({
          ...hol,
          isToday: true,
          daysUntil: 0
        });
      } else if (diffDays > 0 && diffDays <= 30) {
        upcomingHolidays.push({
          ...hol,
          isUpcoming: true,
          daysUntil: diffDays
        });
      }
    });

    // Sort upcoming by daysUntil
    upcomingHolidays.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0));

    return { activeHolidaysToday, upcomingHolidays };
  }

  /**
   * Evaluates weekly weekend close countdown and daily rollover.
   */
  public getTimingCountdowns(now: Date = new Date()): {
    weekendCloseCountdown: MarketClosuresOverview['weekendCloseCountdown'];
    dailyRolloverCountdown: MarketClosuresOverview['dailyRolloverCountdown'];
  } {
    const day = now.getUTCDay(); // 0 = Sunday, 1 = Mon, ..., 5 = Friday, 6 = Saturday
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();

    // 1. Weekend Close / Re-open Logic
    // Forex Closes Friday 22:00 UTC -> Reopens Sunday 22:00 UTC
    let isWeekendActive = false;
    let isForexClosingSoon = false;
    let secondsUntilForexClose = 0;
    let secondsUntilForexOpen = 0;
    let countdownText = '';

    if (day === 5) {
      // Friday
      if (hours >= 22) {
        isWeekendActive = true;
        // From Friday 22:00 to Sunday 22:00 = 48 hours
        const passedSinceClose = ((hours - 22) * 3600) + (minutes * 60) + seconds;
        secondsUntilForexOpen = (48 * 3600) - passedSinceClose;
      } else {
        // Friday before 22:00 UTC
        secondsUntilForexClose = ((21 - hours) * 3600) + ((59 - minutes) * 60) + (60 - seconds);
        if (secondsUntilForexClose <= 2 * 3600) {
          isForexClosingSoon = true;
        }
      }
    } else if (day === 6) {
      // Saturday (Full Weekend)
      isWeekendActive = true;
      const hoursUntilSundayEnd = (24 - hours) + 22; // remaining Saturday hours + 22h on Sunday
      secondsUntilForexOpen = (hoursUntilSundayEnd * 3600) - (minutes * 60) - seconds;
    } else if (day === 0) {
      // Sunday
      if (hours < 22) {
        isWeekendActive = true;
        secondsUntilForexOpen = ((21 - hours) * 3600) + ((59 - minutes) * 60) + (60 - seconds);
      } else {
        // Sunday 22:00+ UTC -> Markets already open!
        isWeekendActive = false;
        // Next Friday close is 5 days away (Mon, Tue, Wed, Thu, Fri)
        const daysToFriday = 5;
        secondsUntilForexClose = (daysToFriday * 24 * 3600) - ((hours - 22) * 3600) - (minutes * 60) - seconds;
      }
    } else {
      // Mon (1), Tue (2), Wed (3), Thu (4)
      isWeekendActive = false;
      const daysUntilFriday = 5 - day;
      const totalSec = (daysUntilFriday * 24 * 3600) + ((21 - hours) * 3600) + ((59 - minutes) * 60) + (60 - seconds);
      secondsUntilForexClose = totalSec;
    }

    if (isWeekendActive) {
      const h = Math.floor(secondsUntilForexOpen / 3600);
      const m = Math.floor((secondsUntilForexOpen % 3600) / 60);
      countdownText = `Forex & Markets reopen in ${h}h ${m}m (Sun 22:00 UTC)`;
    } else {
      const d = Math.floor(secondsUntilForexClose / (24 * 3600));
      const h = Math.floor((secondsUntilForexClose % (24 * 3600)) / 3600);
      const m = Math.floor((secondsUntilForexClose % 3600) / 60);
      countdownText = d > 0 
        ? `Weekend close in ${d}d ${h}h ${m}m (Fri 22:00 UTC)`
        : `Weekend close in ${h}h ${m}m (Fri 22:00 UTC)`;
    }

    // 2. Daily Rollover Logic (Daily at 21:55 - 22:05 UTC)
    // Between 21:55 and 22:05 UTC, banks settle positions. Spreads widen up to 5x-10x.
    const currentMinsOfDay = hours * 60 + minutes;
    const isRolloverActive = (currentMinsOfDay >= (21 * 60 + 55)) && (currentMinsOfDay <= (22 * 60 + 5));
    
    let secondsUntilRollover = 0;
    const rolloverStartMins = 21 * 60 + 55;
    if (currentMinsOfDay < rolloverStartMins) {
      secondsUntilRollover = (rolloverStartMins - currentMinsOfDay) * 60 - seconds;
    } else if (isRolloverActive) {
      secondsUntilRollover = 0;
    } else {
      // After rollover, next is tomorrow
      secondsUntilRollover = ((24 * 60 - currentMinsOfDay) + rolloverStartMins) * 60 - seconds;
    }

    return {
      weekendCloseCountdown: {
        isForexClosingSoon,
        isWeekendActive,
        secondsUntilForexClose,
        secondsUntilForexOpen,
        closeTimeUtc: 'Friday 22:00 UTC',
        reopenTimeUtc: 'Sunday 22:00 UTC',
        countdownText
      },
      dailyRolloverCountdown: {
        isRolloverActive,
        secondsUntilRollover,
        rolloverWindowText: 'Daily Settlement: 21:55 - 22:05 UTC (Spread Widening)',
        rolloverWindowTextArabic: 'فترة التسوية اليومية: 21:55 - 22:05 غرينتش (اتساع السبريد)'
      }
    };
  }

  /**
   * Evaluates state and parameters for each asset class.
   */
  public getAssetClassesStatus(
    now: Date = new Date(),
    timing: ReturnType<MarketHoursService['getTimingCountdowns']>,
    holidays: ReturnType<MarketHoursService['getHolidaysInfo']>
  ): Record<AssetClass, AssetClassMarketStatus> {
    const day = now.getUTCDay();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const { isWeekendActive, isForexClosingSoon, secondsUntilForexClose, secondsUntilForexOpen } = timing.weekendCloseCountdown;
    const isRollover = timing.dailyRolloverCountdown.isRolloverActive;

    // Check if any holiday today affects specific asset classes
    const todayHolidays = holidays.activeHolidaysToday;
    const hasForexHoliday = todayHolidays.some(h => h.affectedAssetClasses.includes('forex') && h.status === 'FULL_CLOSE');
    const hasCommodityHoliday = todayHolidays.some(h => h.affectedAssetClasses.includes('commodity') && h.status === 'FULL_CLOSE');
    const hasIndicesHoliday = todayHolidays.some(h => h.affectedAssetClasses.includes('indices') && h.status === 'FULL_CLOSE');
    const hasStockHoliday = todayHolidays.some(h => h.affectedAssetClasses.includes('stock') && h.status === 'FULL_CLOSE');

    // --- 1. FOREX ---
    let forexState: AssetMarketState = 'OPEN';
    let forexStateArabic = 'مفتوح (تداول نشط)';
    let forexOpen = true;
    let forexLiquidity: 'OPTIMAL' | 'MODERATE' | 'THIN' | 'ZERO' = 'OPTIMAL';
    let forexNotes = 'Forex interbank network operating with standard spreads.';
    let forexNotesArabic = 'سوق العملات الأجنبية يعمل بسيولة طبيعية ومعدلات سبريد قياسية.';

    if (isWeekendActive) {
      forexState = 'CLOSED_WEEKEND';
      forexStateArabic = 'مغلق (عطلة نهاية الأسبوع)';
      forexOpen = false;
      forexLiquidity = 'ZERO';
      forexNotes = 'Forex closed for weekend. Opens Sunday 22:00 UTC.';
      forexNotesArabic = 'سوق الفوركس مغلق لعطلة نهاية الأسبوع. يفتتح الأحد 22:00 غرينتش.';
    } else if (hasForexHoliday) {
      forexState = 'HOLIDAY_CLOSED';
      forexStateArabic = 'عطلة رسمية (إغلاق بنكي)';
      forexOpen = false;
      forexLiquidity = 'ZERO';
      forexNotes = 'Interbank holiday closure active.';
      forexNotesArabic = 'عطلة رسمية للبنوك المركزية والشبكة بين البنوك.';
    } else if (isRollover) {
      forexState = 'DAILY_ROLLOVER';
      forexStateArabic = 'تسوية يومية (سبريد متسع)';
      forexOpen = true;
      forexLiquidity = 'THIN';
      forexNotes = 'Daily banking rollover active (21:55 - 22:05 UTC). Spreads widened.';
      forexNotesArabic = 'فترة المقاصة والتسوية البنكية اليومية. السبريد متسع ومخاطر انزلاق.';
    } else if (isForexClosingSoon) {
      forexLiquidity = 'MODERATE';
      forexNotes = 'Pre-weekend closure in < 2 hours. Spreads may widen; avoid aggressive scalps.';
      forexNotesArabic = 'أقل من ساعتين على الإغلاق الأسبوعي. تجنب الصفقات السريعة المعرضة لفجوات الافتتاح.';
    }

    const forexCountdown = isWeekendActive 
      ? `Reopens in ${Math.floor(secondsUntilForexOpen / 3600)}h ${Math.floor((secondsUntilForexOpen % 3600) / 60)}m`
      : `Closes in ${Math.floor(secondsUntilForexClose / 3600)}h ${Math.floor((secondsUntilForexClose % 3600) / 60)}m`;

    const forexStatus: AssetClassMarketStatus = {
      assetClass: 'forex',
      title: 'Forex (FX Currencies)',
      titleArabic: 'سوق العملات الأجنبية (الفوركس)',
      state: forexState,
      stateArabic: forexStateArabic,
      isOpen: forexOpen,
      nextEventTitle: isWeekendActive ? 'Sunday Open (22:00 UTC)' : 'Friday Close (22:00 UTC)',
      nextEventTitleArabic: isWeekendActive ? 'افتتاح الأحد (22:00 غرينتش)' : 'إغلاق الجمعة (22:00 غرينتش)',
      nextEventTime: Date.now() + (isWeekendActive ? secondsUntilForexOpen * 1000 : secondsUntilForexClose * 1000),
      countdownText: forexCountdown,
      spreadWarning: isRollover || isForexClosingSoon,
      liquidityTier: forexLiquidity,
      symbolsCount: 12,
      notes: forexNotes,
      notesArabic: forexNotesArabic
    };

    // --- 2. COMMODITIES (Gold XAU/USD, Silver XAG/USD, Oil USOIL) ---
    // CME/NYMEX Hours: Open Sun 23:00 UTC -> Fri 22:00 UTC with daily 1-hour maintenance break (22:00 - 23:00 UTC Mon-Thu)
    let commState: AssetMarketState = 'OPEN';
    let commStateArabic = 'مفتوح (جلسة الذهب والسلع)';
    let commOpen = true;
    let commLiquidity: 'OPTIMAL' | 'MODERATE' | 'THIN' | 'ZERO' = 'OPTIMAL';
    let commNotes = 'CME/NYMEX precious metals and energy contracts live.';
    let commNotesArabic = 'عقود المعادن الثمينة والطاقة (الذهب والنفط) تعمل بشكل كامل.';

    const isCmeDailyBreak = (hours === 22); // 22:00 - 23:00 UTC daily maintenance break

    if (isWeekendActive || (day === 5 && hours >= 22) || (day === 0 && hours < 23)) {
      commState = 'CLOSED_WEEKEND';
      commStateArabic = 'مغلق (عطلة نهاية الأسبوع)';
      commOpen = false;
      commLiquidity = 'ZERO';
      commNotes = 'Commodities futures closed for weekend. Opens Sunday 23:00 UTC.';
      commNotesArabic = 'عقود السلع مغلقة لعطلة نهاية الأسبوع. تفتتح الأحد 23:00 غرينتش.';
    } else if (hasCommodityHoliday) {
      commState = 'HOLIDAY_CLOSED';
      commStateArabic = 'عطلة رسمية (بورصة السلع)';
      commOpen = false;
      commLiquidity = 'ZERO';
      commNotes = 'CME Metals & Energy market closed for holiday.';
      commNotesArabic = 'عطلة رسمية لبورصات شيكاغو ونيويورك للمعادن والطاقة.';
    } else if (isCmeDailyBreak) {
      commState = 'DAILY_MAINTENANCE';
      commStateArabic = 'صيانة يومية (22:00 - 23:00 غرينتش)';
      commOpen = false;
      commLiquidity = 'ZERO';
      commNotes = 'Daily CME 60-minute settlement & maintenance break.';
      commNotesArabic = 'فترة التسوية والصيانة اليومية لمدة 60 دقيقة في بورصة شيكاغو.';
    }

    const commStatus: AssetClassMarketStatus = {
      assetClass: 'commodity',
      title: 'Commodities (Gold, Silver, Oil)',
      titleArabic: 'السلع والمعادن (الذهب والنفط والفضة)',
      state: commState,
      stateArabic: commStateArabic,
      isOpen: commOpen,
      nextEventTitle: commOpen ? 'Daily CME Break (22:00 UTC)' : 'Market Open',
      nextEventTitleArabic: commOpen ? 'فترة الصيانة اليومية (22:00 غرينتش)' : 'افتتاح التداول',
      nextEventTime: Date.now() + (commOpen ? ((22 - hours) * 3600 - minutes * 60) * 1000 : 3600 * 1000),
      countdownText: commOpen ? 'Open (Live Trading)' : 'Closed / Settlement',
      spreadWarning: isCmeDailyBreak || isForexClosingSoon,
      liquidityTier: commLiquidity,
      symbolsCount: 4,
      notes: commNotes,
      notesArabic: commNotesArabic
    };

    // --- 3. INDICES (US30, SPX500, NAS100, DAX40) ---
    let indState: AssetMarketState = 'OPEN';
    let indStateArabic = 'مفتوح (عقود المؤشرات العالمية)';
    let indOpen = true;
    let indLiquidity: 'OPTIMAL' | 'MODERATE' | 'THIN' | 'ZERO' = 'OPTIMAL';
    let indNotes = 'Index futures trading with continuous liquidity.';
    let indNotesArabic = 'عقود المؤشرات العالمية (داو جونز، ناسداك، إس آند بي) تعمل بسيولة مستمرة.';

    if (isWeekendActive || (day === 5 && hours >= 22) || (day === 0 && hours < 23)) {
      indState = 'CLOSED_WEEKEND';
      indStateArabic = 'مغلق (عطلة نهاية الأسبوع)';
      indOpen = false;
      indLiquidity = 'ZERO';
      indNotes = 'Global stock indices closed for weekend. Opens Sunday 23:00 UTC.';
      indNotesArabic = 'أسواق المؤشرات مغلقة لعطلة نهاية الأسبوع. تفتتح الأحد 23:00 غرينتش.';
    } else if (hasIndicesHoliday) {
      indState = 'HOLIDAY_CLOSED';
      indStateArabic = 'عطلة رسمية (بورصة نيويورك)';
      indOpen = false;
      indLiquidity = 'ZERO';
      indNotes = 'Indices closed for public exchange holiday.';
      indNotesArabic = 'إغلاق البورصات الرسمية للمؤشرات بسبب عطلة عامة.';
    } else if (hours === 22) {
      indState = 'DAILY_MAINTENANCE';
      indStateArabic = 'صيانة يومية (22:00 - 23:00 غرينتش)';
      indOpen = false;
      indLiquidity = 'ZERO';
      indNotes = 'CME Index futures daily maintenance break.';
      indNotesArabic = 'فترة الصيانة اليومية لعقود المؤشرات الآجلة.';
    }

    const indStatus: AssetClassMarketStatus = {
      assetClass: 'indices',
      title: 'Indices (US30, SPX500, NAS100, DAX40)',
      titleArabic: 'المؤشرات العالمية (داو جونز، ناسداك، إس آند بي)',
      state: indState,
      stateArabic: indStateArabic,
      isOpen: indOpen,
      nextEventTitle: indOpen ? 'Daily Break (22:00 UTC)' : 'Index Futures Open',
      nextEventTitleArabic: indOpen ? 'فترة الصيانة (22:00 غرينتش)' : 'افتتاح عقود المؤشرات',
      nextEventTime: Date.now() + 3600 * 1000,
      countdownText: indOpen ? 'Live Trading Active' : 'Market Closed',
      spreadWarning: !indOpen,
      liquidityTier: indLiquidity,
      symbolsCount: 6,
      notes: indNotes,
      notesArabic: indNotesArabic
    };

    // --- 4. STOCKS (US Equities: AAPL, NVDA, TSLA, MSFT) ---
    // Cash Session: 13:30 - 20:00 UTC (9:30 AM - 4:00 PM EST)
    // Pre-Market: 08:00 - 13:30 UTC
    // After-Hours: 20:00 - 00:00 UTC
    let stockState: AssetMarketState = 'OPEN';
    let stockStateArabic = 'الجلسة الرئيسية (وول ستريت)';
    let stockOpen = false;
    let stockLiquidity: 'OPTIMAL' | 'MODERATE' | 'THIN' | 'ZERO' = 'ZERO';
    let stockNotes = 'Wall Street regular trading session.';
    let stockNotesArabic = 'جلسة التداول الرسمية في بورصتي نيويورك وناسداك.';

    const minsOfDay = hours * 60 + minutes;
    const isRegularHours = minsOfDay >= (13 * 60 + 30) && minsOfDay < (20 * 60);
    const isPreMarket = minsOfDay >= (8 * 60) && minsOfDay < (13 * 60 + 30);
    const isAfterHours = minsOfDay >= (20 * 60) && minsOfDay < (24 * 60);

    if (day === 0 || day === 6 || isWeekendActive) {
      stockState = 'CLOSED_WEEKEND';
      stockStateArabic = 'مغلق (عطلة نهاية الأسبوع)';
      stockOpen = false;
      stockLiquidity = 'ZERO';
      stockNotes = 'NYSE & NASDAQ closed for the weekend. Opens Monday 13:30 UTC.';
      stockNotesArabic = 'وول ستريت مغلقة لعطلة نهاية الأسبوع. تفتتح الإثنين 13:30 غرينتش.';
    } else if (hasStockHoliday) {
      stockState = 'HOLIDAY_CLOSED';
      stockStateArabic = 'عطلة رسمية (وول ستريت)';
      stockOpen = false;
      stockLiquidity = 'ZERO';
      stockNotes = 'US Stock Exchanges closed for holiday.';
      stockNotesArabic = 'عطلة رسمية في بورصتي نيويورك وناسداك.';
    } else if (isRegularHours) {
      stockState = 'OPEN';
      stockStateArabic = 'الجلسة الرئيسية (وول ستريت مفتوحة)';
      stockOpen = true;
      stockLiquidity = 'OPTIMAL';
      stockNotes = 'Regular US cash equity hours (13:30 - 20:00 UTC). Optimal liquidity.';
      stockNotesArabic = 'الجلسة الرسمية للأسهم الأمريكية (13:30 - 20:00 غرينتش). سيولة ممتازة.';
    } else if (isPreMarket) {
      stockState = 'PRE_MARKET';
      stockStateArabic = 'تداول ما قبل الافتتاح (Pre-Market)';
      stockOpen = true;
      stockLiquidity = 'MODERATE';
      stockNotes = 'US Pre-market session active. Wider spreads and thinner volume.';
      stockNotesArabic = 'جلسة ما قبل الافتتاح في أمريكا. سبريد أعلى وسيولة أقل من الجلسة الرسمية.';
    } else if (isAfterHours) {
      stockState = 'AFTER_HOURS';
      stockStateArabic = 'تداول ما بعد الإغلاق (After-Hours)';
      stockOpen = true;
      stockLiquidity = 'THIN';
      stockNotes = 'US After-hours trading session.';
      stockNotesArabic = 'جلسة ما بعد الإغلاق. سيولة خفيفة وتذبذب محدود.';
    } else {
      stockState = 'CLOSED_WEEKEND';
      stockStateArabic = 'مغلق حالياً';
      stockOpen = false;
      stockLiquidity = 'ZERO';
      stockNotes = 'US Equities closed until Pre-market open at 08:00 UTC.';
      stockNotesArabic = 'الأسهم الأمريكية مغلقة حتى افتتاح جلسة ما قبل السوق في 08:00 غرينتش.';
    }

    const stockStatus: AssetClassMarketStatus = {
      assetClass: 'stock',
      title: 'US Stocks (AAPL, NVDA, TSLA, MSFT)',
      titleArabic: 'الأسهم الأمريكية (أبل، إنفيديا، تسلا، مايكروسوفت)',
      state: stockState,
      stateArabic: stockStateArabic,
      isOpen: stockOpen,
      nextEventTitle: isRegularHours ? 'Cash Market Close (20:00 UTC)' : 'Regular Market Open (13:30 UTC)',
      nextEventTitleArabic: isRegularHours ? 'إغلاق الجلسة الرسمية (20:00 غرينتش)' : 'افتتاح الجلسة الرسمية (13:30 غرينتش)',
      nextEventTime: Date.now() + 3600 * 1000,
      countdownText: isRegularHours ? 'Cash Session Live' : isPreMarket ? 'Pre-Market Active' : 'Closed',
      spreadWarning: isPreMarket || isAfterHours || !stockOpen,
      liquidityTier: stockLiquidity,
      symbolsCount: 4,
      notes: stockNotes,
      notesArabic: stockNotesArabic
    };

    // --- 5. CRYPTO (BTC, ETH, SOL, XRP) ---
    // 24/7/365 Non-Stop Open
    const cryptoStatus: AssetClassMarketStatus = {
      assetClass: 'crypto',
      title: 'Cryptocurrency (BTC, ETH, SOL, XRP)',
      titleArabic: 'العملات الرقمية (بيتكوين، إيثريوم، سولانا)',
      state: 'OPEN',
      stateArabic: 'مفتوح 24/7 (تداول مستمر بلا توقف)',
      isOpen: true,
      nextEventTitle: isWeekendActive ? 'CME Futures Weekend Gap (Mon Open)' : 'Continuous 24/7 Trading',
      nextEventTitleArabic: isWeekendActive ? 'فجوة عقود CME الأسبوعية (افتتاح الإثنين)' : 'تداول مستمر 24 ساعة',
      nextEventTime: Date.now() + 24 * 3600 * 1000,
      countdownText: '24/7/365 Live Non-Stop',
      spreadWarning: isWeekendActive, // Weekend retail volume may have lower depth
      liquidityTier: isWeekendActive ? 'MODERATE' : 'OPTIMAL',
      symbolsCount: 6,
      notes: isWeekendActive 
        ? 'Crypto operates 24/7. Note: CME Bitcoin Futures closed over weekend (Potential CME gap on Sunday open).'
        : '24/7 continuous blockchain market with optimal liquidity.',
      notesArabic: isWeekendActive
        ? 'العملات الرقمية تعمل 24/7 بلا توقف. تنبيه: عقود CME للبيتكوين مغلقة مما قد ينتج فجوات سعرية عند الافتتاح.'
        : 'سوق العملات الرقمية مفتوح دائماً بلا إغلاقات أسبوعية وبسيولة ممتازة.'
    };

    return {
      forex: forexStatus,
      commodity: commStatus,
      indices: indStatus,
      stock: stockStatus,
      crypto: cryptoStatus
    };
  }

  /**
   * Generates the comprehensive Market Closures Overview payload.
   */
  public getMarketClosuresOverview(now: Date = new Date()): MarketClosuresOverview {
    const { allSessions, activeSessions, overlapWindow } = this.getSessionsStatus(now);
    const holidays = this.getHolidaysInfo(now);
    const timing = this.getTimingCountdowns(now);
    const assetClasses = this.getAssetClassesStatus(now, timing, holidays);

    const isWeekend = timing.weekendCloseCountdown.isWeekendActive;
    const isRollover = timing.dailyRolloverCountdown.isRolloverActive;

    // Bot Execution Guard Assessment
    const isForexAllowed = assetClasses.forex.isOpen && !isRollover;
    const isCommoditiesAllowed = assetClasses.commodity.isOpen;
    const isIndicesAllowed = assetClasses.indices.isOpen;
    const isCryptoAllowed = true; // Always 24/7

    let globalWarningMessage: string | undefined;
    let globalWarningMessageArabic: string | undefined;
    let riskMultiplier = 1.0;

    if (isWeekend) {
      globalWarningMessage = 'Weekend Market Closure Active: Forex, Commodities, and Stocks are closed. Only 24/7 Crypto trading is allowed.';
      globalWarningMessageArabic = 'عطلة نهاية الأسبوع نشطة: أسواق الفوركس والذهب والمؤشرات مغلقة. التداول متاح للعملات الرقمية فقط.';
      riskMultiplier = 0.8;
    } else if (isRollover) {
      globalWarningMessage = 'Daily Bank Settlement Rollover (21:55 - 22:05 UTC): Spreads significantly widened. New market orders throttled.';
      globalWarningMessageArabic = 'فترة التسوية البنكية اليومية (21:55 - 22:05 غرينتش): السبريد متسع ومخاطر انزلاق. تم تفعيل الحماية وتأجيل الأوامر الفورية.';
      riskMultiplier = 0.5;
    } else if (timing.weekendCloseCountdown.isForexClosingSoon) {
      globalWarningMessage = 'Friday Pre-Weekend Close (< 2 Hours): High risk of weekend opening gaps. Bot is tightening trailing stops.';
      globalWarningMessageArabic = 'أقل من ساعتين على الإغلاق الأسبوعي: مخاطر فجوات سعرية عند افتتاح الأحد. البوت يقوم بتأمين الأرباح وتشديد الوقف.';
      riskMultiplier = 0.6;
    } else if (holidays.activeHolidaysToday.length > 0) {
      const hol = holidays.activeHolidaysToday[0];
      globalWarningMessage = `Public Holiday Active: ${hol.name} (${hol.country}). ${hol.botActionGuidance}`;
      globalWarningMessageArabic = `عطلة رسمية نشطة: ${hol.nameArabic}. ${hol.botActionGuidanceArabic}`;
      riskMultiplier = 0.7;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[now.getUTCDay()];
    const utcTimeStr = `${now.toISOString().slice(11, 19)} UTC`;

    return {
      timestamp: now.getTime(),
      utcTimeStr,
      dayOfWeek,
      isWeekend,
      activeSessions,
      allSessions,
      overlapWindow,
      assetClasses,
      weekendCloseCountdown: timing.weekendCloseCountdown,
      dailyRolloverCountdown: timing.dailyRolloverCountdown,
      activeHolidaysToday: holidays.activeHolidaysToday,
      upcomingHolidays: holidays.upcomingHolidays,
      botExecutionGuard: {
        isForexTradingAllowed: isForexAllowed,
        isCommoditiesAllowed,
        isIndicesAllowed,
        isCryptoAllowed,
        globalWarningMessage,
        globalWarningMessageArabic,
        riskMultiplier
      }
    };
  }

  /**
   * Fast check for symbol-level market open/closure status and trading clearance.
   */
  public getSymbolMarketSchedule(symbol: string, assetClass?: AssetClass, now: Date = new Date()): MarketSymbolSchedule {
    let resolvedClass: AssetClass = assetClass || 'forex';
    const cleanSym = symbol.toUpperCase().replace(/\s+/g, '');

    if (!assetClass) {
      if (cleanSym.includes('BTC') || cleanSym.includes('ETH') || cleanSym.includes('SOL') || cleanSym.includes('BNB') || cleanSym.includes('XRP') || cleanSym.includes('DOGE')) {
        resolvedClass = 'crypto';
      } else if (cleanSym.includes('XAU') || cleanSym.includes('XAG') || cleanSym.includes('OIL') || cleanSym.includes('GOLD')) {
        resolvedClass = 'commodity';
      } else if (cleanSym.includes('US30') || cleanSym.includes('SPX') || cleanSym.includes('NAS') || cleanSym.includes('DAX') || cleanSym.includes('FTSE') || cleanSym.includes('DXY') || cleanSym.includes('VIX')) {
        resolvedClass = 'indices';
      } else if (cleanSym.includes('AAPL') || cleanSym.includes('NVDA') || cleanSym.includes('TSLA') || cleanSym.includes('MSFT') || cleanSym.includes('AMZN')) {
        resolvedClass = 'stock';
      } else {
        resolvedClass = 'forex';
      }
    }

    const overview = this.getMarketClosuresOverview(now);
    const classStatus = overview.assetClasses[resolvedClass];

    const isCrypto = resolvedClass === 'crypto';
    const isOpen = classStatus.isOpen;
    const isRollover = overview.dailyRolloverCountdown.isRolloverActive && resolvedClass === 'forex';
    const preWeekendRisk = overview.weekendCloseCountdown.isForexClosingSoon && (resolvedClass === 'forex' || resolvedClass === 'commodity');

    let currentSpreadMultiplier = 1.0;
    if (isRollover) currentSpreadMultiplier = 3.5;
    else if (preWeekendRisk) currentSpreadMultiplier = 1.8;
    else if (!isOpen) currentSpreadMultiplier = 5.0;

    const tradingAllowed = isCrypto ? true : (isOpen && !isRollover);

    return {
      symbol,
      assetClass: resolvedClass,
      state: classStatus.state,
      stateArabic: classStatus.stateArabic,
      isOpen,
      tradingAllowed,
      currentSpreadMultiplier,
      nextEvent: classStatus.nextEventTitle,
      nextEventArabic: classStatus.nextEventTitleArabic,
      nextEventTime: classStatus.nextEventTime,
      countdownSeconds: Math.max(0, Math.floor((classStatus.nextEventTime - now.getTime()) / 1000)),
      countdownText: classStatus.countdownText,
      preWeekendRisk,
      rolloverActive: isRollover,
      activeHoliday: overview.activeHolidaysToday.find(h => h.affectedAssetClasses.includes(resolvedClass))
    };
  }
}

export const marketHoursService = MarketHoursService.getInstance();
