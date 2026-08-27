import Foundation
import Vision

@objcMembers public class ReceiptScannerCalculator: NSObject {
  public func multiply(a: Double, b: Double) -> NSNumber {
    return NSNumber(value: a * b)
  }

  public func scanText(
    imageUri: String,
    resolve: @escaping (String) -> Void,
    reject: @escaping (String, String, NSError?) -> Void
  ) {
    guard let url = URL(string: imageUri) else {
      reject("SCAN_ERROR", "Invalid image URI: \(imageUri)", nil)
      return
    }

    // VNImageRequestHandler.perform()은 동기(블로킹) + throws이기 때문에
    // 호출 스레드가 안전하게 감당할 수 있도록 백그라운드 큐로 직접 dispatch한다.
    // (perform() 자체는 여전히 블로킹 — 그 블로킹을 어느 스레드가 떠안을지만 바꾸는 것)
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        // 이미지 URL 하나를 대상으로 Vision 요청(들)을 실행해주는 핸들러.
        // ML Kit의 InputImage.fromFilePath에 대응 — url이 가리키는 파일을 읽어 처리한다.
        let handler = VNImageRequestHandler(url: url, options: [:])

        // "텍스트를 인식해줘"라는 요청 객체. 아직 아무것도 실행되지 않은 상태이고,
        // 아래에서 옵션을 채운 다음 handler.perform으로 넘겨야 실제로 동작한다.
        let request = VNRecognizeTextRequest()

        // .accurate: 정확도 우선(느림) / .fast: 속도 우선(부정확).
        // 영수증은 글씨가 작고 촘촘해서 정확도를 우선한다.
        request.recognitionLevel = .accurate

        // 인식 대상 언어. 한국어(ko-KR)가 우선이고, 가격·전화번호 등에 섞여 나오는
        // 영문/숫자 표기를 위해 en-US도 같이 넣는다.
        // 주의: 한국어 인식은 iOS 16+(Revision3)부터 지원 — 그 이하 버전에서는 실기기 검증 필요.
        request.recognitionLanguages = ["ko-KR", "en-US"]

        // OCR이 인식한 글자를 언어 사전 기반으로 보정할지 여부.
        // 오탈자를 조금 줄여주지만, 사전에 없는 상호명 등은 오히려 엉뚱하게 고칠 수도 있다.
        request.usesLanguageCorrection = true

        // 실제 OCR이 일어나는 지점 — 여기서 호출 스레드(=지금 이 async 블록을 실행 중인
        // 백그라운드 스레드)가 인식이 끝날 때까지 블로킹된다. 실패하면 즉시 throw.
        try handler.perform([request])

        // request.results는 [VNRecognizedTextObservation]? — 인식된 "덩어리"들의 배열.
        // 아직 아무 것도 없을 수 있으니(nil) 빈 배열로 대체해서 이후 처리를 단순화한다.
        let observations = request.results ?? []

        // 각 덩어리(observation)마다 여러 개의 인식 후보가 있을 수 있는데,
        // topCandidates(1)로 가장 신뢰도 높은 후보 1개만 꺼낸다.
        // compactMap으로 nil(후보가 아예 없는 경우)은 자동으로 걸러진다.
        let text = observations
          .compactMap { $0.topCandidates(1).first?.string }
          .joined(separator: "\n")

        // 성공 — Promise를 resolve. (ML Kit의 visionText.text와 동일한 형태:
        // 전체 인식 텍스트를 줄바꿈으로 이어붙인 하나의 문자열)
        resolve(text)
      } catch {
        // 실패 — Promise를 reject. 첫 번째 인자(코드)는 JS의 error.code로 구분할 수 있는 값,
        // 두 번째(메시지)는 사람이 읽을 설명, 세 번째는 원본 NSError(디버깅용, 없어도 됨).
        reject("SCAN_ERROR", error.localizedDescription, error as NSError)
      }
    }
  }
}
