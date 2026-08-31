package com.silverj0805.receiptscannerapp

import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {

  // react-native-screens 공식 가이드: Activity가 재시작될 때 화면(Fragment)의 View 상태가
  // 유실되지 않도록, super.onCreate() 호출 전에 커스텀 FragmentFactory를 지정해야 함.
  // RNBootSplash.init도 react-native-bootsplash 공식 가이드대로 super.onCreate() 이전에 호출.
  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(savedInstanceState)
    // Android 13+: 최근 앱(스위처) 썸네일만 비활성. FLAG_SECURE와 달리
    // 앱 사용 중 스크린샷/녹화는 막지 않는다.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      setRecentsScreenshotEnabled(false)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ReceiptScannerApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
