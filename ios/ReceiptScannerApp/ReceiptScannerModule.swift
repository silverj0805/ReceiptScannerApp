import Foundation

@objc(ReceiptScannerModule)
public class ReceiptScannerModule: NSObject {
  @objc(multiply:b:)
  public func multiply(_ a: Double, b: Double) -> NSNumber {
    return NSNumber(value: a * b)
  }
}
