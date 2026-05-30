# SkinProof 專案進度報告
最後更新：2026-05-30（第二次更新）

---

## App 網址與帳號

| 項目 | 內容 |
|------|------|
| App | https://skin-proof-23zt.vercel.app |
| GitHub | https://github.com/optionmama/Skin-proof |
| Supabase | https://udxodcbmzordjtskqeae.supabase.co (project: udxodcbmzordjtskqeae) |
| AI Model | claude-opus-4-5 |
| 部署 | push to GitHub main → Vercel auto-deploy (~2 min) |

---

## 今日完成工作（2026-05-30）

### TASK 1 — Homepage: Deduplicate + Remove routine products

| 檔案 | 變更 |
|------|------|
| `src/components/RoutineList.tsx` (NEW) | 新建 client component — 帶 🗑 trash icon，tap 顯示 bottom-sheet confirm dialog，confirm 後 soft-delete (`is_active = false`) 所有對應 `user_routines` 的 `product_id` |
| `src/app/dashboard/page.tsx` | query 加 `product_id`，dedup by brand+name，AM+PM 合併顯示 "AM · PM"，改用 RoutineList component |

### TASK 2 — Onboarding: Age range question

| 檔案 | 變更 |
|------|------|
| `src/app/onboarding/page.tsx` | 在 skin_type 後加 `age_range` 步驟；7 個選項 (Under 20 / 20–25 / 26–30 / 31–35 / 36–40 / 41–45 / 46+)；儲存到 `skin_profiles.age_range` |
| Supabase SQL | `ALTER TABLE skin_profiles ADD COLUMN IF NOT EXISTS age_range TEXT;` |

### TASK 3 — Scan result: Routine compatibility check

| 檔案 | 變更 |
|------|------|
| `src/app/dashboard/checkin/result/page.tsx` | 新增 "Your routine today" section：fetch user_routines + user_products，對 product notes 比對 comedogenic/heavy/irritant 成分（依今日分數 threshold），每個產品顯示 ✅ 或 ⚠️ + 說明 |

### TASK 4 — Scan result: Community teaser card

| 檔案 | 變更 |
|------|------|
| `src/app/dashboard/checkin/result/page.tsx` | 新增 community teaser card（warm cream tone）：預告同膚質 + 同年齡層用戶數據功能 |

### TASK 5 — For You: Scan-based recommendations

- 已在 2026-05-29 完成：For You 頁面不再顯示 onboarding concerns chips
- ForYouEmptyState 正確顯示 "Based on your last scan · [date]" + "AI detected: oiliness"
- `/api/ai-recommendations` 使用最新 `skin_photos.ai_analysis_raw` 的 dimensions + observations

### TASK 6 — Translate remaining Chinese to English

| 檔案 | 變更 |
|------|------|
| `src/app/routine/setup/page.tsx` | 4 個中文 code comments → English |
| `src/app/dashboard/profile/page.tsx` | 1 個中文 JSX comment → English |

### Session 2 (2026-05-30 afternoon)

| Task | 檔案 | 完成內容 |
|------|------|---------|
| Google Shopping | `src/components/ForYouEmptyState.tsx` | 每個 AI 推薦產品卡底部加「🛒 Find best price on Google Shopping ↗」按鈕 |
| Profile 設定修復 | `src/app/dashboard/profile/page.tsx` | Notifications / Dark Mode / Language / Privacy & Data 四個設定全部有效 |
| Notifications | profile page | Bottom-sheet：3 個 toggle + 時間選擇器，自動存到 `user_settings` |
| Dark Mode | profile page | 即時 toggle，套用 `dark` class 到 `<html>`，存到 `user_settings` |
| Language | profile page | Bottom-sheet：English / 繁體中文，存到 `user_settings.language` |
| Privacy & Data | profile page | Bottom-sheet：Delete all photos（confirm）/ Delete account（confirm） |
| Copyright year | profile page | 2025 → 2026 |
| Age Range display | profile page | Skin Profile 區塊新增 Age Range 欄位 |
| user_settings table | Supabase SQL | 建立 table + RLS policy |

### Session 1 (2026-05-30 morning)

### Previous session (2026-05-29 continued)

- Fixed build-breaking syntax error in `en.ts` (unescaped apostrophes → all previous fixes now deployed)
- Backfilled `main_concern` from `ai_analysis_raw` for scored photos

---

## 目前完成進度總覽

| 功能模組 | 狀態 | 備註 |
|----------|------|------|
| Landing page | ✅ | 無 disclaimer，乾淨設計 |
| Auth (登入/註冊) | ✅ | Supabase auth |
| Onboarding | ✅ | 8 步驟，含 age_range（新增） |
| Routine Setup (AM/PM) | ✅ | 自由輸入，不強制綁資料庫 |
| Daily Check-in (3 步驟) | ✅ | Photo → Habits → Products |
| AI 皮膚分析 | ✅ | 6 維度評分，40–95 範圍 |
| Check-in 結果頁 | ✅ | 分數 + tip + 每日建議 + 今日 routine 相容性 + community teaser |
| Home Dashboard | ✅ | 分數、products（deduplicated）、streak、routine 列表帶刪除 |
| Product Diary | ✅ | 從 user_routines 讀取，dedup，14 天 insight |
| Diary 新增產品 | ✅ | 自由輸入表單（不需掃描） |
| Progress page | 🔧 | 頁面存在，圖表來源未驗證 |
| For You (推薦) | ✅ | AI 推薦基於最新掃描（非 onboarding concerns） |
| Routine compatibility check | ✅ | 今日 routine 相容性顯示於結果頁 |
| Community teaser | ✅ | 靜態卡片，預告社群功能 |
| Google Shopping 連結 | ✅ | For You AI 推薦每張產品卡都有 Google Shopping 搜尋按鈕 |
| user_settings table | ✅ | Supabase 已建立，含 RLS policy |
| Profile page | ✅ | 設定全部有效（Notifications/DarkMode/Language/Privacy）；Age Range 顯示 |
| i18n 架構 | ✅ | en.ts + zh-TW.ts，全站英文 |
| 語言切換 UI | ❌ | 架構建好，Profile 無語言 selector |
| 定期膚質報告 | ❌ | 未開始 |
| Favicon | ❌ | 未設定 |
| Community features (real) | ❌ | 需真實用戶數據 |

---

## 已知問題

1. **重複 user_products 在 DB**：user `99b3ff35` 仍有 6 筆 user_products（3 個產品各存 2 次）。Home 和 Diary 用 brand+name dedup 正確顯示 3 個，但 DB 髒數據仍在。可選擇性清理：
   ```sql
   DELETE FROM user_products WHERE id IN (
     SELECT id FROM (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(brand), LOWER(name) ORDER BY created_at) AS rn
       FROM user_products
     ) sub WHERE rn > 1
   );
   ```

2. **Routine compatibility check 只能檢查有在 notes 填寫成分的產品**：`user_products.notes` 欄位預設是空的。建議未來在 Diary 加入 "Add ingredients" 功能，或連結至開放成分資料庫。

3. **main_concern 舊照片**：2026-05-28 前的照片 `main_concern` 為 null（舊 prompt 未返回此欄位），已 backfill 3 筆有資料的。Progress 圖表上舊分數偏 72 是已知舊 prompt 問題。

4. **Progress page 未測試**：`src/app/dashboard/progress/page.tsx` 存在但圖表資料來源未確認。

---

## 待辦工作（按優先順序）

### 🔴 高優先

1. **Progress page 測試與修復**
   - 確認 `progress/page.tsx` 讀取 `skin_photos.overall_skin_score` 正確
   - 若圖表空白，修復查詢

2. **Routine setup → redirect to /dashboard (not /profile)**
   - 目前完成 routine setup 後 redirect 到 `/dashboard/profile`
   - 改為直接到 `/dashboard`

3. **DB 清理：重複 user_products**
   - 執行上方 SQL 刪除重複資料

### 🟡 中優先

4. **語言切換 UI**
   - 在 Profile 加 Language selector (en / 繁中)
   - 儲存到 localStorage 或 `users` table 新欄位

5. **Diary product detail page 更新**
   - `diary/[id]/page.tsx` 仍查 `user_product_logs`（空表）
   - 但因 diary list 不再連到 `/diary/[id]`，影響不大

6. **Routine compatibility - 加入成分輸入**
   - 在 diary/add 加入 "Key ingredients (optional)" 欄位
   - 存到 `user_products.notes`，供 result page 比對

### 🟢 低優先

7. **Favicon** — `/public/favicon.ico` 或 `app/favicon.ico`
8. **定期膚質報告** — 每 14/30 天 AI 生成總結
9. **Community features (real data)** — 需 50+ 真實用戶

---

## 重要技術筆記

### 資料表對照

| 用途 | 正確資料表 | 廢棄（勿用） |
|------|------------|--------------|
| 使用者產品 | `user_products` + `user_routines` | `user_product_logs`（空） |
| 官方產品 DB | `products`（空，未填） | — |
| AI 分析結果 | `skin_photos` | — |
| 每日打卡 | `skin_checkins` | — |
| 打卡使用產品 | `checkin_products` | — |
| 膚質資料 | `skin_profiles` | — |

### API 端點

| 端點 | 用途 |
|------|------|
| `POST /api/analyze-skin` | Claude Vision 分析，存到 skin_photos |
| `GET /api/ai-recommendations` | 讀最新 scan，呼叫 Claude 生成 3 個推薦 |

### 關鍵設計決策

1. **產品系統**：`user_products`（自由輸入）+ `user_routines`（routine 連結）。不強制官方 `products` 表。
2. **Deduplication**：DB 有重複 user_products，所有讀取以 brand+name 去重。
3. **main_concern chain**：`skin_photos.main_concern` → `ai_analysis_raw->>'main_concern'` → fallback 'none'
4. **age_range**：新增欄位在 `skin_profiles.age_range`，用於未來 Community Picks 匹配 (±5 years)
5. **Routine remove**：soft-delete (`is_active = false`)，不實際刪除 DB rows

### 今日 Supabase SQL

```sql
-- 已執行
ALTER TABLE skin_profiles ADD COLUMN IF NOT EXISTS age_range TEXT;
```

### 重要 commit hashes (今日)

| Hash | 說明 |
|------|------|
| `fc112c7` | Fix build-breaking syntax error in en.ts (apostrophes) |
| `cf83ee3` | Deduplicate routine on homepage |
| `6532315` | All 6 tasks: routine delete, age onboarding, compatibility check, community teaser, translations |

---

## 工作規則（每次開始必讀）

```
1. git pull 先
2. 改完 npm run build — 0 errors 才能 push
3. git push origin main
4. 確認 Vercel HTTP 200
5. Supabase: project_id = udxodcbmzordjtskqeae
6. 不要問使用者，直接做到完成
```
