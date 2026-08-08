import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_STORAGE_KEY = 'ble-study-consent-accepted';

type Props = {
  onAccept: () => void;
};

export function ConsentScreen({ onAccept }: Props) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkConsent() {
        const consented = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
        if (consented === 'true') {
            onAccept();
        }
    }
    checkConsent();
  }, []);

  async function handleAccept() {
    if (checked) {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      onAccept();
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Before you continue</Text>
      <Text style={styles.body}>
        This app can broadcast real Bluetooth advertisements that any nearby phone with
        Bluetooth scanning on will see. Only use this on devices you own, or with the
        explicit consent of everyone nearby. Repeatedly triggering pairing popups on
        strangers in public can be a nuisance and, depending on your jurisdiction, unlawful.
      </Text>

      <Pressable onPress={() => setChecked(!checked)} style={styles.checkboxRow}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        <Text>I will use this responsibly</Text>
      </Pressable>

      <Pressable
        disabled={!checked}
        onPress={handleAccept}
        style={[styles.button, !checked && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#333' },
  checkboxChecked: { backgroundColor: '#333' },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: 'white', fontWeight: 'bold' },
});