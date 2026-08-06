# Brochure Outline and Feishu Sync Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the local brochure outline with the approved 12-page function-led structure and synchronize the same Markdown body to the existing Feishu document with a verified read-back.

**Architecture:** The local Markdown file remains the editable content source for this operation. The Feishu document is overwritten from that exact file in Markdown mode, then fetched back as Markdown and checked for required headings and key product-boundary statements. The PDF generator and brochure imagery are out of scope.

**Tech Stack:** Markdown, `rg`, `git diff`, `lark-cli docs +update`, `lark-cli docs +fetch`

---

## File responsibility map

- Modify: `docs/云忆宣传手册-逐页大纲.md` — canonical approved 12-page brochure copy, including page elements, illustration-generation requirements, and evidence boundaries.
- Create: `docs/codex/plans/2026-08-06-brochure-outline-feishu-sync.md` — execution checklist and verification commands.
- External update: Feishu document `QJ56dC4y5oEhZcxGeG9cd0kgnjf` — synchronized online copy of the local Markdown content.
- Test artifact: `/private/tmp/yunyi-brochure-feishu-fetch.json` — transient Feishu read-back envelope used only for verification.

### Task 1: Replace the local outline

**Files:**
- Modify: `docs/云忆宣传手册-逐页大纲.md`

- [ ] **Step 1: Write the approved 12-page outline**

Replace the current outline with the approved content from `docs/superpowers/specs/2026-08-06-brochure-function-content-design.md`. Every page must contain `页面目的`, `核心文案`, `页面元素`, `插图生成要求`, and `功能证据与边界`.

- [ ] **Step 2: Verify structural coverage**

Run:

```bash
rg -c '^## 第 [0-9]+ 页' 'docs/云忆宣传手册-逐页大纲.md'
rg -c '^\*\*页面元素\*\*' 'docs/云忆宣传手册-逐页大纲.md'
rg -c '^\*\*插图生成要求\*\*' 'docs/云忆宣传手册-逐页大纲.md'
rg -c '^\*\*功能证据与边界\*\*' 'docs/云忆宣传手册-逐页大纲.md'
```

Expected: each command prints `12`.

- [ ] **Step 3: Verify fixed product boundaries**

Run:

```bash
rg -n '认识讲述人.*开口讲述.*AI 适度追问.*故事成稿.*进入书房|书房只展示已完成|不替用户编故事|必须经过.*确认|AI 不生成文字' 'docs/云忆宣传手册-逐页大纲.md'
```

Expected: all five boundary concepts are present in the output.

- [ ] **Step 4: Run Markdown diff checks**

Run:

```bash
git diff --check -- 'docs/云忆宣传手册-逐页大纲.md'
```

Expected: exit code `0` with no output.

### Task 2: Synchronize the Feishu copy

**Files:**
- Read: `docs/云忆宣传手册-逐页大纲.md`
- External update: Feishu document `QJ56dC4y5oEhZcxGeG9cd0kgnjf`

- [ ] **Step 1: Load the version-matched Feishu update guidance**

Run:

```bash
lark-cli skills read lark-doc
lark-cli skills read lark-doc references/lark-doc-update.md
lark-cli skills read lark-doc references/lark-doc-md.md
lark-cli skills read lark-doc references/style/lark-doc-style.md
lark-cli skills read lark-doc references/style/lark-doc-update-workflow.md
```

Expected: each command exits `0` and describes Markdown overwrite and verification rules.

- [ ] **Step 2: Overwrite Feishu from the local Markdown source**

Run:

```bash
lark-cli docs +update \
  --doc 'QJ56dC4y5oEhZcxGeG9cd0kgnjf' \
  --command overwrite \
  --doc-format markdown \
  --content '@docs/云忆宣传手册-逐页大纲.md' \
  --as user \
  --format json
```

Expected: exit code `0`, `ok: true`, identity `user`, and a successful document revision result.

- [ ] **Step 3: Load the version-matched fetch guidance and read back**

Run:

```bash
lark-cli skills read lark-doc references/lark-doc-fetch.md
lark-cli docs +fetch \
  --doc 'QJ56dC4y5oEhZcxGeG9cd0kgnjf' \
  --scope full \
  --detail simple \
  --doc-format markdown \
  --as user \
  --format json
```

Expected: exit code `0`, `ok: true`, and Markdown content containing all 12 page headings.

- [ ] **Step 4: Verify the Feishu read-back**

Inspect the returned Markdown for:

```text
第 1 页｜封面
第 12 页｜封底
认识讲述人 → 开口讲述 → AI 适度追问 → 故事成稿 → 进入书房
书房只展示已完成
AI 不生成文字、按钮、二维码、品牌标识和产品界面
```

Expected: all markers are present; otherwise stop and report the mismatch instead of claiming synchronization.

### Task 3: Final consistency check and commit

**Files:**
- Modify: `docs/云忆宣传手册-逐页大纲.md`
- Create: `docs/codex/plans/2026-08-06-brochure-outline-feishu-sync.md`

- [ ] **Step 1: Inspect only scoped changes**

Run:

```bash
git status --short
git diff -- 'docs/云忆宣传手册-逐页大纲.md' 'docs/codex/plans/2026-08-06-brochure-outline-feishu-sync.md'
```

Expected: unrelated user files remain untouched.

- [ ] **Step 2: Commit the outline and plan**

Run:

```bash
git add -- 'docs/云忆宣传手册-逐页大纲.md' 'docs/codex/plans/2026-08-06-brochure-outline-feishu-sync.md'
git commit -m 'docs: add function-led brochure outline'
```

Expected: one commit containing only the local outline and implementation plan. The Feishu update is reported separately as an external write.
