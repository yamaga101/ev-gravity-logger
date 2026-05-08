---
visibility: internal
---
# P2 Auto Trip — 自動移動ログ設計 (ADR)

**Status**: Implementing 2026-05-08 (v5.1.0)
**Author**: Opus 4.7 + Council L4 (5/3 Universal Tracking 採決済) + 5/8 Pro Bridge dissent
**Supersedes**: 2026-05-03 council 段の P2.1〜P2.4 分割 (community plugin migration で AR 喪失したため再構成)

## Context

- v5.0.2 時点で BG GPS PoC は動作 (`useBackgroundGeolocation.ts`、community plugin)
- 生サンプルは `localStorage["ev-poc-bg-locations"]` に最大 5000 件
- trip 単位への segment 化・DriveLog レコード自動生成・GAS sync は **未実装**
- 旧 transistorsoft プラグイン (有償 ¥75,000) で得られた activity recognition (IN_VEHICLE / ON_FOOT) は community plugin migration (2026-05-06) で喪失。speed-based MOVING/STILL のみ
- ユーザーは「移動手段問わず・常に・未起動でも」の Universal Tracking を 5/3 council で承認済

## Decision

### 1. ストレージ: SQLite (native) + localStorage fallback (Web)

`@capacitor-community/sqlite` を採用。理由:
- 5000 件 cap が PoC 限界、長期蓄積に不適
- segment 計算で SQL 集約 (timestamp range / haversine sum) が圧倒的に速い
- Capacitor 7 公式コミュニティ plugin で active maintained
- DB は app private storage、uninstall で消える (個人 carve-out 要件と合致)

### 2. スキーマ v1

```sql
CREATE TABLE gps_samples (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           TEXT NOT NULL,        -- ISO8601
  lat          REAL NOT NULL,
  lng          REAL NOT NULL,
  speed_mps    REAL,                 -- nullable
  accuracy_m   REAL NOT NULL,
  is_moving    INTEGER NOT NULL,     -- 0/1
  trip_id      TEXT                  -- segmenter 後に紐付け
);
CREATE INDEX idx_samples_ts ON gps_samples(ts);
CREATE INDEX idx_samples_trip ON gps_samples(trip_id);

CREATE TABLE trips (
  id           TEXT PRIMARY KEY,     -- uuid
  start_ts     TEXT NOT NULL,
  end_ts       TEXT NOT NULL,
  start_lat    REAL NOT NULL,
  start_lng    REAL NOT NULL,
  end_lat      REAL NOT NULL,
  end_lng      REAL NOT NULL,
  distance_m   REAL NOT NULL,        -- haversine 累積
  duration_s   INTEGER NOT NULL,
  sample_count INTEGER NOT NULL,
  avg_speed_mps REAL,
  max_speed_mps REAL,
  status       TEXT NOT NULL,        -- 'pending' | 'confirmed' | 'ignored'
  drive_log_id TEXT,                 -- confirm 後に紐付け
  confirmed_at TEXT
);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start ON trips(start_ts);
```

### 3. Segmentation engine

ルール (community plugin AR 喪失下の代替):
- **trip 開始**: 直近 3 サンプル中 2 つ以上で `is_moving=1`
- **trip 終了**: `is_moving=0` が連続 5 分以上 (≥ 5 サンプル分)、または最後のサンプルから 10 分間新サンプル無し
- **最小 trip 距離**: 100m 未満は破棄 (誤検知防止: 駐車場内の移動など)
- **最小 trip 時間**: 60 秒未満は破棄
- **incremental**: 新サンプル投入時に segmenter を tick → 既存 trip を update or 新 trip 起票
- **冪等**: 全サンプルから再計算する `recomputeAllTrips()` も提供 (debug & migration 用)

### 4. Trip → DriveLog 関係: 別 entity + 確認 UI 経由 (Stitch mock 通り)

- AutoTrip は SQLite `trips` table が原本、UI は zustand `useAutoTripStore` が hydrate
- **確認 UI の選択肢**:
  - `Confirm as drive` → DriveLogRecord 生成 + outbox 投入 + status='confirmed'
  - `Ignore` → status='ignored' (歩行・電車・助手席など)
  - `Edit` → 出発地・目的地名・purpose を手入力してから confirm
- **DriveLog 生成時の field マッピング**:
  - `date`: trip start_ts の YYYY-MM-DD
  - `departure`: ユーザー編集無ければ `GPS: ${start_lat.toFixed(4)},${start_lng.toFixed(4)}`
  - `destination`: 同上 end_lat/lng
  - `distance`: distance_m / 1000、小数 1 桁 km
  - `startOdometer` / `endOdometer`: **空** (未取得、reverse geocoding & OBD は別 phase)
  - `efficiency`: 空
  - `purpose`: ユーザー入力 or 空
  - `memo`: `auto-detected ${duration_s}s ${avg_speed_mps?.toFixed(1)}m/s` を default

### 5. UI 配置

- **History タブの sub-tab に "Auto Drives" を追加** (既存 charging / driveLog と並列で 3 sub-tab に拡張)
- AutoTrip list: 検出 trip を時系列降順表示 (status icon + distance + duration + 開始/終了時刻)
- 個別 trip タップ → 確認 modal (Stitch mock のレイアウト準拠)

### 6. GAS sync

既存 `useSyncStore` outbox + `gas/Code.gs` `writeDriveLog` を **流用**。
trip confirm 時に DriveLogRecord を `useDriveLogStore.addRecord` + `useSyncStore.syncSend({type:"driveLog",...})` に投げるだけ。GAS 側の変更は **不要**。

### 7. 既存 PoC samples 移行

起動時に 1 回:
1. SQLite が空なら `localStorage["ev-poc-bg-locations"]` を読む
2. 全件を `gps_samples` に bulk insert
3. `recomputeAllTrips()` を走らせて既存履歴から trip を抽出
4. localStorage は残置 (rollback 時の保険、v5.2.x で削除予定)

## Consequences

**Pros**:
- 旧 V1 機能 (移動ログ自動化) の完全移植
- Spreadsheet driveLog シートに自動行追加 → 経費精算・税控除に直結
- 確認 UI でユーザーが noise を弾けるので auto-trust より UX 安全
- SQLite は OBD / reverse geocoding 統合 (P3) でも引き続き原本になる

**Cons / Risks**:
- Community plugin AR 喪失で「歩行 trip」が誤検出される (>= 1.0 m/s = 3.6 km/h 以上の歩行は trip 化される)
  - mitigation: 確認 UI で Ignore できる、最小距離 100m / 最小時間 60s で短時間歩行は弾く
- Native rebuild 必須 (SQLite plugin が android/ に gradle 依存追加)
- 5000 件 cap 撤廃で long-running なバッテリー消費は要観察 (v5.0 PoC 評価で OK 判定済前提)
- DB スキーマ migration の v2 以降で reverse geocode columns 等を追加する場合は ALTER TABLE で対応

## Alternatives Rejected

1. **PoC 拡張 (localStorage cap を 50000 件に上げて segment は memory 計算)**
   - ❌ 起動時に 50k JSON.parse は startup time 悪化、indexedDB の方がマシだが native bridge 経由の SQLite よりも遅い & 故障時のデバッグが厳しい

2. **Trip = DriveLog 直接書き込み (確認 UI 無し)**
   - ❌ AR が無い community plugin では歩行 / 助手席 / 電車を弾けず、driveLog シートに noise が大量混入
   - ❌ ユーザーの 5/8 選択は確認 UI 経由

3. **transistorsoft 戻し (¥75,000 ライセンス購入)**
   - ❌ 5/6 council で community 採用済、license 回避が migration の主目的
   - ❌ AR 復活より UX (確認 UI) で吸収する方が拡張性高い

4. **WatermelonDB / Realm / Dexie (代替 DB)**
   - ❌ Capacitor 7 ネイティブ統合の手間が SQLite より大きい
   - ❌ 既存 zustand persist + localStorage パターンとの整合性が悪い

## Implementation Phases (今 session)

| Phase | Scope | Files |
|-------|-------|-------|
| 1 | SQLite plugin install + Android config | `package.json`, `android/app/build.gradle`, `cap.config` |
| 2 | SQLite service module + schema migrations | `src/services/sqlite.ts` |
| 3 | useBackgroundGeolocation を SQLite write-through 化 + localStorage import | `src/hooks/useBackgroundGeolocation.ts` |
| 4 | Segmentation engine | `src/services/trip-segmenter.ts` |
| 5 | AutoTrip types + zustand store | `shared/types/index.ts`, `src/store/useAutoTripStore.ts` |
| 6 | AutoTrip 確認 UI (History sub-tab) | `src/components/silent/screens-auto-trip.tsx` + `screens-main.tsx` の HistoryScreen 拡張 |
| 7 | confirm → DriveLog + GAS sync wire | 既存 `useDriveLogStore` + `useSyncStore` 流用 |
| 8 | Native rebuild + APK ship + version bump (5.0.2 → 5.1.0) | `package.json`, `android/app/build.gradle` (versionCode/Name), `shared/constants/defaults.ts` |

## References

- 5/3 council L4 結論: `docs/logs/2026-05-03.md` §G
- BG plugin migration: `useBackgroundGeolocation.ts:3-12`
- Stitch mock: `docs/assets/stitch-auto-trip-confirmation.png`
- GAS driveLog handler: `gas/Code.gs:273-300` (writeDriveLog)
- Carve-out 制約: `docs/specs/system-gas-yamaga101-carveout.md`
