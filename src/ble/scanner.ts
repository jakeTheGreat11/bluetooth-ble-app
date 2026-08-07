import { BleManager, Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { fromByteArray, toByteArray } from 'base64-js';


const manager = new BleManager();

