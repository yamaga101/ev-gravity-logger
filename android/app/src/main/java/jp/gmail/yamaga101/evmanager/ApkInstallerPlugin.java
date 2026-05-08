package jp.gmail.yamaga101.evmanager;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * ApkInstallerPlugin — install(path) を 1 method だけ持つ最小プラグイン。
 *
 * 設計詳細: docs/specs/p3-auto-update.md
 *
 * JS から: ApkInstaller.install({ path: "/data/.../app-debug.apk" })
 *   → FileProvider 経由で content:// URI に変換
 *   → Intent.ACTION_VIEW + application/vnd.android.package-archive
 *   → Android パッケージインストーラ起動 (ユーザー Confirm 必須)
 *
 * 必須:
 *   - AndroidManifest.xml に REQUEST_INSTALL_PACKAGES permission
 *   - 初回 install 時にユーザーが「不明なソースからのアプリ」許可を 1 回手動承認
 *   - file_paths.xml に APK cache 用 path
 */
@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void install(PluginCall call) {
        String path = call.getString("path");
        if (path == null || path.isEmpty()) {
            call.reject("path is required");
            return;
        }

        File apkFile = new File(path);
        if (!apkFile.exists()) {
            call.reject("APK file not found: " + path);
            return;
        }

        try {
            String authority = getContext().getPackageName() + ".fileprovider";
            Uri apkUri = FileProvider.getUriForFile(getContext(), authority, apkFile);

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION |
                Intent.FLAG_ACTIVITY_NEW_TASK
            );

            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("install intent failed: " + e.getMessage(), e);
        }
    }
}
