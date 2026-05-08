package jp.gmail.yamaga101.evmanager;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — Capacitor WebView に Android system bar insets を bridge する。
 *
 * 背景: Capacitor 7 + Android 15+ では edge-to-edge が強制で WebView は status bar
 * 領域まで描画される。ところが Android WebView は env(safe-area-inset-top) を
 * 自動で populate しない (iOS WKWebView だけが native で対応)。そのため React 側
 * CSS で env() を使っても Android では常に 0 が返り、UI が status bar に被る。
 *
 * Fix: WindowInsets を読み、density 補正して dp (= CSS px) に変換、document の
 * --android-inset-{top,bottom,left,right} CSS custom property に inject する。
 * CSS 側は max(env(safe-area-inset-top, 0px), var(--android-inset-top, 28px)) で
 * iOS / Android 両対応。
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 自作 plugin を Capacitor bridge に登録 (super.onCreate より前に呼ぶ)
        registerPlugin(ApkInstallerPlugin.class);

        super.onCreate(savedInstanceState);

        View root = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, windowInsets) -> {
            Insets sysBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            float density = getResources().getDisplayMetrics().density;
            int topDp = (int) Math.ceil(sysBars.top / density);
            int bottomDp = (int) Math.ceil(sysBars.bottom / density);
            int leftDp = (int) Math.ceil(sysBars.left / density);
            int rightDp = (int) Math.ceil(sysBars.right / density);

            String js = String.format(
                "document.documentElement.style.setProperty('--android-inset-top','%dpx');" +
                "document.documentElement.style.setProperty('--android-inset-bottom','%dpx');" +
                "document.documentElement.style.setProperty('--android-inset-left','%dpx');" +
                "document.documentElement.style.setProperty('--android-inset-right','%dpx');",
                topDp, bottomDp, leftDp, rightDp);

            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().post(() ->
                    this.bridge.getWebView().evaluateJavascript(js, null)
                );
            }
            return windowInsets;
        });
    }
}
