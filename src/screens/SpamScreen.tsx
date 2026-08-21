import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  getBroadcastableProfiles,
  startAppleSpam,
  startBroadcast,
  startRotatingBroadcast,
  startSamsungSpam,
  startSingleActionSpam,
  stopBroadcast,
} from '../ble/advertiser';
import { ManufacturerProfile } from '../ble/profiles';

const PROFILES = getBroadcastableProfiles();

async function requestAdvertisePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  if (Platform.Version < 31) return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function SpamScreen() {
  const [selectedId, setSelectedId] = useState(PROFILES[0]?.id ?? null);
  const [mode, setMode] = useState<
    'idle' | 'single' | 'apple' | 'samsung' | 'mix' | 'pulse'
  >('idle');
  const [statusLabel, setStatusLabel] = useState('Idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopBroadcast().catch(() => {});
    };
  }, []);

  const selected = PROFILES.find((p) => p.id === selectedId) ?? null;
  const busy = mode !== 'idle';

  async function withPermission(run: () => Promise<void>) {
    setErrorMessage(null);
    const ok = await requestAdvertisePermission();
    if (!ok) {
      setErrorMessage('BLUETOOTH_ADVERTISE permission not granted');
      return;
    }
    await run();
  }

  async function handleStartSingle() {
    if (!selected) return;
    try {
      await withPermission(async () => {
        await startBroadcast(selected);
        setMode('single');
        setStatusLabel(`Holding: ${selected.label}`);
      });
    } catch (e) {
      setMode('idle');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to start');
    }
  }

  async function handleAppleSpam() {
    try {
      await withPermission(async () => {
        await startAppleSpam({
          onProfile: (p) => setStatusLabel(`Apple spam → ${p.label}`),
        });
        setMode('apple');
        setStatusLabel('Apple spam running (stop→gap→next)');
      });
    } catch (e) {
      setMode('idle');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to start Apple spam');
    }
  }

  async function handleSamsungSpam() {
    try {
      await withPermission(async () => {
        await startSamsungSpam({
          onProfile: (p) => setStatusLabel(`Samsung spam → ${p.label}`),
        });
        setMode('samsung');
        setStatusLabel('Samsung spam running');
      });
    } catch (e) {
      setMode('idle');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to start Samsung spam');
    }
  }

  async function handleMixRotate() {
    try {
      await withPermission(async () => {
        await startRotatingBroadcast(500, {
          onProfile: (p) => setStatusLabel(`Mix → ${p.label}`),
        });
        setMode('mix');
        setStatusLabel('Mix rotate running');
      });
    } catch (e) {
      setMode('idle');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to rotate');
    }
  }

  async function handlePulseSelected() {
    if (!selected || selected.advertiseMode !== 'continuity-nearby-action') {
      setErrorMessage('Pick an Apple Nearby Action profile for pulse mode');
      return;
    }
    try {
      await withPermission(async () => {
        await startSingleActionSpam(selected, {
          onProfile: (p) => setStatusLabel(`Pulsing ${p.label} (new auth tag)`),
        });
        setMode('pulse');
        setStatusLabel(`Pulsing: ${selected.label}`);
      });
    } catch (e) {
      setMode('idle');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to pulse');
    }
  }

  async function handleStop() {
    await stopBroadcast();
    setMode('idle');
    setStatusLabel('Idle');
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Broadcast Lab</Text>
        <Text style={styles.body}>
          iOS blocks third-party apps from broadcasting manufacturer-specific BLE
          data (CoreBluetooth). Use an Android phone as the sender.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Broadcast Lab</Text>
      <Text style={styles.warning}>
        Spam modes stop→gap→start each packet (like Bluetooth-LE-Spam). iPhone may
        still cool down after one popup per action — lock/unlock the iPhone or
        dismiss the card to see more. “Join This AppleTV?” often reappears better
        than others.
      </Text>

      <Text style={styles.section}>Pick a profile</Text>
      <FlatList
        data={PROFILES}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }: { item: ManufacturerProfile }) => (
          <Pressable
            onPress={() => !busy && setSelectedId(item.id)}
            style={[styles.row, selectedId === item.id && styles.rowSelected]}
          >
            <Text style={styles.rowTitle}>{item.label}</Text>
            <Text style={styles.meta}>Targets: {item.targets}</Text>
          </Pressable>
        )}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Text style={styles.status}>{statusLabel}</Text>

      {busy ? (
        <Pressable onPress={handleStop} style={[styles.button, styles.stop]}>
          <Text style={styles.buttonText}>Stop</Text>
        </Pressable>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={handleAppleSpam} style={styles.button}>
            <Text style={styles.buttonText}>Spam Apple (fast cycle)</Text>
          </Pressable>
          <Pressable onPress={handleSamsungSpam} style={[styles.button, styles.secondary]}>
            <Text style={styles.buttonText}>Spam Samsung</Text>
          </Pressable>
          <Pressable onPress={handlePulseSelected} style={[styles.button, styles.secondary]}>
            <Text style={styles.buttonText}>Pulse selected Apple action</Text>
          </Pressable>
          <Pressable onPress={handleMixRotate} style={[styles.button, styles.secondary]}>
            <Text style={styles.buttonText}>Mix rotate</Text>
          </Pressable>
          <Pressable
            onPress={handleStartSingle}
            style={[styles.button, styles.secondary]}
            disabled={!selected}
          >
            <Text style={styles.buttonText}>Hold selected (no cycle)</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  warning: { marginBottom: 16, color: '#8a4b00', lineHeight: 20 },
  body: { lineHeight: 20 },
  section: { fontWeight: 'bold', marginBottom: 8 },
  list: { flexGrow: 0, maxHeight: 220, marginBottom: 12 },
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowSelected: { backgroundColor: '#e8f1ff' },
  rowTitle: { fontWeight: '600' },
  meta: { color: '#666', fontSize: 12, marginTop: 2 },
  status: { marginBottom: 12, color: '#666' },
  actions: { gap: 8 },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondary: { backgroundColor: '#444' },
  stop: { backgroundColor: '#d32f2f' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 8 },
});
