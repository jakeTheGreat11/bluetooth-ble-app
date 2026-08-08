import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { BLE_PROFILES, BleProfile } from '../ble/profiles';
import { startBroadcast, stopBroadcast } from '../ble/advertiser';

// only profiles advertiser.ts can actually send
const MANUFACTURER_PROFILES = BLE_PROFILES.filter(
  (p): p is Extract<BleProfile, { kind: 'manufacturer' }> => p.kind === 'manufacturer'
);

export function SpamScreen() {
  const [selectedId, setSelectedId] = useState(MANUFACTURER_PROFILES[0]?.id ?? null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Story B cleanup: stop if user leaves while broadcasting
  useEffect(() => {
    return () => {
      stopBroadcast().catch(() => {});
    };
  }, []);

  const selected = MANUFACTURER_PROFILES.find((p) => p.id === selectedId) ?? null;

  async function handleStart() {
    if (!selected) return;
    try {
      setErrorMessage(null);
      await startBroadcast(selected)
      setIsBroadcasting(true);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Failed to start broadcast');
      setIsBroadcasting(false);
    }
  }

  async function handleStop() {
    await stopBroadcast();
    setIsBroadcasting(false);
  }

  // iOS: no broadcast controls
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Broadcast Lab</Text>
        <Text style={styles.body}>
          iOS blocks third-party apps from broadcasting manufacturer-specific BLE data
          (CoreBluetooth). Scanning and learning still work; broadcasting only works on Android.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Broadcast Lab</Text>
      <Text style={styles.warning}>
        This broadcasts to anyone nearby with Bluetooth scanning on — not to one selected phone.
        Only use on your own devices or with consent.
      </Text>

      <Text style={styles.section}>Pick a profile</Text>
      <FlatList
        data={MANUFACTURER_PROFILES}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !isBroadcasting && setSelectedId(item.id)}
            style={[styles.row, selectedId === item.id && styles.rowSelected]}
          >
            <Text>{item.label}</Text>
          </Pressable>
        )}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Text style={styles.status}>
        {isBroadcasting ? `Broadcasting: ${selected?.label}` : 'Idle'}
      </Text>

      {isBroadcasting ? (
        <Pressable onPress={handleStop} style={[styles.button, styles.stop]}>
          <Text style={styles.buttonText}>Stop</Text>
        </Pressable>
      ) : (
        <Pressable onPress={handleStart} style={styles.button} disabled={!selected}>
          <Text style={styles.buttonText}>Start</Text>
        </Pressable>
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
  list: { flexGrow: 0, maxHeight: 280, marginBottom: 12 },
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowSelected: { backgroundColor: '#e8f1ff' },
  status: { marginBottom: 12, color: '#666' },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  stop: { backgroundColor: '#d32f2f' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  error: { color: 'red', marginBottom: 8 },
});