import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import RNBootSplash

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // GoogleService-info.plist를 읽어 Firebase(App/Crashlytics 등)를 부트스트랩한다.
    // React Native가 뜨기 전, 앱 시작 시점에 한 번만 호출하면 됨.
    FirebaseApp.configure()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "ReceiptScannerApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  // react-native-bootsplash 공식 가이드: RCTRootView가 만들어지는 시점(customize)에
  // BootSplash.storyboard를 얹어서, JS 번들 로딩이 끝날 때까지 네이티브 스플래시가
  // 화면을 덮고 있게 한다. 실제로 가리는 건 BootSplash.hide()가 호출될 때(RootNavigator).
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
