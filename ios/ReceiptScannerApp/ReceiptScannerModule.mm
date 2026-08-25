//  ReceiptScannerModule.mm
//  ReceiptScannerApp

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <React_RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <ReceiptScannerSpecs/ReceiptScannerSpecs.h>
#import "ReceiptScannerApp-Swift.h"

NS_ASSUME_NONNULL_BEGIN

@interface ReceiptScannerModule : NSObject <NativeReceiptScannerSpec>
@end

NS_ASSUME_NONNULL_END

@implementation ReceiptScannerModule {
  ReceiptScannerCalculator *_calculator;
}

- (instancetype)init
{
  if (self = [super init]) {
    _calculator = [ReceiptScannerCalculator new];
  }
  return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeReceiptScannerSpecJSI>(params);
}

- (NSNumber *)multiply:(double)a b:(double)b
{
  return [_calculator multiplyWithA:a b:b];
}

+ (NSString *)moduleName
{
  return @"ReceiptScanner";
}

@end
