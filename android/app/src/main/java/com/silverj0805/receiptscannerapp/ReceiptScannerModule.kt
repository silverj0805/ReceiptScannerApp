package com.silverj0805.receiptscannerapp

import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions

class ReceiptScannerModule(reactContext: ReactApplicationContext) :
  NativeReceiptScannerSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  override fun scanText(imageUri: String, promise: Promise) {
    try {
      val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
      val image = InputImage.fromFilePath(reactApplicationContext, Uri.parse(imageUri))

      recognizer.process(image)
        .addOnSuccessListener { visionText ->
          promise.resolve(visionText.text)
        }
        .addOnFailureListener { e ->
          promise.reject("SCAN_ERROR", e)
        }
    } catch (e: Exception) {
      promise.reject("SCAN_ERROR", e)
    }
  }
}
