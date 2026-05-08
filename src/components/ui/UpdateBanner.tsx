// UpdateBanner — 起動時 + 6h cooldown で GitHub Releases poll、新版検出で
// 上部 sticky banner 表示。タップで download → ACTION_VIEW intent。
//
// 設計: docs/specs/p3-auto-update.md
//
// 3 UI variant (Silent / NEXUS v2 / legacy) で見た目を切替。`variant` prop で指定。
// 共通 fallback (variant 未指定) は Silent 風 (warm amber + dark) — Silent が default。

import { useEffect, useState, useRef } from "react";
import {
  checkForUpdate,
  downloadAndInstall,
  dismissUpdate,
  type UpdateInfo,
} from "../../services/auto-update";

type Variant = "silent" | "nexus" | "legacy";
type Phase = "idle" | "available" | "downloading" | "error" | "done";

interface Props {
  variant?: Variant;
}

export function UpdateBanner({ variant = "silent" }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const checkedRef = useRef(false);

  // 起動時 1 回 check
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    void (async () => {
      try {
        const r = await checkForUpdate(false);
        if (r.available) {
          setInfo(r);
          setPhase("available");
        }
      } catch (e) {
        console.warn("[UpdateBanner] check failed", e);
      }
    })();
  }, []);

  const handleInstall = async () => {
    if (!info?.downloadUrl) return;
    setPhase("downloading");
    setProgress(0);
    setError(null);
    try {
      await downloadAndInstall(info.downloadUrl, (pct) => setProgress(pct));
      setPhase("done");
    } catch (e: any) {
      console.error("[UpdateBanner] install failed", e);
      setError(String(e?.message ?? e));
      setPhase("error");
    }
  };

  const handleDismiss = () => {
    if (info?.latestVersion) {
      dismissUpdate(info.latestVersion);
    }
    setPhase("idle");
    setInfo(null);
  };

  if (phase === "idle" || !info) return null;

  // ─── variant 別 style ────────────────────────────────────
  const styles = getStyles(variant);

  return (
    <div style={styles.banner}>
      {phase === "available" && (
        <>
          <div style={styles.label}>
            UPDATE · {info.latestVersion}
          </div>
          <div style={styles.message}>
            新バージョンが利用可能です
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={handleInstall} style={styles.primaryBtn}>
              更新する
            </button>
            <button onClick={handleDismiss} style={styles.dismissBtn}>
              後で
            </button>
          </div>
        </>
      )}
      {phase === "downloading" && (
        <>
          <div style={styles.label}>DOWNLOADING · {info.latestVersion}</div>
          <div style={{ ...styles.message, marginBottom: 6 }}>
            {progress}%
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
        </>
      )}
      {phase === "error" && (
        <>
          <div style={styles.label}>UPDATE FAILED</div>
          <div style={styles.message}>{error || "ダウンロードに失敗しました"}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button onClick={handleInstall} style={styles.primaryBtn}>
              リトライ
            </button>
            <button onClick={handleDismiss} style={styles.dismissBtn}>
              閉じる
            </button>
          </div>
        </>
      )}
      {phase === "done" && (
        <>
          <div style={styles.label}>READY · {info.latestVersion}</div>
          <div style={styles.message}>
            install 画面が出ました。タップで完了してください
          </div>
        </>
      )}
    </div>
  );
}

function getStyles(v: Variant) {
  if (v === "nexus") {
    return {
      banner: {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "linear-gradient(180deg, rgba(10,15,30,0.96) 0%, rgba(10,15,30,0.85) 100%)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,240,255,0.2)",
        color: "#EAF2FF",
        padding: "10px 16px",
        paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
        fontFamily: "'Inter', sans-serif",
      },
      label: {
        fontSize: 9,
        letterSpacing: "0.20em",
        color: "#00F0FF",
        marginBottom: 4,
      },
      message: { fontSize: 13, color: "#EAF2FF" },
      primaryBtn: {
        background: "#00F0FF",
        color: "#04060D",
        border: "none",
        borderRadius: 6,
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.10em",
        cursor: "pointer",
      },
      dismissBtn: {
        background: "transparent",
        color: "#EAF2FF",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 6,
        padding: "6px 12px",
        fontSize: 11,
        cursor: "pointer",
      },
      progressTrack: {
        height: 3,
        background: "rgba(0,240,255,0.15)",
        borderRadius: 2,
        overflow: "hidden",
      },
      progressFill: {
        height: "100%",
        background: "#00F0FF",
        transition: "width 0.2s ease",
      },
    };
  }
  if (v === "legacy") {
    return {
      banner: {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 110,
        background: "rgba(10,15,30,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,240,255,0.2)",
        color: "#EAF2FF",
        padding: "10px 16px",
        paddingTop: "calc(10px + env(safe-area-inset-top, 0px))",
      },
      label: { fontSize: 10, letterSpacing: "0.15em", color: "#00F0FF" },
      message: { fontSize: 13, color: "#EAF2FF", marginTop: 2 },
      primaryBtn: {
        background: "#00F0FF",
        color: "#04060D",
        border: "none",
        borderRadius: 6,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      },
      dismissBtn: {
        background: "transparent",
        color: "#A8B5C8",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 6,
        padding: "6px 12px",
        fontSize: 12,
        cursor: "pointer",
      },
      progressTrack: { height: 3, background: "rgba(0,240,255,0.15)", borderRadius: 2, overflow: "hidden" },
      progressFill: { height: "100%", background: "#00F0FF", transition: "width 0.2s ease" },
    };
  }
  // silent (default)
  return {
    banner: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 150,
      background: "#0A0908",
      borderBottom: "1px solid rgba(232,160,74,0.20)",
      color: "#F4F2EE",
      padding: "12px 20px",
      paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
      fontFamily: "'Inter', 'Zen Kaku Gothic Antique', sans-serif",
    },
    label: {
      fontSize: 9,
      letterSpacing: "0.22em",
      textTransform: "uppercase" as const,
      color: "#E8A04A",
      marginBottom: 4,
    },
    message: { fontSize: 13, color: "#F4F2EE" },
    primaryBtn: {
      background: "#E8A04A",
      color: "#0A0908",
      border: "none",
      borderRadius: 8,
      padding: "8px 14px",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.10em",
      textTransform: "uppercase" as const,
      cursor: "pointer",
    },
    dismissBtn: {
      background: "transparent",
      color: "#A8A39B",
      border: "1px solid rgba(255,250,240,0.10)",
      borderRadius: 8,
      padding: "8px 14px",
      fontSize: 11,
      letterSpacing: "0.10em",
      textTransform: "uppercase" as const,
      cursor: "pointer",
    },
    progressTrack: {
      height: 3,
      background: "rgba(232,160,74,0.15)",
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      background: "#E8A04A",
      transition: "width 0.2s ease",
    },
  };
}
