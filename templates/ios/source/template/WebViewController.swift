//
//  WebViewController.swift
//  template
//
//  Created by EO3 on 3/13/26.
//

import UIKit
import WebKit

class WebViewController: UIViewController {
    public var webView: WKWebView?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        
        initViews()
        
        loadUrl("__WRAPLY_URL__")
//        loadUrl("http://neighbor.eoserver.kr/")
    }
    
    func initViews() {
        let webView = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
        initWebViewConfig(webView: webView)
        
        webView.navigationDelegate = self
        webView.uiDelegate = self
        
        addWebView(webView)
    }
    
    func initWebViewConfig(webView: WKWebView) {
        // Video Play Options
        webView.configuration.allowsInlineMediaPlayback = true
        if #available(iOS 10.0, *) {
            webView.configuration.mediaTypesRequiringUserActionForPlayback = []
        }
        // Video Play Options
        
        // javascript 활성화
        if #available(iOS 14.0, *) {
            webView.configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        }
        else {
            webView.configuration.preferences.javaScriptEnabled = true
        }
        
        // javascript window open 활성화
        webView.configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        
        //        let domain = Storage.loadString(forKey: .cookieDomain)
        //        let path = Storage.loadString(forKey: .cookiePath)
        //        let value = Storage.loadString(forKey: .cookieValue)
        //
        //        let cookie: [HTTPCookiePropertyKey: Any] = [
        //            .name: "sessionId",
        //            .domain: domain,
        //            .path: path,
        //            .value: value
        //        ]
        //
        //        if let httpCookie = HTTPCookie(properties: cookie) {
        //            webView.configuration.websiteDataStore.httpCookieStore.setCookie(httpCookie)
        //        }
        
        if #available(iOS 15.4, *) {
            webView.configuration.preferences.isElementFullscreenEnabled = true
        }
        else {
            // Fallback on earlier versions
        }
        
        webView.evaluateJavaScript("navigator.userAgent") { (result, error) in
            guard let result = result else {
                return
            }
            
            print(result)
            
            // Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
            // Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
            // Mozilla/5.0 (iPad; CPU OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148
            
            //            webView.customUserAgent = "\(result) Native/JIOS"
            
            if let userAgent = webView.customUserAgent {
                print("\(userAgent)")
            }
        }
        
        // WebView 불투명도 없애기
        //        webView.backgroundColor = .active
        webView.isOpaque = false
        
        webView.allowsBackForwardNavigationGestures = true
        
        // WebView fullscreen 지원
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        if #available(iOS 16.4, *) {
            //#if DEBUG
            webView.isInspectable = true
            //#endif
        }
    }
    
    func addWebView(_ webView: WKWebView) {
        view.addSubview(webView)
        
        webView.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
        
        self.webView = webView
    }

    private func loadUrl(_ urlString: String) {
        if let url = URL(string: urlString) {
            webView?.load(URLRequest(url: url))
        }
    }
}

// MARK: WKUIDelegate

extension WebViewController: WKUIDelegate {
}

// MARK: WKNavigationDelegate

extension WebViewController: WKNavigationDelegate {
}
