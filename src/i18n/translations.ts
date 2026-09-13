export type Language = 'ar' | 'en';

export interface Translations {
  // Navigation & Header
  appTitle: string;
  appSubtitle: string;
  navRadar: string;
  navIntermarket: string;
  navSimulation: string;
  navMonitor: string;
  navChart: string;
  navAi: string;
  navCopilot: string;
  navPaper: string;
  navTelegram: string;
  navMiniApp: string;
  navSettings: string;
  tabRadar: string;
  tabIntermarket: string;
  tabSimulation: string;
  tabMonitor: string;
  tabChart: string;
  tabAi: string;
  tabCopilot: string;
  tabTrades: string;
  tabQuantitative: string;
  tabGeminiInsight: string;
  tabGeminiMaster: string;
  tabUnifiedQuant: string;
  geminiMasterBtn: string;
  unifiedQuantBtn: string;
  tabTelegram: string;
  tabTma: string;
  tabTelegramCreator: string;
  tabSettings: string;
  statusActive: string;
  statusPaused: string;
  botActive: string;
  botPaused: string;
  instantScan: string;
  scanning: string;
  scanNow: string;
  pause: string;
  start: string;
  refresh: string;
  liveFeeds: string;
  langSwitchTitle: string;
  
  // Economic Calendar
  economicCalendar: string;
  economicDesc: string;
  economicCalendarTitle: string;
  economicCalendarSubtitle: string;
  highImpactCatalysts: string;
  refreshCalendar: string;
  expandAll: string;
  collapse: string;
  filterAll: string;
  filterHigh: string;
  filterMedium: string;
  filterLow: string;
  actual: string;
  forecast: string;
  previous: string;
  countdown: string;
  surprise: string;
  positiveSurprise: string;
  negativeSurprise: string;
  inLineSurprise: string;
  pending: string;
  releasedAgo: string;
  releasedToday: string;
  inMinutes: string;
  inHours: string;
  volatilityRisk: string;
  directionalBias: string;
  affectedAssets: string;
  liveSource: string;
  
  // Trade Types & Conflicts
  tradeTypeAll: string;
  tradeTypeScalp: string;
  tradeTypeSwing: string;
  tradeTypeScalpDesc: string;
  tradeTypeSwingDesc: string;
  scalpBadge: string;
  swingBadge: string;
  conflictPrevented: string;
  conflictWarning: string;
  cooldownActive: string;
  holdingHorizon: string;
  
  // Radar Scanner
  scannerHeader: string;
  scannerSubheader: string;
  filterByAsset: string;
  filterByTimeframe: string;
  filterByStyle: string;
  searchSymbol: string;
  confidence: string;
  confluenceScore: string;
  riskReward: string;
  entry: string;
  stopLoss: string;
  takeProfit1: string;
  takeProfit2: string;
  takeProfit3: string;
  sendTelegram: string;
  sentToTelegram: string;
  executePaperTrade: string;
  invalidationAlert: string;
  volatilityWarning: string;
  macroConfluence: string;
  aiTradePlan: string;
  
  // Paper Trading
  paperTradesTitle: string;
  openPositions: string;
  closedTrades: string;
  accountEquity: string;
  totalPnL: string;
  winRate: string;
  profitFactor: string;
  trailingSlActive: string;
  lockedProfit: string;
  dailyTarget10x: string;
  targetProgress: string;
  slippageMetric: string;
  executionGrade: string;
  closePosition: string;
  closeAllPositions: string;
  resetAccount: string;
  
  // Bot Monitor & Logs
  botMonitorTitle: string;
  liveTelemetry: string;
  uptime: string;
  scanCycles: string;
  avgLatency: string;
  apiRequests: string;
  fearGreedSentiment: string;
  botLogs: string;
  clearLogs: string;
  testSignal: string;
  emergencyCloseAll: string;
  confirmEmergencyClose: string;
  cancel: string;
  autoScroll: string;
  pauseStream: string;
  resumeStream: string;
  exportLogs: string;
  subsystemsStatus: string;
  marketFeed: string;
  radarCore: string;
  trailingGuardian: string;
  accuracyTelemetry: string;
  tickerStream: string;
  
  // Settings
  settingsTitle: string;
  languageSetting: string;
  selectLanguage: string;
  arabicLang: string;
  englishLang: string;
  tradeStylePreference: string;
  conflictPreventionSetting: string;
  conflictPreventionDesc: string;
  cooldownSetting: string;
  cooldownDesc: string;
  riskManagement: string;
  atrTrailingSetting: string;
  volatilityFilterSetting: string;
  telegramIntegration: string;
  saveSettings: string;
  settingsSavedToast: string;

  // Market Hours, Closures & Holidays
  tabMarketHours: string;
  marketHoursTitle: string;
  marketHoursSubtitle: string;
  activeSessions: string;
  sessionOverlaps: string;
  assetClassStatus: string;
  weekendCountdownTitle: string;
  dailyRolloverTitle: string;
  holidaysCalendarTitle: string;
  botGuardTitle: string;
  marketStateOpen: string;
  marketStateClosed: string;
  marketStateRollover: string;
  marketStatePreMarket: string;
  marketStateAfterHours: string;
  marketStateHoliday: string;
  tradingAllowedText: string;
  tradingRestrictedText: string;
  viewAllHolidays: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    appTitle: 'رادار التداول الذكي',
    appSubtitle: 'منظومة مسح الأسواق المتعددة والتحليل الكلي اللحظي',
    navRadar: 'الماسح الفوري',
    navIntermarket: 'التحليل الكلي (Macro)',
    navSimulation: 'تفكيك الاستراتيجيات والتهجين',
    navMonitor: 'مراقبة البوت',
    navChart: 'الشارت التفاعلي',
    navAi: 'الذكاء الاصطناعي',
    navCopilot: 'جيمناي كوبايلوت (المتداول)',
    navPaper: 'الصفقات الحية (Live Trading)',
    navTelegram: 'تنبيهات تيليجرام',
    navMiniApp: 'تطبيق Mini App',
    navSettings: 'الإعدادات واللغة',
    tabRadar: 'الماسح الفوري',
    tabIntermarket: 'التحليل الكلي (Macro)',
    tabSimulation: 'تفكيك الاستراتيجيات والتهجين',
    tabMonitor: 'مراقبة البوت',
    tabChart: 'الشارت التفاعلي',
    tabAi: 'الذكاء الاصطناعي',
    tabCopilot: 'جيمناي كوبايلوت ⚡',
    tabTrades: 'الصفقات الحية',
    tabQuantitative: 'المحرك الكمي',
    tabGeminiInsight: 'تحليلات Gemini ⚡',
    tabGeminiMaster: 'مركز وفراز Gemini ⚡',
    tabUnifiedQuant: 'المحرك الكمي 🚀',
    geminiMasterBtn: 'فرز الصفقات الذكي',
    unifiedQuantBtn: 'تشغيل المحرك الكمي',
    tabTelegram: 'تنبيهات تيليجرام',
    tabTma: 'تطبيق Mini App',
    tabTelegramCreator: 'تيليجرام و TMA 👑',
    tabSettings: 'الإعدادات',
    statusActive: 'البوت يعمل 🟢',
    statusPaused: 'البوت متوقف ⏸️',
    botActive: 'البوت نشط',
    botPaused: 'متوقف مؤقتاً',
    instantScan: 'مسح فوري',
    scanning: 'جاري المسح...',
    scanNow: 'مسح فوري',
    pause: 'إيقاف مؤقت',
    start: 'تشغيل',
    refresh: 'تحديث',
    liveFeeds: 'بث مباشر لحظي',
    langSwitchTitle: 'تغيير اللغة (Language)',
    
    // Economic Calendar
    economicCalendar: 'التقويم الاقتصادي اللحظي',
    economicDesc: 'بيانات دقيقة ولحظية من مصادر موثوقة لمتابعة الأخبار المحركة للأسواق',
    economicCalendarTitle: 'التقويم الاقتصادي اللحظي المباشر',
    economicCalendarSubtitle: 'بيانات دقيقة ولحظية من مصادر موثوقة لمتابعة الأخبار المحركة للأسواق',
    highImpactCatalysts: 'أخبار فائقة التأثير',
    refreshCalendar: 'تحديث البيانات اللحظية',
    expandAll: 'عرض كامل التقويم',
    collapse: 'طي العرض',
    filterAll: 'جميع التأثيرات',
    filterHigh: 'عالي التأثير 🔥',
    filterMedium: 'متوسط التأثير ⚡',
    filterLow: 'منخفض التأثير 🔹',
    actual: 'الفعلي',
    forecast: 'المتوقع',
    previous: 'السابق',
    countdown: 'العد التنازلي',
    surprise: 'المفاجأة السعرية',
    positiveSurprise: 'أفضل من المتوقع (إيجابي للعملة)',
    negativeSurprise: 'أسوأ من المتوقع (سلبي للعملة)',
    inLineSurprise: 'مطابق للتوقعات تماماً',
    pending: 'قيد الصدور',
    releasedAgo: 'صدر منذ',
    releasedToday: 'صدر اليوم',
    inMinutes: 'خلال',
    inHours: 'خلال',
    volatilityRisk: 'مخاطر التقلب اللحظي',
    directionalBias: 'التأثير الاتجاهي المتوقع',
    affectedAssets: 'الأصول المتأثرة',
    liveSource: 'مصدر مباشر موثوق',
    
    // Trade Types & Conflicts
    tradeTypeAll: 'جميع أنواع الصفقات',
    tradeTypeScalp: 'مضاربة سريعة (Scalp)',
    tradeTypeSwing: 'صفقة سوينج (Swing)',
    tradeTypeScalpDesc: 'صفقة مضاربة خاطفة لأهداف سريعة ووقف خسارة محكم لاستغلال الزخم اللحظي.',
    tradeTypeSwingDesc: 'صفقة سوينج استثمارية تستهدف ركوب موجات اتجاهية ممتدة مع إدارة ديناميكية للوقف.',
    scalpBadge: '⚡ مضاربة (Scalp)',
    swingBadge: '🌊 سوينج (Swing)',
    conflictPrevented: 'تم منع تضارب الصفقة المعاكسة وتفادي تكرار الإشارة',
    conflictWarning: 'تنبيه: يوجد إشارة أو صفقة مفتوحة بالاتجاه المعاكس تم تحييدها',
    cooldownActive: 'فترة التهدئة نشطة لمنع تكرار الإشارات لنفس الرمز',
    holdingHorizon: 'المدى الزمني المتوقع',
    
    // Radar Scanner
    scannerHeader: 'الماسح اللحظي لفرص التداول',
    scannerSubheader: 'رصد فوري لفرص المضاربة والسوينج مع منع التضارب وتأكيد التوافق الكلي',
    filterByAsset: 'نوع الأصل',
    filterByTimeframe: 'الإطار الزمني',
    filterByStyle: 'نمط التداول',
    searchSymbol: 'بحث عن رمز أو زوج...',
    confidence: 'نسبة الثقة',
    confluenceScore: 'مؤشر التوافق الكلي',
    riskReward: 'العائد للمخاطرة (R:R)',
    entry: 'سعر الدخول',
    stopLoss: 'وقف الخسارة',
    takeProfit1: 'الهدف الأول (TP1)',
    takeProfit2: 'الهدف الثاني (TP2)',
    takeProfit3: 'الهدف الثالث (TP3)',
    sendTelegram: 'إرسال إلى تيليجرام',
    sentToTelegram: 'تم الإرسال لتيليجرام',
    executePaperTrade: 'تنفيذ كصفقة حية مباشرة',
    invalidationAlert: 'تنبيه إلغاء مبكر',
    volatilityWarning: 'تنبيه تقلب شاذ',
    macroConfluence: 'التوافق الكلي (Macro)',
    aiTradePlan: 'خطة الذكاء الاصطناعي',
    
    // Live Real Trading
    paperTradesTitle: 'محفظة الصفقات الحية الحقيقية والمضاربة المباشرة ($50 رأس المال - هدف 10x)',
    openPositions: 'الصفقات الحية المفتوحة',
    closedTrades: 'سجل الصفقات الحية المنفذة',
    accountEquity: 'رصيد الحساب الحي الإجمالي',
    totalPnL: 'صافي الأرباح والخسائر الحية',
    winRate: 'نسبة النجاح (Win Rate)',
    profitFactor: 'معامل الربحية',
    trailingSlActive: 'الوقف المتحرك نشط',
    lockedProfit: 'الأرباح المؤمّنة',
    dailyTarget10x: 'هدف الربح اليومي 10x ($500.00)',
    targetProgress: 'نسبة الإنجاز اليومي',
    slippageMetric: 'الانزلاق وزمن الاستجابة للوسيط',
    executionGrade: 'جودة التنفيذ المباشر',
    closePosition: 'إغلاق الصفقة الحية الآن',
    closeAllPositions: 'إغلاق طارئ لجميع الصفقات الحية',
    resetAccount: 'إعادة ضبط المحفظة ($50)',
    
    // Bot Monitor & Logs
    botMonitorTitle: 'لوحة القياس والتشغيل اللحظي للبوت',
    liveTelemetry: 'القياسات الفورية',
    uptime: 'مدة التشغيل المستمر',
    scanCycles: 'دورات المسح المكتملة',
    avgLatency: 'متوسط زمن الاستجابة',
    apiRequests: 'استهلاك طلبات الـ API',
    fearGreedSentiment: 'مؤشر الخوف والطمع',
    botLogs: 'سجل الأحداث والعمليات اللحظي',
    clearLogs: 'مسح السجل',
    testSignal: 'إشارة اختبار',
    emergencyCloseAll: 'إغلاق الطوارئ الشامل',
    confirmEmergencyClose: 'تأكيد إغلاق كافة الصفقات المفتوحة فوراً بالسعر الحالي؟',
    cancel: 'إلغاء',
    autoScroll: 'التمرير التلقائي',
    pauseStream: 'إيقاف البث',
    resumeStream: 'استئناف البث',
    exportLogs: 'تصدير JSON',
    subsystemsStatus: 'حالة الأنظمة الفرعية والخدمات',
    marketFeed: 'تغذية الأسعار المباشرة',
    radarCore: 'محرك الرادار',
    trailingGuardian: 'حارس الوقف المتحرك',
    accuracyTelemetry: 'دقة البيانات وزمن الاستجابة اللحظي',
    tickerStream: 'مصفوفة الأسعار والسيولة اللحظية',
    
    // Settings
    settingsTitle: 'إعدادات البوت والتحكم بالنظام',
    languageSetting: 'لغة الواجهة والبوت (Language)',
    selectLanguage: 'اختر لغة النظام والبوت:',
    arabicLang: '🇸🇦 العربية (Arabic)',
    englishLang: '🇬🇧 الإنجليزية (English)',
    tradeStylePreference: 'نمط الصفقات المفضل',
    conflictPreventionSetting: 'منع تضارب الصفقات المعاكسة (No Buy/Sell Conflict)',
    conflictPreventionDesc: 'منع فتح إشارات شراء وبيع متضاربة على نفس الأصل في آن واحد وإلغاء التكرار العشوائي.',
    cooldownSetting: 'مدة التهدئة بين الإشارات (Cooldown)',
    cooldownDesc: 'الحد الأدنى بالدقائق قبل توليد إشارة جديدة لنفس الأصل لمنع الإزعاج والتكرار.',
    riskManagement: 'إدارة المخاطر وتوزيع رأس المال',
    atrTrailingSetting: 'الوقف المتحرك الديناميكي المتكيف (ATR)',
    volatilityFilterSetting: 'فلتر قفزات التقلب الشاذة (Volatility Spike Filter)',
    telegramIntegration: 'ربط تنبيهات تيليجرام وديسكورد',
    saveSettings: 'حفظ الإعدادات وتطبيقها فوراً',
    settingsSavedToast: 'تم حفظ إعدادات البوت وتحديث اللغة بنجاح!',

    // Market Hours, Closures & Holidays
    tabMarketHours: 'إغلاقات وأوقات الأسواق ⏰',
    marketHoursTitle: 'مركز أوقات وإغلاقات الأسواق العالمية والأعياد الرسمية',
    marketHoursSubtitle: 'متابعة حية للجلسات العالمية، والعد التنازلي للإغلاقات اليومية والأسبوعية، وتأثير العطلات على قرارات البوت',
    activeSessions: 'الجلسات العالمية النشطة',
    sessionOverlaps: 'تداخل الجلسات والسيولة الذروية',
    assetClassStatus: 'حالة أسواق الأصول والإغلاقات',
    weekendCountdownTitle: 'العد التنازلي للإغلاق الأسبوعي للفوركس والأسواق',
    dailyRolloverTitle: 'فترة التسوية البنكية اليومية (Rollover 21:55 - 22:05 UTC)',
    holidaysCalendarTitle: 'تقويم الأعياد والعطلات الرسمية للأسواق المالية (2025 - 2027)',
    botGuardTitle: 'حارس إغلاقات الأسواق للبوت (Execution Guard)',
    marketStateOpen: 'السوق مفتوح 🟢',
    marketStateClosed: 'السوق مغلق 🔴',
    marketStateRollover: 'تسوية يومية 🟡',
    marketStatePreMarket: 'ما قبل الافتتاح 🔵',
    marketStateAfterHours: 'ما بعد الإغلاق 🟣',
    marketStateHoliday: 'عطلة رسمية 🏖️',
    tradingAllowedText: 'التداول مسموح به (ضمن ساعات السوق)',
    tradingRestrictedText: 'التداول مقيد / معلق (السوق مغلق أو في فترة تسوية)',
    viewAllHolidays: 'عرض كافة العطلات الرسمية'
  },
  en: {
    appTitle: 'Market Radar Trading Intelligence',
    appSubtitle: 'Multi-Timeframe Scanning & Real-Time Macro Intermarket Engine',
    navRadar: 'Radar Scanner',
    navIntermarket: 'Intermarket Macro',
    navSimulation: 'What-If Simulation',
    navMonitor: 'Bot Monitor',
    navChart: 'Interactive Chart',
    navAi: 'AI Next Move',
    navCopilot: 'Gemini Copilot',
    navPaper: 'Live Broker Positions',
    navTelegram: 'Telegram Alerts',
    navMiniApp: 'Telegram Mini App',
    navSettings: 'Settings & Language',
    tabRadar: 'Radar Scanner',
    tabIntermarket: 'Intermarket Macro',
    tabSimulation: 'What-If Simulation',
    tabMonitor: 'Bot Monitor',
    tabChart: 'Interactive Chart',
    tabAi: 'AI Next Move',
    tabCopilot: 'Gemini Copilot ⚡',
    tabTrades: 'Live Trades',
    tabQuantitative: 'Quant Engine',
    tabGeminiInsight: 'Gemini AI ⚡',
    tabGeminiMaster: 'Gemini Master ⚡',
    tabUnifiedQuant: 'Quant Engine 🚀',
    geminiMasterBtn: 'Screen Trades',
    unifiedQuantBtn: 'Run Quant Engine',
    tabTelegram: 'Telegram',
    tabTma: 'Mini App',
    tabTelegramCreator: 'Telegram & TMA 👑',
    tabSettings: 'Settings',
    statusActive: 'Running 🟢',
    statusPaused: 'Paused ⏸️',
    botActive: 'Active',
    botPaused: 'Paused',
    instantScan: 'Instant Scan',
    scanning: 'Scanning...',
    scanNow: 'Scan Now',
    pause: 'Pause',
    start: 'Start',
    refresh: 'Refresh',
    liveFeeds: 'LIVE FEEDS',
    langSwitchTitle: 'Change Language / تغيير اللغة',
    
    // Economic Calendar
    economicCalendar: 'Economic Macro Calendar',
    economicDesc: 'Live scheduled releases influencing currency & asset volatility',
    economicCalendarTitle: 'Live Real-Time Economic Macro Calendar',
    economicCalendarSubtitle: 'Accurate and timely releases directly from reliable global economic sources',
    highImpactCatalysts: 'High-Impact Catalysts',
    refreshCalendar: 'Refresh Live Data',
    expandAll: 'Expand Full Calendar',
    collapse: 'Collapse View',
    filterAll: 'All Impacts',
    filterHigh: 'High Impact 🔥',
    filterMedium: 'Medium Impact ⚡',
    filterLow: 'Low Impact 🔹',
    actual: 'Actual',
    forecast: 'Forecast',
    previous: 'Previous',
    countdown: 'COUNTDOWN',
    surprise: 'Price Surprise',
    positiveSurprise: 'Better than expected (Bullish Currency)',
    negativeSurprise: 'Worse than expected (Bearish Currency)',
    inLineSurprise: 'Exact match with consensus',
    pending: 'Pending Release',
    releasedAgo: 'Released',
    releasedToday: 'Released today',
    inMinutes: 'in',
    inHours: 'in',
    volatilityRisk: 'Instant Volatility Risk',
    directionalBias: 'Expected Market Direction Bias',
    affectedAssets: 'Affected Assets',
    liveSource: 'Reliable Live Source',
    
    // Trade Types & Conflicts
    tradeTypeAll: 'All Trade Types',
    tradeTypeScalp: 'Scalping Setup (Scalp)',
    tradeTypeSwing: 'Swing Setup (Swing)',
    tradeTypeScalpDesc: 'Fast-paced momentum setup targeting quick ATR expansion with tight risk.',
    tradeTypeSwingDesc: 'Multi-session trend expansion setup aligned with higher-timeframe macro drivers.',
    scalpBadge: '⚡ Scalp',
    swingBadge: '🌊 Swing',
    conflictPrevented: 'Directional conflict prevented: duplicate/opposite signals neutralized.',
    conflictWarning: 'Warning: Conflicting open trade/signal neutralized to protect capital.',
    cooldownActive: 'Cooldown buffer active to prevent repetitive signal spam.',
    holdingHorizon: 'Expected Holding Horizon',
    
    // Radar Scanner
    scannerHeader: 'Real-Time Market Opportunity Scanner',
    scannerSubheader: 'Live scanning for Scalp & Swing opportunities with conflict prevention and macro confluence',
    filterByAsset: 'Asset Class',
    filterByTimeframe: 'Timeframe',
    filterByStyle: 'Trade Style',
    searchSymbol: 'Search symbol or pair...',
    confidence: 'Confidence',
    confluenceScore: 'Confluence Score',
    riskReward: 'Risk / Reward',
    entry: 'Entry Price',
    stopLoss: 'Stop Loss',
    takeProfit1: 'Take Profit 1',
    takeProfit2: 'Take Profit 2',
    takeProfit3: 'Take Profit 3',
    sendTelegram: 'Dispatch to Telegram',
    sentToTelegram: 'Dispatched to Telegram',
    executePaperTrade: 'Execute Live Real Trade',
    invalidationAlert: 'Early Invalidation Alert',
    volatilityWarning: 'Volatility Spike Alert',
    macroConfluence: 'Macro Confluence',
    aiTradePlan: 'AI Trade Plan',
    
    // Live Real Trading
    paperTradesTitle: 'Live Broker Real Account Positions ($50 Base Capital - 10x Goal)',
    openPositions: 'Live Open Positions',
    closedTrades: 'Live Trade Execution History',
    accountEquity: 'Total Live Account Equity',
    totalPnL: 'Net Realized & Floating Live PnL',
    winRate: 'Win Rate',
    profitFactor: 'Profit Factor',
    trailingSlActive: 'Dynamic Trailing Stop Active',
    lockedProfit: 'Locked Profit USD',
    dailyTarget10x: '10x Daily Profit Target ($500.00)',
    targetProgress: 'Daily Target Progress',
    slippageMetric: 'Broker Slippage & Fill Latency',
    executionGrade: 'Live Execution Quality Grade',
    closePosition: 'Close Live Position Now',
    closeAllPositions: 'Emergency Close All Live Positions',
    resetAccount: 'Reset Account ($50)',
    
    // Bot Monitor & Logs
    botMonitorTitle: 'Bot Real-Time Telemetry & Operations Center',
    liveTelemetry: 'Live Telemetry Metrics',
    uptime: 'Continuous Uptime',
    scanCycles: 'Completed Scan Cycles',
    avgLatency: 'Average Ping Latency',
    apiRequests: 'Daily API Quota Usage',
    fearGreedSentiment: 'Fear & Greed Sentiment',
    botLogs: 'Real-Time Operations & Event Logs',
    clearLogs: 'Clear Logs',
    testSignal: 'Test Signal',
    emergencyCloseAll: 'Emergency Close All',
    confirmEmergencyClose: 'Are you sure you want to close ALL open positions at market price?',
    cancel: 'Cancel',
    autoScroll: 'Auto-Scroll',
    pauseStream: 'Pause Stream',
    resumeStream: 'Resume Stream',
    exportLogs: 'Export JSON',
    subsystemsStatus: 'Subsystems & Service Health',
    marketFeed: 'Market Feed',
    radarCore: 'Radar Core',
    trailingGuardian: 'Trailing SL Guardian',
    accuracyTelemetry: 'Real-Time Latency & Accuracy Telemetry',
    tickerStream: 'Live Ticker Stream & Spread Matrix',
    
    // Settings
    settingsTitle: 'Bot Parameters & System Settings',
    languageSetting: 'Bot & UI Language (اللغة)',
    selectLanguage: 'Select Bot and Application Language:',
    arabicLang: '🇸🇦 العربية (Arabic)',
    englishLang: '🇬🇧 English (الإنجليزية)',
    tradeStylePreference: 'Preferred Trade Style',
    conflictPreventionSetting: 'Prevent Conflicting Opposite Signals (No Buy/Sell Conflict)',
    conflictPreventionDesc: 'Prevent opening contradictory Buy and Sell positions simultaneously on the same asset and eliminate signal duplication.',
    cooldownSetting: 'Signal Cooldown Period',
    cooldownDesc: 'Minimum minutes required before issuing a new setup for the same symbol to prevent spam.',
    riskManagement: 'Risk Management & Capital Allocation',
    atrTrailingSetting: 'Dynamic ATR-based Trailing Stop',
    volatilityFilterSetting: 'Real-time Volatility Spike Filter',
    telegramIntegration: 'Telegram & Discord Dispatch Settings',
    saveSettings: 'Save & Apply Settings Instantly',
    settingsSavedToast: 'Bot settings and language updated successfully!',

    // Market Hours, Closures & Holidays
    tabMarketHours: 'Market Hours & Closures ⏰',
    marketHoursTitle: 'Global Market Hours, Sessions & Holiday Closures',
    marketHoursSubtitle: 'Real-time world market sessions, daily & weekly closure countdowns, and exchange holiday impact on bot execution',
    activeSessions: 'Active World Trading Sessions',
    sessionOverlaps: 'Session Overlaps & Peak Liquidity Windows',
    assetClassStatus: 'Asset Classes & Market Status',
    weekendCountdownTitle: 'Forex & Markets Weekly Close Countdown',
    dailyRolloverTitle: 'Daily Bank Rollover & Settlement (21:55 - 22:05 UTC)',
    holidaysCalendarTitle: 'Global Financial Exchange Holidays Calendar (2025 - 2027)',
    botGuardTitle: 'Bot Market Closure Guard & Safety Rules',
    marketStateOpen: 'Market Open 🟢',
    marketStateClosed: 'Market Closed 🔴',
    marketStateRollover: 'Daily Rollover 🟡',
    marketStatePreMarket: 'Pre-Market 🔵',
    marketStateAfterHours: 'After-Hours 🟣',
    marketStateHoliday: 'Public Holiday 🏖️',
    tradingAllowedText: 'Trading Allowed (Regular Market Hours)',
    tradingRestrictedText: 'Trading Restricted / Paused (Market Closed or Daily Rollover)',
    viewAllHolidays: 'View All Official Holidays'
  }
};
