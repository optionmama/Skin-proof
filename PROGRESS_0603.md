# SkinProof 專案進度報告
最後更新：2026-06-03

## App 網址
- Production: https://skin-proof-23zt.vercel.app
- GitHub: https://github.com/optionmama/Skin-proof
- Supabase: https://udxodcbmzordjtskqeae.supabase.co

## 今日完成工作

### TASK 1 — 掃描結果頁「Home」按鈕改為「✨ For You」
- `src/app/dashboard/checkin/result/page.tsx`（「Today's Skin ✨」結果頁）
  - 底部動作列原本是 `[Home] [View progress]`，現改為 `[✨ For You] [📊 View progress]`
  - For You 按鈕導向 `/dashboard/recommendations?from=scan&concern=<main_concern>`
    （帶入該次掃描偵測到的主要膚況問題）
  - View progress 按鈕維持原樣，導向 `/dashboard/progress`
  - 移除未使用的 `Home` lucide icon，改用 `Sparkles`
- 同時順手把此頁面文字全面接上 i18n（標題、載入文字、routine 區段、回訪提示等）

### TASK 2 — 完成 i18n，讓語言切換真正生效
問題根因：基礎建設（LanguageProvider、translate、cookie/localStorage/Supabase 寫入）皆已存在，
但多數元件仍使用寫死英文字串、未呼叫 `t()`，導致切換語言後 UI 不變。

本次將所有優先頁面／元件接上 `useLanguage()`（client）或 `getT()`（server）：

| 檔案 | 類型 | 處理 |
|------|------|------|
| `src/app/dashboard/checkin/result/page.tsx` | client | `useLanguage()` |
| `src/app/dashboard/diary/page.tsx` | client | `useLanguage()` |
| `src/app/dashboard/progress/page.tsx` | client | `useLanguage()`（含 SkinReports 子元件）|
| `src/app/dashboard/diary/add/page.tsx` | client | `useLanguage()`（分類用 cat_* key）|
| `src/app/dashboard/recommendations/page.tsx` | server | `getT()` |
| `src/components/ForYouEmptyState.tsx` | client | `useLanguage()`（含相容性訊息）|
| `src/components/CommunityPicks.tsx` | client | `useLanguage()` |
| `src/components/RoutineList.tsx` | client | `useLanguage()` |

先前 session 已接上：`src/app/dashboard/page.tsx`（getT）、`DashboardNav`、
`checkin/ProductsStep`、`profile/page`、`/checkin`、`/routine/setup`、`diary/[id]`。
（`dashboard/checkin/page.tsx` 僅是 redirect，無字串。）

### LanguageContext 增強
- `src/lib/i18n/LanguageContext.tsx`
  - 初次載入時，若無 localStorage 設定則依瀏覽器語系自動偵測，並同步寫入 cookie
    （讓 server component 透過 `skinproof_lang` cookie 取得相同語言）
  - 載入後非同步向 Supabase `user_settings.language` 取得權威設定，存在且不同時即時套用
  - 優先序：Supabase（已登入）> localStorage > cookie > 瀏覽器語系 > en

### 翻譯字串
- `src/lib/i18n/translations.ts` 三語（en / zh-TW / zh-CN）新增約 60 組 key：
  - `progress_*`（圖表標題、統計卡、照片比較、報告區）
  - `foryou_*`（routine 相容性、替代品、一般推薦、購物連結）
  - `community_*`（社群精選標題、分級、footer）
  - `add_*`（新增產品表單）、`routine_remove_*`、`general_removing`

## 語言切換流程（端對端）
1. Profile → Language 面板選擇語言
2. `onSave` 寫入 Supabase `user_settings.language`，並呼叫 `setLang()`
3. `setLang()` 同步 state + localStorage + cookie + Supabase upsert
4. 所有 client 元件透過 `useLanguage().t()` 即時重新渲染
5. server 元件下次請求時讀 `skinproof_lang` cookie，回傳對應語言

## 全功能完成狀態
| 功能 | 狀態 | 備註 |
|------|------|------|
| 掃描結果 Home → ✨ For You | ✅ | 帶入 from=scan&concern |
| For You 按鈕導向 recommendations | ✅ | concern = 該次掃描 main_concern |
| View progress 維持 | ✅ | |
| 三語翻譯字典完整 | ✅ | en / zh-TW / zh-CN |
| 優先元件全部接上 t() | ✅ | 8 個剩餘檔案本次補齊 |
| Profile 語言選擇即時生效 | ✅ | setLang 同步四處 |
| Server 元件讀 cookie | ✅ | getT() / getServerLang() |
| 首次造訪自動偵測語系 | ✅ | navigator.language |
| Supabase 權威設定載入 | ✅ | useEffect 非同步同步 |
| 建置通過 | ✅ | npm run build 無錯 |
| 生產環境 HTTP 200 | ✅ | curl 確認 |

## 已知問題
- 🟡 無法進行登入後的瀏覽器點擊驗證：環境未連接使用者 Chrome、亦無測試帳號憑證。
  已以「建置通過 + 邏輯追蹤 + 生產環境 200」完成驗證。
- 🟡 少數低優先度字串仍為英文（例：recommendations 內已停用的官方產品卡片分支、
  CommunityPicks 內「Based on N users」統計列），因屬 dead code 或邊緣統計，暫不影響主要 UI。

## 待辦工作（優先順序）
- 🔴 高：取得測試帳號或連接瀏覽器，完成登入後逐語言點擊驗證
- 🟡 中：補齊剩餘邊緣字串（官方產品卡片、統計列）
- 🟢 低：依語言格式化日期／數字（目前仍用 en-US locale）

## 重要技術筆記
- i18n 檔案：
  - `src/lib/i18n/translations.ts`（三語字典 + `translate()`）
  - `src/lib/i18n/LanguageContext.tsx`（client Provider，`useLanguage()`）
  - `src/lib/i18n/server.ts`（`getServerLang()` / `getT()`，讀 cookie）
- Cookie 名稱：`skinproof_lang`；語言：`en` | `zh-TW` | `zh-CN`
- client 元件用 `const { t } = useLanguage()`；server 元件用 `const t = await getT()`
- 變數插值：`t('key', { count: 3 })` → 字串中 `{count}` 被取代
- Commit：8c9f0ba（本次主要功能）
