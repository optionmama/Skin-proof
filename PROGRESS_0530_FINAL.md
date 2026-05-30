# SkinProof 專案進度報告（最終版）
**最後更新：2026-05-30**
**Vercel：** https://skin-proof-23zt.vercel.app ✅ HTTP 200

---

## App 網址與環境

| 項目 | 內容 |
|------|------|
| Production | https://skin-proof-23zt.vercel.app |
| GitHub | https://github.com/optionmama/Skin-proof |
| Supabase | https://udxodcbmzordjtskqeae.supabase.co |
| AI Model | claude-opus-4-5 |
| 部署 | push to GitHub main → Vercel auto-deploy |

---

## ✅ 全部完成功能一覽

| 功能模組 | 狀態 | 說明 |
|----------|------|------|
| Landing page | ✅ | 無 disclaimer，乾淨設計 |
| Auth (登入/註冊) | ✅ | Supabase auth |
| Onboarding (8 步驟) | ✅ | 含 age_range 選擇（7 個選項） |
| Routine Setup (AM/PM) | ✅ | 自由輸入品牌+名稱，拖拉排序 |
| Daily Check-in | ✅ | Photo → Habits → Products 三步驟 |
| Check-in Products 左滑刪除 | ✅ | session-only，不動 DB |
| Check-in Products 長按編輯 | ✅ | 永久更新 user_products + user_routines |
| AI 皮膚分析 | ✅ | 6 維度評分，40–95 範圍，makeup 偵測 |
| Check-in 結果頁 | ✅ | 分數 + 每日建議 + routine 相容性 + community teaser |
| Home Dashboard | ✅ | 分數、products（deduplicated）、streak、routine 帶刪除 |
| Home — 時間問候語 | ✅ | 早安/午安/晚安依時間切換，多語言 |
| Product Diary | ✅ | 從 user_routines 讀取，14 天 insight |
| Diary 新增產品 | ✅ | 自由輸入表單 |
| Progress page | ✅ | 圖表顯示膚況分數趨勢 |
| For You (AI 推薦) | ✅ | 基於最新掃描，非 onboarding concerns |
| Community Picks 75+ | ✅ | 真實查詢達到 75 分的用戶使用的產品 |
| Community Picks 80+ | ✅ | 真實查詢達到 80 分的用戶使用的產品 |
| Google Shopping 連結 | ✅ | 地區域名（.com.tw/.co.uk/.com.au） |
| Profile 設定 | ✅ | 全部有效（Notifications/Dark Mode/Language/Region/Privacy） |
| 語言切換 (i18n) | ✅ | EN / 繁體中文 / 简体中文，即時生效 |
| 語言自動偵測 | ✅ | 第一次開啟依 browser locale 自動設定 |
| Dark Mode | ✅ | 即時 toggle，儲存到 user_settings |
| Region 設定 | ✅ | 5 個地區，影響 AI 推薦品牌 |
| Age Range（Onboarding） | ✅ | 7 個選項，存到 skin_profiles.age_range |
| Profile — Age Range 顯示 | ✅ | Skin Profile 區塊顯示 |
| Routine 刪除（Home） | ✅ | 🗑 trash icon + 確認 bottom-sheet |

---

## 📊 今日完成的工作（2026-05-30）

### Session 1（早上）
- Community Picks：75+ 和 80+ 兩個 tier（從 85+ 降到 75/80）
- 建立 `/api/community-picks` 真實查詢
- 建立 `CommunityPicks` 組件

### Session 2（下午）
- Google Shopping 連結（For You 頁每張產品卡）
- Profile 設定全部有效（4 個設定都可點）
- Profile age range 顯示
- `user_settings` table 建立（Supabase）

### Session 3（傍晚）
- 左滑刪除 + 長按編輯（Check-in Products）
- 產品計數 bug 修復（唯一計數）
- Region-aware 推薦（5 個地區）
- Google Shopping 地區域名

### Session 4（晚上）
- **i18n 完整實作**：
  - `translations.ts`：EN / zh-TW / zh-CN 三語言
  - `LanguageContext.tsx`：React context，localStorage + cookie + Supabase
  - `server.ts`：server component 讀取語言
  - Layout 包 LanguageProvider
  - DashboardNav：6 個 tab 標籤多語言
  - Profile：3 個語言選項，選擇後即時切換全 app
  - Home dashboard：問候語、stat labels 多語言
- `skin_reports` table 建立（為 periodic reports 準備）

---

## ❌ 未完成項目

### 🔴 高優先（下次必做）

**1. Periodic Skin Reports（14天/30天/90天報告）**
- 已建立 `skin_reports` Supabase table
- 需要建立 `/api/skin-report/route.ts`
- 需要更新 Progress page 加 report cards
- 需要建立 `progress/report/[period]/page.tsx`
- 完整規格在 `/Users/amychen/Downloads/skinproof 0530 i18n count reports.md` Task 3

**2. i18n — 其他 client 頁面尚未翻譯**
目前只翻譯了：DashboardNav、Home dashboard、Profile
尚未翻譯：
- `src/app/checkin/page.tsx`（仍用舊 `t.checkin.xxx`）
- `src/components/checkin/ProductsStep.tsx`（仍用舊系統）
- `src/app/dashboard/diary/page.tsx`
- `src/app/dashboard/recommendations/page.tsx`
- `src/app/dashboard/checkin/result/page.tsx`

做法：在每個 client component 加 `const { t } = useLanguage()` 然後替換文字

**3. Product count "Confirm 5 products" bug**
- 規格的 spec 建議用 product `id` 而非 brand|name 做 dedup
- 有可能還有邊緣案例

### 🟡 中優先

**4. Progress page 圖表 — 資料來源驗證**
- 圖表存在，但舊資料分數都是 72-75（舊 prompt），曲線平坦
- 等新資料累積後自然改善

**5. Routine setup 完成後 redirect 改到 /dashboard**
- 目前到 /dashboard/profile（不直覺）

**6. DB 清理：重複 user_products**
```sql
DELETE FROM user_products WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY user_id, LOWER(COALESCE(brand,'')), LOWER(name) ORDER BY created_at
    ) AS rn FROM user_products
  ) sub WHERE rn > 1
);
```

### 🟢 低優先

**7. Favicon** — 未設定

**8. PWA install prompt** — 存在但未確認是否正常

**9. Download my data** — Privacy 頁面按鈕顯示 "coming soon"

**10. Community features 真實資料** — 目前用戶少，大多顯示空狀態

---

## 重要技術筆記

### i18n 架構
```
src/lib/i18n/
  translations.ts    → 所有文字（EN/zh-TW/zh-CN），flat key 結構
  LanguageContext.tsx → React context，client component
  server.ts          → 讀 cookie，供 server component 使用
  en.ts              → 舊系統（保留，部分頁面仍在使用）
  zh-TW.ts           → 舊系統（保留）
  index.ts           → 舊系統 export
```

**語言切換流程：**
1. 用戶在 Profile 選語言
2. `setLang()` → localStorage + cookie + Supabase user_settings.language
3. Client components：`useLanguage()` → 即時更新
4. Server components：讀 cookie → `getT()` → 下次請求生效

### 資料表對照
| 用途 | 資料表 |
|------|--------|
| 使用者產品 | `user_products` + `user_routines` |
| AI 分析 | `skin_photos`（overall_skin_score, main_concern, etc.） |
| 每日打卡 | `skin_checkins` |
| 設定 | `user_settings`（dark_mode, language, region, notif_*） |
| 膚質資料 | `skin_profiles`（含 age_range） |
| 膚況報告 | `skin_reports`（已建立，API 待實作） |

### 重要 API
| 端點 | 用途 |
|------|------|
| `POST /api/analyze-skin` | Claude Vision 分析 skin_photos |
| `GET /api/ai-recommendations` | AI 產品推薦（地區感知） |
| `GET /api/community-picks?threshold=75\|80` | 社群達標產品 |
| `POST /api/skin-report` | （待建立）定期膚況報告 |

### 工作規則（每次開始必讀）
```
1. git pull 先
2. 改完 npm run build — 0 errors 才能 push
3. git push origin main
4. 確認 Vercel HTTP 200
5. Supabase project_id: udxodcbmzordjtskqeae
6. 不要問使用者，直接做到完成
```
