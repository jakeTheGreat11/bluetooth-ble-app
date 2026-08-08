import { BleManager, Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { toByteArray } from 'base64-js';


const manager = new BleManager();

export async function requestBlePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    for (const permission of Object.values(result)) {
        if (permission.toLowerCase() !== 'granted'.toLowerCase()) return false;
    }
    return true;
}

export async function startScan(onDeviceFound: (device: Device, rawBytes: number[]) => void): Promise<void> {
    await manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
            console.error('Error scanning for devices:', error);
            return;
        }
        if (!device) return;

        const rawBytes = Array.from(toByteArray(device.rawScanRecord));
        onDeviceFound(device, rawBytes)
    });
}

export async function stopScan(): Promise<void> {
    await manager.stopDeviceScan();
}