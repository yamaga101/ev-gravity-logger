// Auto-update service — GitHub Releases polling + APK download + native install
//
// 設計詳細: docs/specs/p3-auto-update.md
//
// flow:
//   1. checkForUpdate(): GitHub /releases/latest を fetch、tag を APP_VERSION と
//      semver 比較。新しければ available=true + downloadUrl を返す。
//   2. downloadAndInstall(downloadUrl, onProgress): @capacitor/filesystem で
//      Cache/apk/app-debug.apk に download → ApkInstaller.install で intent。
//
// 全 export は web 環境でも crash せず安全 (Capacitor.isNativePlatform で gate)。

import { Capacitor, registerPlugin } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { APP_VERSION } from "../../shared/constants/defaults";

const REPO = "yamaga101/ev-manager";
const APK_ASSET_NAME = "app-debug.apk";
const APK_LOCAL_DIR = "apk";
const APK_LOCAL_NAME = "app-debug.apk";

// 6h cooldown (起動連打で API 叩かない)
const CHECK_COOLDOWN_MS = 6 * 60 * 60 * 1000;
const LAST_CHECK_KEY = "ev-update-last-check";
const DISMISSED_VERSION_KEY = "ev-update-dismissed-version";

interface ApkInstallerPlugin {
  install(opts: { path: string }): Promise<void>;
}
const ApkInstaller = registerPlugin<ApkInstallerPlugin>("ApkInstaller");

// ─── version 比較 ────────────────────────────────────────────

function parseSemver(v: string): [number, number, number] | null {
  // strip leading "v"
  const cleaned = v.replace(/^v/i, "").trim();
  const parts = cleaned.split(".");
  if (parts.length < 3) return null;
  const nums = parts.slice(0, 3).map((p) => {
    const n = parseInt(p, 10);
    return isNaN(n) ? 0 : n;
  });
  return [nums[0], nums[1], nums[2]];
}

function isNewer(remote: string, current: string): boolean {
  const r = parseSemver(remote);
  const c = parseSemver(current);
  if (!r || !c) return false;
  for (let i = 0; i < 3; i++) {
    if (r[i] > c[i]) return true;
    if (r[i] < c[i]) return false;
  }
  return false;
}

// ─── public API ──────────────────────────────────────────────

export interface UpdateInfo {
  available: boolean;
  latestVersion?: string;
  downloadUrl?: string;
  releaseNotes?: string;
  releaseUrl?: string;
}

/**
 * GitHub Releases API を叩いて update 有無を返す。
 * cooldown 6h、dismissedVersion なら true でも force=false で skip。
 */
export async function checkForUpdate(force = false): Promise<UpdateInfo> {
  if (!Capacitor.isNativePlatform()) {
    return { available: false };
  }

  // cooldown
  if (!force) {
    try {
      const last = localStorage.getItem(LAST_CHECK_KEY);
      if (last) {
        const lastMs = new Date(last).getTime();
        if (Date.now() - lastMs < CHECK_COOLDOWN_MS) {
          return { available: false };
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      console.warn("[auto-update] GitHub API non-ok", res.status);
      return { available: false };
    }
    const data: any = await res.json();
    const tag = String(data.tag_name || "");
    if (!tag) return { available: false };

    try {
      localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    } catch {
      // ignore
    }

    if (!isNewer(tag, APP_VERSION)) {
      return { available: false, latestVersion: tag };
    }

    // dismissed version check
    try {
      const dismissed = localStorage.getItem(DISMISSED_VERSION_KEY);
      if (!force && dismissed === tag) {
        return { available: false, latestVersion: tag };
      }
    } catch {
      // ignore
    }

    const asset = (data.assets || []).find(
      (a: any) => String(a.name) === APK_ASSET_NAME,
    );
    if (!asset) {
      console.warn("[auto-update] release has no app-debug.apk asset");
      return { available: false, latestVersion: tag };
    }

    return {
      available: true,
      latestVersion: tag,
      downloadUrl: String(asset.browser_download_url),
      releaseNotes: String(data.body || ""),
      releaseUrl: String(data.html_url || ""),
    };
  } catch (e) {
    console.error("[auto-update] check failed", e);
    return { available: false };
  }
}

/**
 * 旧 dismiss を解除して再 check (例: ユーザーが Settings から強制更新する場合)
 */
export function clearUpdateDismissal(): void {
  try {
    localStorage.removeItem(DISMISSED_VERSION_KEY);
    localStorage.removeItem(LAST_CHECK_KEY);
  } catch {
    // ignore
  }
}

export function dismissUpdate(version: string): void {
  try {
    localStorage.setItem(DISMISSED_VERSION_KEY, version);
  } catch {
    // ignore
  }
}

/**
 * APK download → install intent。
 * onProgress: 0..100 (Filesystem download progress 経由)
 * 失敗時は throw。成功時は intent 起動まで完了 (実際の install はユーザー操作)。
 */
export async function downloadAndInstall(
  downloadUrl: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("native only");
  }

  // download progress listener (Filesystem v7 supports this)
  const removeListener = await Filesystem.addListener(
    "progress",
    (event: any) => {
      if (event && typeof event.contentLength === "number" && event.contentLength > 0) {
        const pct = Math.round((event.bytes / event.contentLength) * 100);
        onProgress?.(Math.min(99, pct));
      }
    },
  );

  try {
    // ensure dir exists
    try {
      await Filesystem.mkdir({
        path: APK_LOCAL_DIR,
        directory: Directory.Cache,
        recursive: true,
      });
    } catch {
      // already exists
    }

    const result = await Filesystem.downloadFile({
      url: downloadUrl,
      path: `${APK_LOCAL_DIR}/${APK_LOCAL_NAME}`,
      directory: Directory.Cache,
      progress: true,
    });

    if (!result || !result.path) {
      throw new Error("download returned no path");
    }

    onProgress?.(100);

    // intent 起動
    await ApkInstaller.install({ path: result.path });
  } finally {
    try {
      await removeListener.remove();
    } catch {
      // ignore
    }
  }
}
