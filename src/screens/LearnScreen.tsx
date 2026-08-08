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
        Short notes on how BLE advertising and the “pairing popup” trick work.
        Use this as a lab notebook, not as a how-to for bothering strangers.
      </Text>

      <Section title="1. Central vs peripheral">
        {`A peripheral broadcasts small advertising packets. A central (your phone’s Bluetooth stack, or our Scan tab) listens for those packets.

No connection is required to see an advertisement. That’s why a fake “AirPods nearby” popup can appear without anyone pairing.`}
      </Section>

      <Section title="2. Advertising data (AD) = TLV chunks">
        {`Each advertisement is a list of chunks stacked back-to-back:

[length][type][value] [length][type][value] …

• length — how many bytes follow (type + value)
• type — what kind of data (e.g. 0xFF = Manufacturer Specific Data, 0x16 = Service Data)
• value — the actual bytes

Our decode.ts walks this structure and tries to match known profiles.`}
      </Section>

      <Section title="3. Why the pairing popup fires">
        {`Phones watch for familiar advertisement patterns while Bluetooth is on:

• Apple Continuity / Proximity Pairing (company ID 0x004C) — AirPods-style cards
• Samsung Easy Setup (company ID 0x0075) — Galaxy Buds-style cards
• Google Fast Pair (service UUID 0xFE2C) — Android Fast Pair cards

If the bytes look like a real accessory, the OS may show a setup UI. The pattern is public; the OS is just trusting the advertisement.`}
      </Section>

      <Section title="4. Profiles in this app">
        {`profiles.ts is a reference list of those byte patterns. The same list is used two ways:

• Scan + decode — recognize nearby ads that match a profile
• Broadcast Lab — replay a manufacturer profile on Android

Accessories (AirPods, Buds, Beats, etc.) are what we model. Phones/tablets are usually the receivers of the popup, not the fake identity we broadcast.`}
      </Section>

      <Section title="5. Broadcast is not targeted">
        {`Starting Broadcast Lab does not send a message to one phone you picked from a list. It advertises to everyone in radio range with Bluetooth scanning on.

That’s why this app has a separate Broadcast tab instead of “attack this device.”`}
      </Section>

      <Section title="6. Why iOS can’t run Broadcast Lab">
        {`Apple’s CoreBluetooth API lets apps advertise a local name and service UUIDs, but not custom manufacturer data. The popup trick needs that manufacturer payload, so third-party iOS apps can’t do this broadcast.

Android’s BluetoothLeAdvertiser allows manufacturer data, so Broadcast Lab is Android-only. iOS can still scan and learn.`}
      </Section>

      <Section title="7. Mitigations (defensive side)">
        {`• Turn Bluetooth off when you don’t need it
• Keep the OS updated (vendors rate-limit or patch popup spam over time)
• Don’t approve unexpected pairing cards
• Treat unsolicited setup popups as a signal someone nearby may be advertising fake accessory packets`}
      </Section>

      <Section title="8. Responsible use">
        {`Only broadcast against devices you own, or with clear consent from everyone nearby. Spamming strangers in public is a nuisance and may be unlawful depending on where you are.

This project exists to study the protocol and the OS behavior — not to harass people.`}
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
