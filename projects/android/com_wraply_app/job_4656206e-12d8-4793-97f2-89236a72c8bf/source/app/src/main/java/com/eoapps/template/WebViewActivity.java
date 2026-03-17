package com.eoapps.template;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.eoapps.template.databinding.ActivityWebViewBinding;

public class WebViewActivity extends AppCompatActivity {
    private ActivityWebViewBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        EdgeToEdge.enable(this);

        binding = ActivityWebViewBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        initViews();
    }

    private void initViews() {
        initWebViewConfig(binding.webView);
        binding.webView.loadUrl("https://developer.mozilla.org/ko/");
//        binding.webView.loadUrl("http://neighbor.eoserver.kr/");
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void initWebViewConfig(WebView webView) {
        webView.setHapticFeedbackEnabled(false);
        webView.setInitialScale(1);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
//        webView.setOverScrollMode(View.OVER_SCROLL_NEVER); // 오버 스크롤 허용 안함
        webView.setScrollbarFadingEnabled(false);
        webView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
        webView.setVerticalScrollBarEnabled(false); // 스크롤바 숨김

        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setGeolocationEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setUseWideViewPort(true);
        settings.setSupportMultipleWindows(true);
        settings.setTextZoom(100);

        // Enable pinch to zoom without the zoom buttons
        settings.setBuiltInZoomControls(true);
        // Hide the zoom controls for HONEYCOMB+
        settings.setDisplayZoomControls(false);

        settings.setSupportZoom(true);

        // ---------------------------------------- 결제 모듈 연동 관련
        // Insecurity(인증결과) 페이지 허용
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // 안심클릭 카드 결제 시, 보안 키보드를 불러오지 못하는 이슈 대응
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
        // ---------------------------------------- 결제 모듈 연동 관련
    }
}
