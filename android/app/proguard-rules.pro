# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# --- react-native-config ---
# 공식 가이드(README "Problems with Proguard"): R8이 BuildConfig 클래스 이름을
# 바꿔버리면 react-native-config가 이 클래스를 못 찾아서 Config가 비게 됨.
-keep class com.silverj0805.receiptscannerapp.BuildConfig { *; }

# --- JNI 네이티브 메서드 보존 (범용) ---
# react-native-vision-camera, react-native-nitro-modules/nitro-image 등 JNI로
# 네이티브 라이브러리를 호출하는 모듈들은 자체 consumer proguard 규칙을 배포하지
# 않는 게 실제로 설치된 AAR을 열어서 확인됨(비어 있음) — 즉 이 프로젝트의
# proguard-rules.pro에서 직접 챙겨야 함. 아래 규칙은 실제로 ML Kit이 자기
# AAR(text-recognition-korean, text-recognition-bundled-common)에 번들해서
# 쓰는 것과 동일한 패턴 — Java 쪽 네이티브 메서드 시그니처가 난독화로 바뀌면
# UnsatisfiedLinkError로 크래시남.
-keepclasseswithmembernames class * {
    native <methods>;
}

# --- react-native-vision-camera ---
# react-native-vision-camera는 Nitro 기반이라 패키지가 com.margelo.nitro.camera.
# consumer proguard 규칙이 비어 있고, 실제로 release+Proguard 조합에서
# "모든 훅이 undefined가 됨" 크래시가 보고된 적이 있어(mrousavy/react-native-vision-camera#3830)
# 방어적으로 패키지 전체를 keep.
-keep class com.margelo.nitro.camera.** { *; }

# --- react-native-nitro-modules / react-native-nitro-image ---
# 위와 같은 이유(Nitro/JSI 바인딩, consumer proguard 규칙 없음)로 방어적으로 keep.
-keep class com.margelo.nitro.** { *; }

# --- Firebase Crashlytics ---
# 공식 가이드(https://firebase.google.com/docs/crashlytics/android/get-deobfuscated-reports):
# 난독화된 릴리즈 빌드에서도 크래시 리포트에 파일명·라인 번호가 남도록 보존.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keep public class * extends java.lang.Exception
