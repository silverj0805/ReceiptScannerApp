//  ReceiptScannerModule.mm
//  ReceiptScannerApp

#import <UIKit/UIKit.h>
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "ReceiptScannerApp-Swift.h"
#import <ReceiptScannerSpecs/ReceiptScannerSpecs.h>

@interface ReceiptScannerModule () <NativeReceiptScannerSpec>
@end

@implementation ReceiptScannerModule (TurboModule)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeReceiptScannerSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"ReceiptScanner";
}

@end
