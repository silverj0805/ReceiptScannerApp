package com.receiptscannerapp

import com.facebook.react.bridge.ReactApplicationContext

class ReceiptScannerModule(reactContext: ReactApplicationContext) :
  NativeReceiptScannerSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
