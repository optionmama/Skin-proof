# SkinProof 專案進度報告
**最後更新：2026-05-29**

---

## App 網址與帳號

| 項目 | 內容 |
|------|------|
| Production URL | https://skin-proof-23zt.vercel.app |
| GitHub Repo | https://github.com/optionmama/Skin-proof |
| Supabase Project | https://udxodcbmzordjtskqeae.supabase.co |
| Supabase Project ID | `udxodcbmzordjtskqeae` |
| 部署方式 | push to GitHub main → Vercel auto-deploy (1–2 min) |

---

## 今日完成工作（2026-05-29）

### 🔴 Bug Fixes

| 修復 | 檔案 | 說明 |
|------|------|------|
| photo_date 不存在導致照片上傳失敗 | `src/app/checkin/page.tsx` | insert 裡的 `photo_date` 欄位不在 schema，導致 insert 靜默失敗、AI 從未分析 |
| Products 顯示 0 | `src/app/dashboard/page.tsx` | 改查 `user_products` + brand/name dedup（原本查 `user_product_logs` 是空表） |
| Diary 顯示 0 產品 | `src/app/dashboard/diary/page.tsx` | 完全重寫，改從 `user_routines` + `user_products` 讀取，dedup by brand+name |
| /dashboard/checkin redirect | `src/app/dashboard/checkin/page.tsx` | 舊版 checkin 改為 server-side redirect 到 `/checkin` |
| main_concern 未寫入 DB | `src/app/api/analyze-skin/route.ts` | update 語句加入 `main_concern`、`visible_observations`、`makeup_detected` |
| Checkin result 查錯 table | `src/app/dashboard/checkin/result/page.tsx` | 改查 `user_routines`，select 加入 dedicated columns |
| 舊照片 main_concern 為 null | Supabase SQL | backfill UPDATE from `ai_analysis_raw` |
| 重複 user_products | `src/app/routine/setup/page.tsx` | 儲存前先查 brand+name 是否存在，避免 AM/PM 各存一次 |
| Home page 顯示 6 products | `src/app/dashboard/page.tsx` | 改查 `user_products`（unique），dedup by brand+name |
| Comedogenic check 查錯 table | `src/app/dashboard/checkin/result/page.tsx` | 改查 `user_routines` + `user_products` |
| Chinese error messages | `src/app/routine/setup/page.tsx` | 翻譯 2 個使用者可見的錯誤訊息 |

### 🟡 功能改善

| 改善 | 檔案 | 說明 |
|------|------|------|
| Claude 推薦 prompt 升級 | `src/app/api/ai-recommendations/route.ts` | 加入 scan dimensions、visible_observations、current routine products（避免重複推薦） |
| Today's checkin 偵測強化 | `src/app/dashboard/page.tsx` | 同時 check `checkin_date` 和 `checked_in_at`，相容新舊 check-in 流程 |
| main_concern fallback chain | `src/app/dashboard/page.tsx`、`result/page.tsx` | 優先讀 dedicated column → fallback to `ai_analysis_raw` |
| For You page 清理 | `src/app/dashboard/recommendations/page.tsx` | 移除 unused `skin_profiles` query；官方 products DB 是空的，永遠走 ForYouEmptyState |
| 產品不重複推薦 | `src/app/api/ai-recommendations/route.ts` | Claude prompt 加入 "do NOT recommend these products already in routine" |

---

## 目前完成進度總覽

| 功能模組 | 狀態 | 備註 |
|----------|------|------|
| Landing page | ✅ | 無 disclaimer，乾淨設計 |
| Auth (登入/註冊) | ✅ | Supabase auth |
| Onboarding (7 步驟) | ✅ | 完成後 redirect 到 routine setup |
| Routine Setup (AM/PM) | ✅ | 自由輸入，存 user_products + user_routines |
| Daily Check-in (3 步驟) | ✅ | Photo → Habits → Products |
| AI 皮膚分析 | ✅ | 6 維度評分，40–95 範圍，main_concern 正確寫入 |
| Check-in 結果頁 | ✅ | 分數、每日建議、comedogenic 警告 |
| Home Dashboard | ✅ | 今日狀態、分數、products、streak、progress nudge |
| Product Diary | ✅ | 從 user_routines 讀取，dedup，14 天 insight |
| Diary 新增產品 | ✅ | 自由輸入表單（不需掃描/搜尋） |
| Progress page | 🔧 | 頁面存在但未確認圖表是否正常 |
| For You (推薦) | ✅ | AI 推薦基於最新掃描結果，非 onboarding concerns |
| Profile page | ✅ | 顯示 routine count |
| i18n 架構 | ✅ | en.ts + zh-TW.ts 建立，但語言切換 UI 尚未完成 |
| Daily Scan nav tab 紅點 | ✅ | 未 check-in 時顯示紅點 |
| 舊 /dashboard/checkin redirect | ✅ | 已 redirect 到 /checkin |
| 語言切換 UI | ❌ | 架構建好但 Profile 沒有語言選擇器 |
| 定期膚質報告 | ❌ | 未開始 |
| Favicon | ❌ | 未設定 |
| Community features | ❌ | 設計完成但需真實用戶數據 |

---

## 已知問題與注意事項

1. **main_concern 舊照片仍為 null**：2026-05-28 之前的照片使用舊版 prompt，`ai_analysis_raw` 沒有 `main_concern` 欄位，backfill 只能更新有此 key 的照片（共 3 筆）。未來新照片全部正確。

2. **scores 仍在 72–74 附近（舊照片）**：舊 prompt 導致 AI 固定回傳相近分數。新 prompt 已強制分數變化，但舊數據無法改變。Progress 圖表可能顯示異常平坦曲線。

3. **重複 user_products 仍在 DB**：user `99b3ff35` 有 6 筆 user_products（3 個實際產品各存 2 次）。Diary 和 Home 用 brand+name dedup 顯示正確，但 DB 仍有髒數據。可用 SQL 清理（非緊急）。

4. **user_product_logs 表是空的**：舊 table，已廢棄。所有新的產品都在 `user_routines` + `user_products`。

5. **Progress page 未測試**：存在 `src/app/dashboard/progress/page.tsx` 但未確認圖表是否正常顯示。

---

## 待辦工作（按優先順序）

### 🔴 高優先

1. **Progress page 測試與修復**
   - 檔案：`src/app/dashboard/progress/page.tsx`
   - 確認圖表查詢來源是否正確（應查 `skin_photos.overall_skin_score`）

2. **語言切換 UI**
   - 在 `src/app/dashboard/profile/page.tsx` 加 Language 選項
   - 儲存到 localStorage 或 `users` table 的新欄位
   - 在需要的地方 `import { getTranslations } from '@/lib/i18n'`

3. **Routine setup 完成後 redirect 改到 /dashboard**
   - 目前 redirect 到 `/dashboard/profile`（不直觀）
   - 改為 redirect 到 `/dashboard`

### 🟡 中優先

4. **清理 DB 重複資料（可選）**
   ```sql
   -- 刪除重複 user_products，保留最舊的一筆
   DELETE FROM user_products
   WHERE id IN (
     SELECT id FROM (
       SELECT id, ROW_NUMBER() OVER (
         PARTITION BY user_id, LOWER(brand), LOWER(name) ORDER BY created_at
       ) AS rn FROM user_products
     ) sub WHERE rn > 1
   );
   ```

5. **diary/[id] page 更新**
   - 目前 detail 頁查 `user_product_logs`（空表）
   - 但 diary 列表不再連結到 `/diary/[id]`，所以影響不大
   - 若需要 product detail 頁，改查 `user_routines`/`user_products`

6. **i18n 語言切換完成**
   - Profile 頁面加 Language selector (English / 繁體中文)

### 🟢 低優先

7. **Favicon 設定**：`/public/favicon.png` 或 `app/favicon.ico`

8. **定期膚質報告**：每 14/30 天自動生成 AI 皮膚總結

9. **PWA install prompt**：確認 manifest.json 正確

10. **Community Picks**：需要 50+ 真實用戶數據才有意義

---

## 重要技術筆記

### 資料表對照

| 用途 | 正確資料表 | 廢棄資料表（勿用） |
|------|------------|------------------|
| 使用者產品 | `user_products` + `user_routines` | `user_product_logs`（空） |
| 官方產品資料庫 | `products`（空，未填資料） | — |
| AI 分析結果 | `skin_photos` | — |
| 每日打卡 | `skin_checkins` | — |
| 打卡用了哪些產品 | `checkin_products` | — |

### API 端點

| 端點 | 用途 |
|------|------|
| `POST /api/analyze-skin` | 送照片給 Claude Vision，存到 skin_photos |
| `GET /api/ai-recommendations` | 讀最新掃描結果，呼叫 Claude 生成 3 個產品推薦 |
| `POST /api/identify-product` | 舊版 AI 產品識別（已廢棄） |

### 關鍵設計決策

1. **產品系統**：`user_products`（自由輸入）+ `user_routines`（連結 routine）。不強制綁定官方 `products` 表。
2. **AI 分析時機**：check-in 上傳照片後，client side fire-and-forget 呼叫 `/api/analyze-skin`。結果頁 polling 最多等 20 秒（8 次 × 2.5 秒）。
3. **main_concern 來源優先順序**：`skin_photos.main_concern` → `ai_analysis_raw->>'main_concern'` → fallback 'none'
4. **For You 推薦邏輯**：`recommendations` 表是空的（官方 products DB 未填）→ 永遠走 `ForYouEmptyState` → 呼叫 `/api/ai-recommendations` → 基於最新掃描生成推薦
5. **Deduplication**：`user_products` 有重複資料，所有讀取都以 brand+name 去重

### Supabase 今日 SQL 操作
```sql
-- 已執行：backfill main_concern from ai_analysis_raw
UPDATE skin_photos
SET 
  main_concern = ai_analysis_raw->>'main_concern',
  visible_observations = ARRAY(SELECT jsonb_array_elements_text(ai_analysis_raw->'visible_observations')),
  makeup_detected = (ai_analysis_raw->>'makeup_detected')::boolean
WHERE overall_skin_score IS NOT NULL
  AND ai_analysis_raw IS NOT NULL
  AND main_concern IS NULL;
-- Result: 3 rows updated (oiliness × 2, none × 1)
```

### 今日 DB 統計
| 指標 | 數值 |
|------|------|
| 總使用者（有 check-in） | 5 |
| 總 check-in 次數 | 9 |
| 有 AI 分析的照片 | 17 |
| 有 main_concern 的照片 | 3（最近 3 張） |
| 在 routine 的產品筆數 | 14（含重複）≈ 3 個獨立產品 |

---

## 工作規則（每次開始必讀）

```
1. 所有程式碼在 GitHub repo，先 git pull
2. 改完必須 git add + git commit + git push origin main
3. Supabase 用 MCP tool（project_id: udxodcbmzordjtskqeae）
4. 不要在本機找任何資料
5. 不要問使用者，直接做到完成
```
