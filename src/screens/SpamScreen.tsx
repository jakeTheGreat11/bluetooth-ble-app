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
  startBroadcast,
  startRotatingBroadcast,
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
  const [mode, setMode] = useState<'idle' | 'single' | 'rotate'>('idle');
  const [statusLabel, setStatusLabel] = useState('Idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopBroadcast().catch(() => {});
    };
  }, []);

  const selected =
    PROFILES.find((p) => p.id === selectedId) ?? null;

  async function handleStartSingle() {
    if (!selected) return;
    try {
      setErrorMessage(null);
      const ok = await requestAdvertisePermission();
      if (!ok) {
        setErrorMessage('BLUETOOTH_ADVERTISE permission not granted');
        return;
      }
      await startBroadcast(selected);
      setMode('single');
      setStatusLabel(`Broadcasting: ${selected.label}`);
    } catch (e) {
      setMode('idle');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to start');
    }
  }

  async function handleStartRotate() {
    try {
      setErrorMessage(null);
      const ok = await requestAdvertisePermission();
      if (!ok) {
        setErrorMessage('BLUETOOTH_ADVERTISE permission not granted');
        return;
      }
      await startRotatingBroadcast(1000);
      setMode('rotate');
      setStatusLabel('Rotating Apple + Samsung profiles (1s)');
    } catch (e) {
      setMode('idle');
      setErrorMessage(e instanceof Error ? e.message : 'Failed to rotate');
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
          data (CoreBluetooth). Use an Android phone as the sender. Test Apple
          Continuity popups on a nearby iPhone; Samsung Easy Setup on a Samsung
          phone.
        </Text>
      </View>
    );
  }

  const busy = mode !== 'idle';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Broadcast Lab</Text>
      <Text style={styles.warning}>
        Broadcasts to anyone nearby with Bluetooth scanning on — not one selected
        phone. Apple profiles → test on an iPhone. Samsung profiles → test on a
        Samsung phone. Only use on your own devices or with consent.
      </Text>

      <Text style={styles.section}>Pick a profile (for Start single)</Text>
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
          <Pressable
            onPress={handleStartSingle}
            style={styles.button}
            disabled={!selected}
          >
            <Text style={styles.buttonText}>Start selected</Text>
          </Pressable>
          <Pressable
            onPress={handleStartRotate}
            style={[styles.button, styles.secondary]}
          >
            <Text style={styles.buttonText}>Rotate all (1s)</Text>
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
  list: { flexGrow: 0, maxHeight: 300, marginBottom: 12 },
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowSelected: { backgroundColor: '#e8f1ff' },
  rowTitle: { fontWeight: '600' },
  meta: { color: '#666', fontSize: 12, marginTop: 2 },
  status: { marginBottom: 12, color: '#666' },
  actions: { gap: 10 },
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
