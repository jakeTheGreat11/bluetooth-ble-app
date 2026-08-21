import { NativeModules, Platform } from 'react-native';
import {
  BleProfile,
  ManufacturerProfile,
  buildAdvertisePayload,
  getBroadcastableProfiles,
} from './profiles';

type ContinuityAdvertiserNative = {
  startManufacturerAdvertise: (
    companyId: number,
    payload: number[],
    options: {
      connectable?: boolean;
      includeTxPowerLevel?: boolean;
      scanResponsePayload?: number[];
    } | null
  ) => Promise<string>;
  stopAdvertise: () => Promise<string>;
};

const ContinuityAdvertiser =
  NativeModules.ContinuityAdvertiser as ContinuityAdvertiserNative | undefined;

let rotateTimer: ReturnType<typeof setInterval> | null = null;
let currentProfile: ManufacturerProfile | null = null;

function requireNative(): ContinuityAdvertiserNative {
  if (Platform.OS !== 'android') {
    throw new Error('Broadcast Lab only works on Android');
  }
  if (!ContinuityAdvertiser) {
    throw new Error(
      'ContinuityAdvertiser native module missing — rebuild the Android app'
    );
  }
  return ContinuityAdvertiser;
}

async function advertiseOnce(profile: ManufacturerProfile): Promise<void> {
  const native = requireNative();
  const payload = buildAdvertisePayload(profile);
  await native.startManufacturerAdvertise(profile.companyId, payload, {
    connectable: false,
    includeTxPowerLevel: false,
    scanResponsePayload: profile.scanResponsePayload,
  });
}

/** Start broadcasting one profile (refreshes Nearby Action auth tag each call). */
export async function startBroadcast(profile: BleProfile): Promise<void> {
  if (profile.kind !== 'manufacturer') {
    throw new Error(
      'Service-kind profiles (Fast Pair) need a different advertise path and are often patched'
    );
  }
  if (
    profile.advertiseMode !== 'continuity-nearby-action' &&
    profile.companyId !== 0x0075
  ) {
    throw new Error(
      'This profile is for study/decode only — use a Nearby Action or Samsung Buds profile'
    );
  }

  await stopBroadcast();
  currentProfile = profile;
  await advertiseOnce(profile);
}

/**
 * Rotate through broadcastable profiles.
 * Re-advertises every intervalMs with a fresh auth tag (Apple) or next Samsung variant.
 */
export async function startRotatingBroadcast(
  intervalMs: number = 1000
): Promise<void> {
  const profiles = getBroadcastableProfiles();
  if (profiles.length === 0) {
    throw new Error('No broadcastable profiles');
  }

  await stopBroadcast();
  let index = 0;
  currentProfile = profiles[0];
  await advertiseOnce(profiles[0]);

  rotateTimer = setInterval(() => {
    index = (index + 1) % profiles.length;
    const next = profiles[index];
    currentProfile = next;
    advertiseOnce(next).catch((err) => {
      console.error('Rotate advertise failed', err);
    });
  }, intervalMs);
}

export async function stopBroadcast(): Promise<void> {
  if (rotateTimer) {
    clearInterval(rotateTimer);
    rotateTimer = null;
  }
  currentProfile = null;

  if (Platform.OS !== 'android' || !ContinuityAdvertiser) {
    return;
  }
  try {
    await ContinuityAdvertiser.stopAdvertise();
  } catch {
    // ignore if nothing was advertising
  }
}

export function getCurrentBroadcastProfile(): ManufacturerProfile | null {
  return currentProfile;
}

export { getBroadcastableProfiles };
