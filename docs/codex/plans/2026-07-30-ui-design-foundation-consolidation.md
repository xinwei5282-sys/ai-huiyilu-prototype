# Memoir UI Design Foundation Consolidation Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将回忆录原型现有 UI 规范整理为覆盖视觉 token、核心组件、页面模式、适老要求和验收规则的唯一设计真源。

**Architecture:** 继续由 `docs/UI设计规范.md` 承担视觉规范真源；以 `prototype-v17.html` 的 CSS 变量和有效组件样式作为当前实现证据，以 `AGENTS.md` 的产品边界过滤试验残留。`docs/开发交付设计稿.md` 只保留页面和交付职责，通过链接引用视觉规范，不复制整套规则。

**Tech Stack:** Markdown、HTML/CSS 静态审计、ripgrep、Git diff 检查

---

## 文件责任图

- Modify: `docs/UI设计规范.md` — 唯一视觉设计真源，承载原则、tokens、组件、页面模式、适老和验收规则。
- Modify if required: `docs/开发交付设计稿.md` — 仅修正与设计真源冲突的引用或重复规则。
- Reference only: `prototype-v17.html` — 对照当前 CSS tokens 和已实现组件，不在本轮修改。
- Reference only: `AGENTS.md` — 对照书房与适老产品边界，不在本轮修改。
- Reference only: `docs/superpowers/specs/2026-07-30-ui-design-foundation-consolidation-design.md` — 本计划覆盖的已批准方案。

### Task 1: 审计当前规范与原型 tokens

**Files:**
- Reference: `prototype-v17.html`
- Reference: `docs/UI设计规范.md`
- Reference: `AGENTS.md`

- [x] **Step 1: 提取原型根级 tokens**

Run: `sed -n '1,60p' prototype-v17.html`

Expected: 输出 `:root` 中的颜色、字号、字重、圆角、阴影、字体和资源变量。

- [x] **Step 2: 提取现有规范结构**

Run: `rg -n '^## |^### ' docs/UI设计规范.md`

Expected: 能确认当前规范偏重颜色，缺少完整排版、间距、阴影、动效、图像、核心组件和页面模式章节。

- [x] **Step 3: 记录明确差异**

Run: `rg -n -- '--text-3|--gold-btn1|--gold-btn2|--serif|--fs-|--r-|--sh-' prototype-v17.html docs/UI设计规范.md`

Expected: 找出规范与原型的具体值差异及仅存在于原型的 token。

### Task 2: 重整唯一 UI 设计规范

**Files:**
- Modify: `docs/UI设计规范.md`

- [x] **Step 1: 重组品牌原则与 token 章节**

将文档前半部分收敛为：品牌定位、设计原则、颜色、排版、间距、圆角、阴影、动效、安全区和资源变量。token 表必须包含当前原型值、语义和使用边界。

- [x] **Step 2: 增加图像、材质与图标语言**

明确暖光真实照片、纸页/书籍材质、图片遮罩、封面层级和图标识别规则，并列出禁止的科技感、宣传感和装饰性用法。

- [x] **Step 3: 增加核心组件规范**

为按钮、录音控件、顶部导航、底部导航、成果卡、章节书本、标签、提示、输入上传、底部弹层和空状态定义用途、尺寸、层级及关键状态。

- [x] **Step 4: 增加关键页面模式**

明确讲述页的一屏一焦点、书房的已完成章节优先、我的承接未完成事项、人物形象非阻断，以及分享结果必须回到故事内容。

- [x] **Step 5: 增加适老与状态完整性规则**

写明字号、热区、对比、键盘避让、安全区、颜色之外的状态表达，以及加载、空、错误、断网、成功、恢复六态要求。适老能力按已有功能定义为手动开启模式，只整理设计规范，不修改功能代码。

- [x] **Step 6: 增加禁用规则、实现差异和验收清单**

区分“规范要求”与“当前原型事实”；发现差异时记录但不修改原型。验收清单覆盖文档结构、token 对照、组件状态和真实渲染门禁。

### Task 3: 校正文档间职责并验证

**Files:**
- Modify if required: `docs/开发交付设计稿.md`
- Verify: `docs/UI设计规范.md`

- [x] **Step 1: 检查交付稿是否复制或冲突**

Run: `rg -n '颜色|字号|圆角|阴影|主按钮|UI设计规范' docs/开发交付设计稿.md`

Expected: 交付稿只保留必要摘要并明确引用 `docs/UI设计规范.md`；若无冲突则不修改。

- [x] **Step 2: 扫描占位和串项目内容**

Run: `rg -n 'TBD|TODO|KOC|生财绿|团队管理' docs/UI设计规范.md docs/开发交付设计稿.md`

Expected: 无匹配。

- [x] **Step 3: 检查规范结构覆盖**

Run: `rg -n '^## ' docs/UI设计规范.md`

Expected: 包含品牌原则、Design Tokens、排版布局、图像材质、核心组件、页面模式、状态适老、禁用与验收八类内容。

- [x] **Step 4: 检查差异格式**

Run: `git diff --check`

Expected: 命令退出码为 0，无空白错误。

- [x] **Step 5: 审阅最终 diff**

Run: `git diff -- docs/UI设计规范.md docs/开发交付设计稿.md`

Expected: 只出现本次 UI 规范整理相关变更，未修改原型和小程序文件。

- [x] **Step 6: 提交规范整理**

```bash
git add docs/UI设计规范.md docs/开发交付设计稿.md docs/codex/plans/2026-07-30-ui-design-foundation-consolidation.md
git commit -m "docs: consolidate memoir UI design foundation"
```
