# AI Image Prompts Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已确认的金句卡文章语境提示词和身份一致半身人物提示词同步为项目正式规范，并让原型 PRD 与自动测试保持一致。

**Architecture:** 以设计稿为决策真源，将图片模型可直接使用的提示词分别落入两个职责单一的文档。原型只展示产品规则和输入输出边界，不嵌入大段模型提示词；Node 测试负责防止人物规则、隐私边界和身份一致性约束回退。

**Tech Stack:** Markdown、单文件 HTML 原型、Node.js `node:test`

---

## 文件责任图

- Create: `docs/ai/persona-image-prompts.md` — 半身人物形象的输入、主提示词、风格词、负向词和模型参数建议。
- Modify: `docs/ai/quote-card-background-prompts.md` — 金句卡的文章语境提炼、可生成人物规则和背景生成提示词。
- Modify: `prototype-v17.html` — 更新金句卡和人物形象内嵌 PRD，使原型说明与正式提示词一致。
- Modify: `tests/avatar-quote-loop.test.mjs` — 为文章语境、允许背景人物和人脸身份一致性增加契约测试。

### Task 1: 锁定提示词契约测试

**Files:**
- Modify: `tests/avatar-quote-loop.test.mjs`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: 写金句卡文章语境失败测试**

增加断言，要求正式金句卡提示词包含 `article_content`、`core_meaning`、`visual_elements`，并明确“根据文章语境决定是否出现人物”。

- [ ] **Step 2: 写人物身份一致性失败测试**

读取 `docs/ai/persona-image-prompts.md`，断言包含“唯一人物身份依据”“脸型、五官结构与比例”“不要把人物年轻化”和身份参考权重建议。

- [ ] **Step 3: 运行测试并确认失败**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: FAIL，原因是新人物提示词文档不存在，旧金句卡文档也没有文章语境字段。

### Task 2: 更新金句卡正式提示词

**Files:**
- Modify: `docs/ai/quote-card-background-prompts.md`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: 增加两阶段生成说明**

写明 `文章和金句 → 文本模型结构化提炼 → 图片模型生成背景`，并说明完整文章不直接发送给图片模型。

- [ ] **Step 2: 增加结构化输入与语境提炼提示词**

加入 `article_title`、`article_content`、`quote` 输入，以及 `core_meaning`、`era`、`location`、`event`、`visual_elements`、`people` 等 JSON 输出字段。

- [ ] **Step 3: 替换背景主提示词和负向约束**

允许文章所需的人物与互动场景；禁止无关人物、冒充用户本人、复制头像、遮挡排版区域和生成文字。

- [ ] **Step 4: 运行测试**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: 金句卡新增断言 PASS，人物文档相关断言仍 FAIL。

### Task 3: 创建半身人物正式提示词

**Files:**
- Create: `docs/ai/persona-image-prompts.md`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: 写入身份一致性主提示词**

定义参考照片为唯一身份依据，保留脸型、五官、年龄、肤色、发型和发际线；允许改变服装、姿态、背景与光影。

- [ ] **Step 2: 写入三种风格与负向提示词**

加入 `warm_life`、`elegant_oriental`、`vintage_memory`，禁止换脸、年龄漂移、网红脸、强磨皮、错误肢体和文字标识。

- [ ] **Step 3: 写入模型参数与质量门槛**

加入身份参考权重 `0.80–0.90`、风格强度 `0.25–0.40`、低强度人脸修复，以及身份不合格不得进入“可设为头像”状态。

- [ ] **Step 4: 运行测试**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: 所有提示词契约测试 PASS。

### Task 4: 同步原型 PRD

**Files:**
- Modify: `prototype-v17.html`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: 更新金句卡 PRD**

把流程改为从文章和金句提炼背景语境；需求写明背景可以包含文章相关人物，但不得冒充用户本人或遮挡排版。

- [ ] **Step 2: 更新人物形象 PRD**

把“保持同一人、年龄和五官”加入 requirements 与 acceptance，并保留用户主动确认后才可设为头像。

- [ ] **Step 3: 运行完整回归测试**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: 全部 PASS。

- [ ] **Step 4: 检查变更格式**

Run: `git diff --check`  
Expected: 无输出，退出码为 0。

### Task 5: 提交与推送

**Files:**
- Add: `docs/codex/plans/2026-07-24-ai-image-prompts.md`
- Add: `docs/ai/persona-image-prompts.md`
- Modify: `docs/ai/quote-card-background-prompts.md`
- Modify: `prototype-v17.html`
- Modify: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: 检查提交范围**

Run: `git status --short`  
Expected: 只包含上述计划、提示词、原型和测试文件。

- [ ] **Step 2: 提交**

```bash
git add docs/codex/plans/2026-07-24-ai-image-prompts.md docs/ai/persona-image-prompts.md docs/ai/quote-card-background-prompts.md prototype-v17.html tests/avatar-quote-loop.test.mjs
git commit -m "docs: add contextual image generation prompts"
```

- [ ] **Step 3: 推送**

Run: `git push origin main`  
Expected: 远程 `main` 更新到本次提交。
