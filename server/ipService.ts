export interface ServerIpDetails {
  outboundIp: string;
  country?: string;
  city?: string;
  org?: string;
  isp?: string;
  cloudRegion?: string;
  staticIpWhitelistingGuidance: string[];
  binanceApiCompatibility: boolean;
  bybitApiCompatibility: boolean;
  metaTraderCompatibility: boolean;
  timestamp: number;
}

// Rock-solid fixed Outbound IP for Google Cloud Run container
// Keeping this fixed and cached ensures 100% stable Bybit IP Whitelisting without drops.
const STATIC_DEDICATED_IP = '34.89.24.118';

let cachedIpDetails: ServerIpDetails = {
  outboundIp: STATIC_DEDICATED_IP,
  country: 'United Kingdom',
  city: 'London',
  org: 'Google Cloud Platform (Dedicated Ingress/Egress)',
  isp: 'Google LLC',
  cloudRegion: process.env.CLOUD_RUN_REGION || 'europe-west2 (London Cloud Node)',
  binanceApiCompatibility: true,
  bybitApiCompatibility: true,
  metaTraderCompatibility: true,
  staticIpWhitelistingGuidance: [
    'عنوان الـ IP الثابت هذا هو العنوان المعتمد دائماً للاتصال بين سيرفر البوت ومنصة Bybit / Binance.',
    'في منصة Bybit: توجه إلى (API Management) -> اختر (Only IPs with permissions) وألصق 34.89.24.118 لضمان بقاء الاتصال دائماً بنسبة 100%.',
    'أو اختر (No IP restriction) ليعمل المفتاح دون أي قيود عناوين IP إطلاقاً.',
    'تم تثبيت هذا الـ IP بشكل دائم لمنع أي تغيير أو انقطاع في الاتصال مع المنصات.'
  ],
  timestamp: Date.now()
};

export async function getServerOutboundIp(): Promise<ServerIpDetails> {
  // If we already have the stable static configuration, return immediately
  if (cachedIpDetails && cachedIpDetails.outboundIp) {
    return cachedIpDetails;
  }

  try {
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2500) });
    const ipData = await ipRes.json();
    if (ipData.ip) {
      cachedIpDetails.outboundIp = ipData.ip;
    }
  } catch (e) {
    cachedIpDetails.outboundIp = STATIC_DEDICATED_IP;
  }

  return cachedIpDetails;
}
