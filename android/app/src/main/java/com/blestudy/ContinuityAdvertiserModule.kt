package com.blestudy

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

/**
 * Manufacturer-data-only BLE advertiser.
 * Unlike react-native-ble-advertiser, this does NOT force a service UUID into the packet
 * (required for Continuity / Easy Setup popups within the 31-byte legacy limit).
 */
class ContinuityAdvertiserModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val TAG = "ContinuityAdvertiser"
  }

  private var advertiser: BluetoothLeAdvertiser? = null
  private var callback: AdvertiseCallback? = null

  override fun getName(): String = "ContinuityAdvertiser"

  @ReactMethod
  fun startManufacturerAdvertise(
    companyId: Int,
    payload: ReadableArray,
    options: ReadableMap?,
    promise: Promise
  ) {
    try {
      val adapter = bluetoothAdapter()
      if (adapter == null) {
        promise.reject("NO_ADAPTER", "Bluetooth adapter unavailable")
        return
      }
      if (!adapter.isEnabled) {
        promise.reject("BT_OFF", "Bluetooth is disabled")
        return
      }

      val leAdvertiser = adapter.bluetoothLeAdvertiser
      if (leAdvertiser == null) {
        promise.reject("NO_ADVERTISER", "BLE advertiser unavailable on this device")
        return
      }

      stopInternal()

      val manufBytes = toByteArray(payload)
      // Flags (~3) + manuf AD header/company (~4) + payload must fit in 31 bytes.
      if (manufBytes.size > 24) {
        promise.reject(
          "DATA_TOO_LARGE",
          "Manufacturer payload is ${manufBytes.size} bytes; keep <= 24 for legacy ads"
        )
        return
      }

      val connectable =
        if (options != null && options.hasKey("connectable")) options.getBoolean("connectable")
        else false
      val includeTxPower =
        if (options != null && options.hasKey("includeTxPowerLevel"))
          options.getBoolean("includeTxPowerLevel")
        else false

      val settings = AdvertiseSettings.Builder()
        .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
        .setConnectable(connectable)
        .setTimeout(0)
        .build()

      val dataBuilder = AdvertiseData.Builder()
        .setIncludeDeviceName(false)
        .setIncludeTxPowerLevel(includeTxPower)
        .addManufacturerData(companyId, manufBytes)

      val advertiseData = dataBuilder.build()

      var scanResponse: AdvertiseData? = null
      if (options != null && options.hasKey("scanResponsePayload")) {
        val sr = options.getArray("scanResponsePayload")
        if (sr != null && sr.size() > 0) {
          scanResponse = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(false)
            .addManufacturerData(companyId, toByteArray(sr))
            .build()
        }
      }

      val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
          Log.i(TAG, "Advertising started companyId=$companyId bytes=${manufBytes.size}")
          promise.resolve("started")
        }

        override fun onStartFailure(errorCode: Int) {
          val message = when (errorCode) {
            ADVERTISE_FAILED_DATA_TOO_LARGE ->
              "Advertise data larger than 31 bytes"
            ADVERTISE_FAILED_TOO_MANY_ADVERTISERS ->
              "Too many advertisers"
            ADVERTISE_FAILED_ALREADY_STARTED ->
              "Advertising already started"
            ADVERTISE_FAILED_INTERNAL_ERROR ->
              "Internal advertising error"
            ADVERTISE_FAILED_FEATURE_UNSUPPORTED ->
              "Advertising feature unsupported"
            else -> "Advertising failed: $errorCode"
          }
          Log.e(TAG, message)
          promise.reject("ADVERTISE_FAILED", message)
        }
      }

      callback = advertiseCallback
      advertiser = leAdvertiser

      if (scanResponse != null) {
        leAdvertiser.startAdvertising(settings, advertiseData, scanResponse, advertiseCallback)
      } else {
        leAdvertiser.startAdvertising(settings, advertiseData, advertiseCallback)
      }
    } catch (e: Exception) {
      Log.e(TAG, "startManufacturerAdvertise failed", e)
      promise.reject("ADVERTISE_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun stopAdvertise(promise: Promise) {
    try {
      stopInternal()
      promise.resolve("stopped")
    } catch (e: Exception) {
      promise.reject("STOP_ERROR", e.message, e)
    }
  }

  private fun stopInternal() {
    val adv = advertiser
    val cb = callback
    if (adv != null && cb != null) {
      try {
        adv.stopAdvertising(cb)
      } catch (_: Exception) {
      }
    }
    advertiser = null
    callback = null
  }

  private fun bluetoothAdapter(): BluetoothAdapter? {
    val manager =
      reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
    return manager?.adapter
  }

  private fun toByteArray(array: ReadableArray): ByteArray {
    val out = ByteArray(array.size())
    for (i in 0 until array.size()) {
      out[i] = array.getInt(i).toByte()
    }
    return out
  }
}
