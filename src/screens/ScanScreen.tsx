import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { requestBlePermissions, startScan, stopScan } from '../ble/scanner';
import { decodeProfile } from '../ble/decode'
type ScannedDevice = {
  id: string;
  name: string;
  rssi: number | null;
  label: string;
};

export function ScanScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Record<string, ScannedDevice>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopScan().catch(() => {});
    };
  }, []);

  async function handleToggleScan() {
    if (isScanning) {
      await stopScan();
      setIsScanning(false);
      return;
    }

    const granted = await requestBlePermissions();
    if (!granted) {
        setErrorMessage('Bluetooth permissions not granted');
        return;
    }

    setIsScanning(true);
    await startScan((device, rawBytes) => {
      const profile = decodeProfile(rawBytes);
      const entry: ScannedDevice = {
        id: device.id,
        name: device.localName ?? device.name ?? 'Unknown',
        rssi: device.rssi,
        label: profile?.label ?? 'Unknown',
      };

      setDevices((prev) => ({ ...prev, [device.id]: entry }));
    });
  }

  const list = Object.values(devices);
  if (errorMessage) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{errorMessage}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Pressable onPress={handleToggleScan} style={styles.button}>
        <Text style={styles.buttonText}>
          {isScanning ? 'Stop' : 'Scan for devices'}
        </Text>
      </Pressable>

      <Text style={styles.count}>{list.length} device(s) seen</Text>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.label}>{item.label}</Text>
            <Text>{item.name}</Text>
            <Text style={styles.meta}>RSSI: {item.rssi ?? 'n/a'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  count: { marginBottom: 8, color: '#666' },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontWeight: 'bold' },
  meta: { color: '#666', fontSize: 12 },
  error: { color: 'red', fontWeight: 'bold' },
});