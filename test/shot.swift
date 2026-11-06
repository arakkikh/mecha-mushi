// WebKitでページを開き、手順ファイルに従ってJSを実行→スクショを撮るテスト用ツール
// 使い方: swift test/shot.swift <URL> <手順ファイル>
// 手順ファイルの各行: 待ち秒数 | 出力PNG（空なら撮らない） | 実行するJS
import Cocoa
import WebKit

let args = CommandLine.arguments
let url = URL(string: args[1])!
let steps = try! String(contentsOfFile: args[2], encoding: .utf8)
  .split(separator: "\n").map(String.init).filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty && !$0.hasPrefix("#") }

class Runner: NSObject, WKNavigationDelegate {
  let web: WKWebView
  var idx = 0
  init(_ w: WKWebView) { web = w }
  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { next() }
  func next() {
    if idx >= steps.count {
      web.evaluateJavaScript("JSON.stringify(window.__errs||[])") { r, _ in
        print("JSエラー: \(r ?? "?")"); exit(0)
      }
      return
    }
    let parts = steps[idx].components(separatedBy: "|")
    idx += 1
    let delay = Double(parts[0].trimmingCharacters(in: .whitespaces)) ?? 0.5
    let out = parts.count > 1 ? parts[1].trimmingCharacters(in: .whitespaces) : ""
    let js = parts.count > 2 ? parts[2...].joined(separator: "|").trimmingCharacters(in: .whitespaces) : ""
    let run = {
      DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
        if out.isEmpty { self.next(); return }
        let cfg = WKSnapshotConfiguration()
        self.web.takeSnapshot(with: cfg) { img, err in
          if let img = img, let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
             let png = rep.representation(using: .png, properties: [:]) {
            try? png.write(to: URL(fileURLWithPath: out)); print("保存: \(out)")
          } else { print("スクショ失敗: \(String(describing: err))") }
          self.next()
        }
      }
    }
    if js.isEmpty { run() } else {
      web.evaluateJavaScript(js) { r, e in
        if let e = e { print("JS実行エラー(\(self.idx)): \(e)") } else if let r = r { print("→ \(r)") }
        run()
      }
    }
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let conf = WKWebViewConfiguration()
let catcher = WKUserScript(source: "window.__errs=[];window.addEventListener('error',e=>window.__errs.push(e.message+' @'+e.lineno));",
                           injectionTime: .atDocumentStart, forMainFrameOnly: true)
conf.userContentController.addUserScript(catcher)
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: 390, height: 844), configuration: conf)
web.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
let win = NSWindow(contentRect: web.frame, styleMask: [.borderless], backing: .buffered, defer: false)
win.contentView = web
win.setFrameOrigin(NSPoint(x: -3000, y: -3000))
win.orderBack(nil)
let runner = Runner(web)
web.navigationDelegate = runner
web.load(URLRequest(url: url))
DispatchQueue.main.asyncAfter(deadline: .now() + 120) { print("タイムアウト"); exit(1) }
app.run()
