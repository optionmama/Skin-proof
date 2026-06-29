---
description: Run a SkinProof bug-fix round end-to-end with the project's guardrails (diagnose → fix → build → push → verify → log to Notion)
argument-hint: paste the task brief, or a path to a Round-N .md file
---

You are doing a SkinProof bug-fix round. Follow this exact protocol. Do NOT ask for permission between steps — run autonomously through verification.

## 0. Load guardrails FIRST (before reading the task)
- Read the memory file `skinproof-bugfix-rounds` (root causes + hard rules).
- Read the **🛡️ 防回歸紀錄 (Anti-Regression Ledger)** at the bottom of Notion page "🪞 SkinProof app 上架計畫" (id `37e57e78-a62a-8103-8657-d23b72f7a76c`), entries R1 onward.
- Treat every rule there as binding. Never re-introduce a fixed bug to fix a new one.

## 1. The task
$ARGUMENTS

(If the above is a file path, read that file. If empty, ask the user for the brief.)

## 2. Diagnose before fixing (mandatory for any RECURRING bug)
- Read the actual code paths involved AND query Supabase (project `udxodcbmzordjtskqeae`) for evidence.
- Output a short DIAGNOSIS: what the code does now, where it breaks, why past fixes didn't stick. Only then write the fix. Fix root causes, not symptoms.

## 3. Hard rules (never violate)
- AI calls awaited, never fire-and-forget. Analysis is OWNED by a mounted component (result page), never fired-and-forgotten from check-in.
- AI provider/model: use whatever `src/lib/ai.ts` `callAI()` is currently configured to use — do not hardcode a different provider/model.
- All UI text via i18n (en / zh-TW / zh-CN) — never hardcode strings.
- Bottom nav on every page + enough `pb` that content isn't hidden. No `min-h-screen` without `overflow-y-auto`.
- No "Claude AI"/vendor name in UI. No affiliate disclaimer re-added.
- ONE shared compatibility fn (`src/lib/compatibility.ts`) used by both Today's Skin and For You.
- "尋找替代品" navigates, never errors. Sunscreen only in 每日必備, never a primary rec.
- Respect each task's file scope — don't touch files outside it.

## 4. Verify, then ship (no pausing)
- `export TMPDIR=/Users/amychen/.claude-tmp && npm run build` until clean.
- Run the brief's verification + regression checklist mentally / via DB.
- Commit, `git push origin main`, then confirm `https://skin-proof-23zt.vercel.app/` returns 200.

## 5. Record (so it never regresses)
- Append a new R-entry (root cause + fix + commit hash) to the Notion Anti-Regression Ledger.
- Update the `skinproof-bugfix-rounds` memory's "current head commit" line.
- Report to the user in 繁體中文: what broke, root cause, fix, commit, and the exact things to test on TestFlight.
