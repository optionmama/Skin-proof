# SkinProof — 開發進度報告
**日期：2026-05-28**  
**Repo：** https://github.com/optionmama/Skin-proof  
**Production：** https://skin-proof-23zt.vercel.app  
**Supabase：** https://udxodcbmzordjtskqeae.supabase.co  
**部署方式：** push to GitHub main → Vercel auto-deploy（1–2 分鐘）

---

## ⚠️ 工作規則（每次開始必讀）

1. 所有程式碼在 GitHub repo，不要在本機找任何資料
2. 改完必須 `git add . && git commit -m "..." && git push origin main`
3. 資料庫用 Supabase MCP tool（project_id: `udxodcbmzordjtskqeae`）
4. 不要假設本機有最新版，每次開始先 `git pull`

---

## ✅ 今日完成（2026-05-28）

### 🔴 Critical Bug Fixes

#### Bug 1 — AI 分數永遠顯示 "—"（已修復）
- **根本原因**：`src/app/checkin/page.tsx` 在 `skin_photos` insert 時加了 `photo_date` 欄位，但 schema 中不存在
- insert 靜默失敗 → `photoId = null` → `analyze-skin` API 從未呼叫 → 分數永遠不寫入
- **修復**：移除 `photo_date`，現在照片正確上傳並觸發 AI 分析

#### Bug 2 — Home 頁面 Products 顯示 0（已修復）
- **根本原因**：查詢 `user_product_logs`（舊 table），使用者實際產品存在 `user_routines`
- **修復**：改查 `user_routines` 計數和顯示

#### Bug 3 — 日記新增產品要求掃描/搜尋資料庫（已修復）
- **根本原因**：555 行的 scan → search → DB lookup 流程，亞洲品牌完全找不到
- **修復**：替換為簡單自由輸入表單（品牌 + 名稱 + 分類 + AM/PM）

---

### 📋 功能開發

#### TASK 1 — 移除所有免責聲明文字
- 移除全站所有 "Not a medical diagnosis"、"For tracking purposes only" 等文字
- 移除 Home、Scan、Recommendations、Diary、Profile 等頁面的 disclaimer box
- 移除 `DISCLAIMER_TEXT` 和 `SHORT_DISCLAIMER` 常數
- 移除 Auth 頁面的 "not medical advice" 段落
- Onboarding "disclaimer" 步驟改為友好文字

#### TASK 2 — 修復 AI 評分邏輯
**檔案：** `src/app/api/analyze-skin/route.ts`
- 新 prompt：6 維度獨立評分 + 加權計算
  - redness_inflammation（20%）、active_breakouts（25%）、hydration_dryness（20%）
  - oiliness_shine（15%）、pore_visibility（10%）、overall_evenness（10%）
- 分數範圍強制 40–95，不允許預設回傳 72–75
- 新增：makeup 偵測、visible_observations 陣列、main_concern 欄位
- 儲存到 `skin_photos.ai_analysis_raw`（JSONB）

#### TASK 3 — Check-in 結果頁面
**檔案：** `src/app/dashboard/checkin/result/page.tsx`（新建）
- 分數圓環顯示 + 6 維度 bar
- 根據 `main_concern` 顯示每日行動建議
- Comedogenic 成分警告（若有 breakouts + 含問題成分的產品）
- 若無產品記錄，顯示 "Add products" 提示
- "Come back tomorrow for Day X" 尾語

#### TASK 4 — Product Diary 改版
**檔案：** `src/app/dashboard/diary/page.tsx`
- 副標題：「記錄你用的每樣產品，讓我們找出什麼真的有效」
- 14 天使用後自動顯示分數差值 insight（↑ +X pts）
- 成分亮點標籤：✓ niacinamide / ⚠️ fragrance
- 更新空狀態文字

#### TASK 5 — For You / Discover 頁面改版
**檔案：** `src/app/dashboard/recommendations/page.tsx`
- 全英文，移除中文文字
- 移除 "Products ranked by affiliate commission" info box
- 空狀態改為 AI 推薦引擎（見 Task 6）
- 信心徽章：🔴 AI Estimate / 🟡 Community: Growing / 🟢 Community Verified

#### TASK 6 — For You 空狀態 AI 推薦
**新建：**
- `src/app/api/ai-recommendations/route.ts`：呼叫 Claude API 生成 3 個真實產品推薦
- `src/components/ForYouEmptyState.tsx`：顯示成分建議、產品警告、AI 推薦卡
- 推薦基於最新掃描結果（優先），fallback 到 onboarding profile
- 社群功能預告 section（dark card）

#### TASK 7 — i18n 語言架構
**新建：**
- `src/lib/i18n/en.ts`：全站英文字串
- `src/lib/i18n/zh-TW.ts`：完整繁中翻譯（與 en.ts 結構完全對應）
- `src/lib/i18n/index.ts`：`getTranslations(lang)` + `export const t = en`
- 替換所有中文在：`checkin/page.tsx`、`ProductsStep.tsx`、`routine/setup/page.tsx`、`profile/page.tsx`

#### TASK 8 — Home 頁面重設計
**檔案：** `src/app/dashboard/page.tsx`
- 未 check-in：顯示 3 步驟引導大卡片（Take photo → Confirm products → Get report）
- 已 check-in：顯示分數 + 差值（↑ +3 vs prev）+ main concern + "View today's report →"
- 進度提示：< 14 天顯示 "Results sharpen after 14 days 🔬"，≥ 14 天顯示 "Great consistency!"
- Quick actions 從 4 個縮減為 2 個：My Progress + For You
- Current routine 改從 `user_routines` 顯示

#### TASK 9 — Navigation 改版
**檔案：** `src/components/DashboardNav.tsx`
- "Check-in" → **"Daily Scan"**
- 連結改為 `/checkin`（新的 3 步驟完整流程）
- 若今天未 check-in，Daily Scan tab 顯示紅點

---

## 🗄️ Supabase Schema 變更（今日執行）

```sql
-- skin_photos 新增欄位（AI 分析結果）
ALTER TABLE skin_photos
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS makeup_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visible_observations TEXT[],
ADD COLUMN IF NOT EXISTS main_concern TEXT;

-- skin_checkins 新增欄位
ALTER TABLE skin_checkins
ADD COLUMN IF NOT EXISTS products_used JSONB,
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS makeup_detected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS visible_observations TEXT[],
ADD COLUMN IF NOT EXISTS main_concern TEXT;

-- skin_profiles 新增欄位（routine 設定完成標記）
ALTER TABLE skin_profiles
ADD COLUMN IF NOT EXISTS routine_setup_completed_at TIMESTAMPTZ;
```

---

## 🗂️ 現有頁面/路由結構

```
/ (Landing page)
/auth (Login/Signup)
/onboarding (7-step skin profile setup → redirects to /routine/setup)
/routine/setup (AM/PM routine 設定，自由輸入品牌+名稱)
/checkin (新的 3 步驟 check-in：Photo → Habits → Products)
/dashboard (Home)
/dashboard/checkin (舊的 check-in，仍存在但不在 nav 中)
/dashboard/checkin/result?checkin_id=XXX (AI 分析結果 + 每日建議)
/dashboard/scan (歷史 AI 分析記錄)
/dashboard/diary (Product Diary 列表)
/dashboard/diary/add (新增產品 — 自由輸入表單)
/dashboard/diary/[id] (個別產品詳情)
/dashboard/progress (進度圖表)
/dashboard/recommendations (For You 推薦)
/dashboard/profile (使用者設定)
/dashboard/prices/[productId] (比較價格)
/admin (管理後台)
/privacy, /terms (法律頁面)
```

---

## 🗺️ 重要資料表對照

| 功能 | 資料表 | 備註 |
|------|--------|------|
| 使用者 | `users` | Supabase auth.users 延伸 |
| 膚質資料 | `skin_profiles` | onboarding 填寫 |
| 每日打卡 | `skin_checkins` | checkin_date 為 unique key |
| 皮膚照片+AI分析 | `skin_photos` | overall_skin_score, ai_analysis_raw |
| 使用者自訂產品 | `user_products` | 自由輸入，不強制綁 products table |
| 使用者 routine | `user_routines` | 連結 user_products，有 routine_type, step_order |
| 每次打卡使用產品 | `checkin_products` | 連結 skin_checkins + user_products |
| 推薦（系統生成） | `recommendations` | 連結 products（官方 DB） |
| 官方產品資料庫 | `products` | 管理員維護，用戶不需要用到 |

---

## ❌ 尚未完成 / 已知問題

### 🔴 高優先（會影響使用）

1. **舊版 check-in 路由未移除**
   - `/dashboard/checkin` 仍存在（舊 UI，有 disclaimer checkbox 等）
   - 使用者不會看到它（nav 已改連結），但混亂
   - **待辦**：`src/app/dashboard/checkin/page.tsx` 可以改成 redirect 到 `/checkin`

2. **check-in 流程 — 照片上傳成功但 AI 分析可能 timeout**
   - AI 分析是 fire-and-forget（client 發出請求後不等回應）
   - Vercel free tier 有 10 秒 function timeout（但已設 `maxDuration = 60`）
   - 如果 Claude API 較慢，結果頁面的 poll 最多等 8 × 2.5s = 20 秒
   - **待辦**：考慮用 Supabase Edge Function 或 webhook 處理 AI 分析

3. **For You 頁面推薦基於 skin_checkins.main_concern，但 main_concern 儲存在 skin_photos**
   - `ai-recommendations` route 查 `skin_photos.ai_analysis_raw` 裡的 `main_concern`
   - 這是正確的，但要確認 `skin_photos.main_concern` 欄位也有正確寫入
   - **待辦**：驗證 analyze-skin route 確實有 update `main_concern` column

4. **Diary 頁面 14 天 insight：分數差值需要有足夠的 skin_photos 資料**
   - 若使用者照片少於 2 張，difference 顯示為 null/not available
   - 目前是優雅降級（顯示 "Tracking in progress"），可接受

### 🟡 中優先（功能缺失）

5. **語言切換 UI 未完成**
   - i18n 架構已建立（`en.ts` + `zh-TW.ts`），但 Profile 頁面沒有語言選擇器
   - **待辦**：在 `dashboard/profile/page.tsx` 加 Language 選項（儲存到 localStorage 或 `users` table）
   - 然後在 `dashboard/layout.tsx` 讀取語言設定，傳入需要的 component

6. **Check-in 結果頁面 — "Recommended for you" 區塊未實作**
   - 設計說要在結果頁底部顯示 3 個 AI 產品推薦
   - 目前只有每日建議和 comedogenic 警告
   - **待辦**：在 result page 加入 `<ForYouEmptyState />` 或直接呼叫 `/api/ai-recommendations`

7. **Progress 頁面**
   - 尚未確認此頁面的圖表是否正常顯示（需要有足夠資料）
   - **待辦**：測試並確認 `dashboard/progress/page.tsx` 的圖表顯示

8. **`dashboard/diary/page.tsx` 的新增按鈕**
   - 目前 `+` 按鈕連結到 `/dashboard/diary/add`（新的自由輸入表單）✅
   - 但 Diary 列表仍從 `user_product_logs` 讀取，不是 `user_routines`
   - 使用者用新表單新增的產品在 diary 列表看不到
   - **待辦**：更新 `diary/page.tsx` 的 query，改從 `user_routines` + `user_products` 讀取

9. **Onboarding 最後步驟**
   - 目前完成 onboarding → redirect 到 `/routine/setup`（正確）
   - 但 `/routine/setup` 存檔後 redirect 到 `/dashboard/profile`（不夠直觀）
   - **待辦**：存檔後改 redirect 到 `/dashboard`

### 🟢 低優先（體驗優化）

10. **定期膚質報告**（每 2 週 / 30 天自動生成）— 尚未開始

11. **Favicon 設定** — 尚未設定，顯示預設瀏覽器 icon

12. **PWA 安裝體驗** — `manifest.json` 存在但未確認 install prompt 是否正常

13. **7 日留存率 / 30 日追蹤率** — 尚無追蹤機制

14. **Community Picks 真實資料** — 目前顯示 AI 估算，需要真實使用者資料才能切換到社群驗證

---

## 📝 明日待辦（建議順序）

### 第一優先（修 bug）
```
1. 修 diary/page.tsx：改從 user_routines + user_products 讀取
   （否則新增的產品在 diary 列表看不到）

2. 確認 main_concern 欄位有正確寫入 skin_photos
   SQL: SELECT id, main_concern, overall_skin_score FROM skin_photos 
        WHERE overall_skin_score IS NOT NULL LIMIT 5;

3. 把 /dashboard/checkin/page.tsx 改為 redirect 到 /checkin
```

### 第二優先（功能完成）
```
4. 語言選擇器：在 Profile 頁面加 Language 設定（en / zh-TW）

5. Check-in result 頁面加入 "Recommended for you" 區塊

6. Routine setup 完成後 redirect 到 /dashboard 而非 /dashboard/profile
```

### 第三優先（新功能）
```
7. 定期膚質報告（每 2 週）
8. Favicon 設定
9. 留存率追蹤
```

---

## 🔧 關鍵程式碼位置速查

| 功能 | 檔案 |
|------|------|
| AI 分析 prompt | `src/app/api/analyze-skin/route.ts` |
| AI 產品推薦 | `src/app/api/ai-recommendations/route.ts` |
| Check-in 流程 | `src/app/checkin/page.tsx` |
| Check-in 結果頁 | `src/app/dashboard/checkin/result/page.tsx` |
| Home 頁面 | `src/app/dashboard/page.tsx` |
| For You 頁面 | `src/app/dashboard/recommendations/page.tsx` |
| For You 空狀態組件 | `src/components/ForYouEmptyState.tsx` |
| Diary 列表 | `src/app/dashboard/diary/page.tsx` |
| Diary 新增產品 | `src/app/dashboard/diary/add/page.tsx` |
| Routine 設定 | `src/app/routine/setup/page.tsx` |
| 底部導覽 | `src/components/DashboardNav.tsx` |
| i18n 英文字串 | `src/lib/i18n/en.ts` |
| i18n 繁中字串 | `src/lib/i18n/zh-TW.ts` |
| Products step 組件 | `src/components/checkin/ProductsStep.tsx` |
| Supabase server client | `src/lib/supabase/server.ts` |
| Supabase browser client | `src/lib/supabase/client.ts` |

---

## 💡 設計決策備忘

1. **產品系統**：使用者產品存 `user_products`（自由輸入），不強制綁定 `products` 官方資料庫
2. **Routine vs Diary**：`user_routines` = 每天固定護膚步驟；`user_product_logs` = 舊式日記（不再使用）
3. **AI 分析觸發**：check-in 上傳照片後，client side fire-and-forget call `/api/analyze-skin`
4. **分數來源**：`skin_photos.overall_skin_score`（AI 計算），不是使用者自填
5. **For You 推薦資料來源**：優先用最新 `skin_photos.ai_analysis_raw.main_concern`，fallback 到 `skin_profiles.primary_concerns`
6. **語言**：全站英文，i18n 架構已建，Profile 頁面待加語言切換 UI
7. **免責聲明**：全部移除，只保留 `privacy/page.tsx` 和 `terms/page.tsx` 的法律頁面

---

*Last updated: 2026-05-28 by Claude Code*
