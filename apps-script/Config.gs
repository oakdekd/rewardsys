// Configuration entry points. Edit values in the Config sheet at runtime;
// fall back to defaults here when a key is missing.

const SHEET_NAMES = {
  MEMBERS: 'Members',
  TRANSACTIONS: 'Transactions',
  REDEMPTIONS: 'Redemptions',
  REWARDS: 'Rewards',
  STAFF: 'Staff',
  CONFIG: 'Config'
};

const DEFAULT_CONFIG = {
  // Earning: every X baht = Y points
  EARN_THB_PER_UNIT: 45,
  EARN_POINTS_PER_UNIT: 10,

  // Payment method bonus multipliers (apply to base points)
  BONUS_CASH: 1.20,
  BONUS_QR: 1.30,
  BONUS_CREDIT: 1.00,

  // Points expire this many months after the latest transaction.
  POINT_EXPIRY_MONTHS: 24,

  // Bonus given on first signup
  WELCOME_BONUS_POINTS: 50,

  // Dynamic QR validity window (seconds)
  QR_TTL_SECONDS: 300,

  // LINE channel secret/token are stored in Script Properties, not here.
  // Set via: File > Project properties > Script properties
  // Keys: LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, LIFF_ID

  // Fuel types presented to staff
  FUEL_TYPES: 'แก๊สโซฮอล์ 95,แก๊สโซฮอล์ 91,E20,E85,ดีเซล B7,ดีเซล พรีเมียม',

  // Payment methods
  PAYMENT_METHODS: 'cash,qr,credit'
};

function getConfig(key) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('cfg_' + key);
  if (cached !== null) return parseConfigValue_(cached);

  const sheet = getSheet_(SHEET_NAMES.CONFIG);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      cache.put('cfg_' + key, String(data[i][1]), 300);
      return parseConfigValue_(data[i][1]);
    }
  }
  return DEFAULT_CONFIG[key];
}

function parseConfigValue_(v) {
  if (v === null || v === undefined || v === '') return v;
  const n = Number(v);
  if (!isNaN(n) && String(n) === String(v).trim()) return n;
  return v;
}

function getScriptProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
