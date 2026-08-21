import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

function Section({ title, children }: { title: string; children: string }) {
  return (
    <>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </>
  );
}

export function LearnScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Learn</Text>
      <Text style={styles.intro}>
        Lab notes on BLE advertising and pairing-popup spam. Use on your own
        devices or with consent only.
      </Text>

      <Section title="1. Central vs peripheral">
        {`A peripheral broadcasts advertising packets. A central listens.

Popups do not require a completed pairing. The phone’s OS reacts to familiar advertisement bytes.`}
      </Section>

      <Section title="2. 31-byte legacy limit (why our first attempt failed)">
        {`Legacy BLE ads are max 31 bytes total.

Working Continuity spam sends ONLY manufacturer data (no service UUID, no device name).

react-native-ble-advertiser always adds a 128-bit service UUID, so AirPods-sized payloads fail with DATA_TOO_LARGE or never look like Continuity.

Broadcast Lab now uses a custom ContinuityAdvertiser native module (manufacturer-data only).`}
      </Section>

      <Section title="3. Apple Continuity that still works well">
        {`Nearby Action (type 0x0F) — short 7-byte payload after Apple company ID 0x004C:

0x0F, 0x05, flags, action, rand, rand, rand

Examples: Setup New iPhone (0x09), AppleTV / Watch / HomePod actions.

Proximity Pairing (0x07, AirPods) is longer and more often rate-limited. We keep it for study/decode, not as the primary broadcast.`}
      </Section>

      <Section title="4. Samsung Easy Setup">
        {`Company ID 0x0075. Public tools use a Buds template plus many device-ID variants (Flipper / Bluetooth-LE-Spam).

Popups target Samsung phones, not iPhones. We include several Buds/Buds2 color variants from that public list.`}
      </Section>

      <Section title="5. Who sees what">
        {`• Apple Continuity → test on an iPhone/iPad (BT on)
• Samsung Easy Setup → test on a Samsung Android
• Google Fast Pair → often patched on modern Android

Broadcasting Apple packets will not make another Android show an AirPods card.`}
      </Section>

      <Section title="6. Rotation and why iPhone only pops once">
        {`iOS often shows one Continuity popup per action, then cools down until you dismiss it or lock/unlock the phone.

Working spam tools don’t leave one ad running — they stop → short gap → start the next packet with a new auth tag / action (Bluetooth-LE-Spam queue).

Use “Spam Apple (fast cycle)” for that. “Join This AppleTV?” often reappears better than Setup New iPhone. Samsung is less picky because each Buds ID looks like a different device.`}
      </Section>

      <Section title="7. Control test">
        {`If our app still shows nothing, install Bluetooth-LE-Spam (F-Droid/GitHub) on the same Android sender and test against your iPhone.

• That works, ours doesn’t → our packet/settings bug
• Neither works → iOS version, distance, BT off, or OS cooldowns`}
      </Section>

      <Section title="8. Responsible use">
        {`Only broadcast against devices you own, or with clear consent from everyone nearby.`}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  intro: { fontSize: 14, lineHeight: 20, color: '#444', marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 21, color: '#222', marginBottom: 4 },
});
