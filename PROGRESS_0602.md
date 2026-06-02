# SkinProof 專案進度報告
最後更新：2026-06-02

## App 網址
- Production: https://skin-proof-23zt.vercel.app
- GitHub: https://github.com/optionmama/Skin-proof
- Supabase: https://udxodcbmzordjtskqeae.supabase.co

## 今日完成工作

### TASK 1 — AI 自動查詢產品成分（不再要求使用者手動輸入）
- 新增 `src/app/api/lookup-product-ingredients/route.ts`
  - 輸入 `productId`（單一產品）或 `all: true`（背景補齊所有缺成分資料的產品）
  - 用 Claude（claude-opus-4-5）查詢品牌＋產品名，回傳 key_ingredients、category、
    skin_type_suitable、concerns_targeted、ingredients_to_flag（comedogenic / irritating / actives）
  - 結果寫入 `user_products.ingredients_data` (JSONB)、`ingredients_fetched_at`、`product_full_name`
- 資料庫 migration：`add_ingredients_data_to_user_products`（已套用至雲端）
  - `user_products` 新增 `ingredients_data JSONB`、`ingredients_fetched_at TIMESTAMPTZ`、`product_full_name TEXT`
  - 註：成分屬於「產品」實體，存在 `user_products`（而非 `user_routines`）可避免 AM/PM 兩列重複，
    且符合 TASK 3/4 以 product id 去重的設計
- `src/app/dashboard/diary/add/page.tsx`：儲存產品後自動（fire-and-forget）呼叫查詢 API
- 移除所有「Add ingredients →」連結（ForYouEmptyState 不再出現）

### TASK 2 — 掃描結果頁導向 For You
- `src/app/dashboard/scan/page.tsx`：掃描結果下方新增「What would you like to do next?」區塊，
  含兩顆按鈕：
  - 📊 View today's full analysis（錨點 `#full-analysis` 捲動回 metrics）
  - ✨ See product recommendations →（導向 `/dashboard/recommendations?from=scan&concern=<主要問題>&date=<今日>`）

### TASK 3 — For You 智慧路由相容性檢查（無重複、無手動成分）
- `src/components/ForYouEmptyState.tsx` 重寫：
  - Section 1「Your routine today」：每個產品用 AI 抓到的 `ingredients_data` 做相容性判斷
    - 成分未抓到 → 顯示 ⏳「Looking up ingredients…」，並背景呼叫 `{all:true}` 補齊後即時更新
    - 相容性邏輯：oiliness>60 或 breakouts>50 且含 comedogenic → ⚠️；redness>55 且含 irritating → ⚠️；
      否則 ✅（若 concerns_targeted 命中偵測到的 main_concern 則顯示「Good choice — targets your detected X concern」）
  - Section 2 條件式：
    - 全部 ✅ → 顯示「Your current routine looks great for today's skin! 💚 No new products needed right now.」
    - 任一 ⚠️ → 呼叫 `/api/routine-replacements` 取得同類別替代品並顯示
  - Section 3：社群精選（CommunityPicks）固定在底部
- 新增 `src/app/api/routine-replacements/route.ts`
  - 針對被標記的產品，推薦 2-3 個「同類別、無問題成分」替代品
  - 嚴格排除 sunscreen / SPF / makeup / cleanser / body lotion（prompt + 後處理過濾）

### TASK 4 — 修正重複顯示
- `src/app/dashboard/recommendations/page.tsx`：以 product id 去重，AM＋PM 同一產品合併為單一列，
  標籤顯示「AM · PM」

### 額外修正
- 修正 AI 路由 JSON 解析：模型偶爾在 JSON 後附加說明文字導致 `JSON.parse` 失敗。
  改為擷取第一個完整的 `{...}` / `[...]` 區塊（lookup-product-ingredients、routine-replacements、ai-recommendations 皆已修正）。

## 全功能完成狀態
| 功能 | 狀態 | 備註 |
|------|------|------|
| AI 自動查詢成分 API | ✅ | 真實 Claude 呼叫驗證 5 個產品皆回傳正確 JSON |
| 儲存產品時自動觸發查詢 | ✅ | diary/add fire-and-forget |
| 背景補齊既有產品成分 | ✅ | ForYouEmptyState 偵測缺漏即呼叫 {all:true} |
| 移除手動輸入成分連結 | ✅ | 全站已無「Add ingredients」 |
| 掃描頁 → For You 雙按鈕 | ✅ | from=scan 帶入 concern/date |
| For You 路由相容性（AI 成分）| ✅ | 含 loading 狀態 |
| 全 ✅ → 路由很棒訊息 | ✅ | 已驗證（測試帳號為此情境）|
| 任一 ⚠️ → 替代品推薦 | ✅ | 替代品 API 真實呼叫驗證，回傳同類別無香精替代品 |
| 替代品排除防曬/洗面乳 | ✅ | prompt + 過濾雙重把關，3/3 通過 |
| AM/PM 去重合併 | ✅ | 真實資料確認 fe753d5d 有 4 個 am+pm 產品，合併為單列 |
| 建置通過 | ✅ | npm run build 無錯 |
| 生產環境 HTTP 200 | ✅ | curl 確認 |

## 驗證細節（本次以真實資料與真實 API 呼叫驗證）
- 對使用者 fe753d5d 的 5 個實際產品執行成分查詢並寫入 DB：
  - Torriden Dive-in Booster（serum）、Medicube PDRN Ampoule、醫美診所 神經醯胺、
    CeraVe Facial Moisturizing Lotion、NIVEA Luminous 630 Dark Spot Serum
  - NIVEA 含 Parfum/Fragrance（irritating）；其餘無 comedogenic/irritating 旗標
- 該使用者最新掃描 dimensions：oiliness 45、redness 18、breakouts 15、main_concern=oiliness
  → 所有產品皆 ✅（肌膚平穩，香精未達 redness>55 門檻）→「routine looks great」路徑
- 替代品 API 以「NIVEA 因香精被標記、concern=redness」測試 → 回傳 Klairs / Torriden / COSRX
  三款無香精 serum，皆通過防曬/洗面乳過濾

## 已知問題
- 🟡 無法進行登入後的瀏覽器點擊驗證：環境未連接使用者 Chrome、亦無測試帳號憑證。
  已改以「真實 Claude API 呼叫 + 真實 DB 資料 + 邏輯追蹤」完成端對端驗證。
- 🟡 同一產品被重複新增為多筆 user_products（不同 id）為既有資料品質問題（測試期重複新增），
  與 AM/PM 去重無關；去重只合併同一 product_id 的 am/pm 兩列。
- 🟢 Check-in AM「Confirm N products」計數本次未改動，沿用先前修正。

## 待辦工作（優先順序）
- 🔴 高：取得測試帳號或連接瀏覽器，完成登入後完整點擊驗證（含 ⚠️ 替代品 UI 實際渲染）
- 🟡 中：成分查詢失敗時的重試與快取（目前失敗則略過，下次開啟 For You 再補）
- 🟡 中：清理重複的 user_products 測試資料
- 🟢 低：替代品卡片加入「為何優於原產品」的對比說明

## 重要技術筆記
- DB tables：`user_products`（含新 ingredients_data/ingredients_fetched_at/product_full_name）、
  `user_routines`（product_id + routine_type，am/pm 各一列）、`skin_photos.ai_analysis_raw`（含 dimensions、main_concern）
- API 路徑：
  - `POST /api/lookup-product-ingredients` { productId } | { all: true }
  - `POST /api/routine-replacements` { brand, productName, category, flaggedIngredient, detectedConcern, region }
  - `GET /api/ai-recommendations?region=...`（無路由產品時的一般推薦）
- 模型：claude-opus-4-5；所有 AI 路由皆採「擷取第一個平衡 JSON 區塊」的穩健解析
- For You 區段順序：路由相容性 → （路由很棒 / 替代品 / 一般推薦）→ 社群精選
- Commit：43e4ca0（主要功能）、a960acf（JSON 解析修正）
</content>
