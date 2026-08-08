import BLEAdvertiser from 'react-native-ble-advertiser';
import { BleProfile } from './profiles';

const PLACEHOLDER_UUID = '0000180d-0000-1000-8000-00805f9b34fb';

export async function startBroadcast(profile: BleProfile): Promise<void> {
  if (profile.kind !== 'manufacturer') {
    throw new Error('Service-kind profiles are not supported yet');
  }

  BLEAdvertiser.setCompanyId(profile.companyId);

  await BLEAdvertiser.broadcast(PLACEHOLDER_UUID, profile.payload, { connectable: false });
}

export async function stopBroadcast(): Promise<void> {
  await BLEAdvertiser.stopBroadcast();
}