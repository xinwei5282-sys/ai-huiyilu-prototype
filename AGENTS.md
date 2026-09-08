# AI Huiyilu Prototype - Agent Rules

## V21 current branch scope (2026-09-08)

- Entry: `prototype-v21.html`; branch: `prototype/v21-product-architecture`.
- 文案和常规 UI 调整直接更新当前 V21，不另建原型版本；Git 保留修改历史。首页仅保留一句 slogan「每一刻，都值得被看见」，其余页面避免描述性文案堆叠。用户当前要求先调整原型，UI 生图后续继续。
- User requested an overall product architecture Demo before PRDs, then explicitly confirmed this is a mobile product. Always render mobile UI; desktop is only a centered phone preview. No PC sidebar or desktop adaptation.
- Shared navigation: 首页 / 珍藏 / 我的. Praise and memoir are separate intents in one home composer, with independent outcomes and opt-in shared original-source memory.
- Canonical V17 and prior V20 remain untouched. V21.1 contains all 31 canonical V17 screens, overlays and original business scripts in the same document. `v21/qa/build-runtime.py` generates the isolated runtime; adaptations live in `v21/memoir-bridge.js` and `v21/memoir-theme.css`. Preserve full prototype functionality; do not reduce it to a main-flow demo. Real AI, voice, payment and external sharing remain at V17 prototype scope.
- Scope and decisions: `v21/version.json`. Local preview port 8881. Verification: `node v21/qa/verify-parity.cjs` (31-screen/function preservation), `node v21/qa/verify.cjs` (joined product flows); renders use isolated headless-shell. Prior simplified V21 is recoverable at commit `8385f62`.
- PRD and external publication are deferred. Older scope statements below apply to their respective versions.

## V20 branch scope (2026-09-08)

- This branch implements `prototype-v20.html`: minimal independent praise integration on the user-confirmed online-final V17.
- Canonical baseline: `https://xinwei5282-sys.github.io/ai-huiyilu-prototype/prototype-v17.html`; SHA-256 `45b990dcf86031bfdb8c317f7783f6ba992461e00d7c7e75d116031e7ebfb651`.
- Keep `prototype-v17.html` unchanged. Its 31 screens and existing scripts are retained in V20; additive behavior/styles live in `v20/praise.js` and `v20/praise.css`.
- Praise has no age restriction. Existing memoir flows and agreed shelf rules remain in force. Do not substitute the V19 exploration or the older `ai-huiyilu-prototype-uifix` V17.
- Current plan and launch boundary: `v20/docs/PLAN.md`, `v20/docs/LAUNCH-SCOPE.md`; version metadata: `v20/version.json`.
- Focused acceptance: `node v20/qa/verify.cjs`; visuals: `node v20/qa/capture.cjs`, with the local HTTP server on port 8880. These scripts use the documented local headless-shell helper.

## Project scope

- This repo is a high-fidelity HTML prototype, not the formal miniapp codebase.
- Current main working file: `prototype-v17.html`.
- Do not assume the current shelf/study-room implementation is correct; it has gone through multiple unfinished iterations.

## Product direction

This product is for elderly users. The experience should feel:

- light
- warm
- low-pressure
- outcome-driven

Avoid:

- strong task pressure
- dashboard/tool feeling
- dense operational UI
- hard-to-read weak text

## Shelf page rules

The `书房` page is currently the most important constraint area.

Treat these as fixed product decisions:

1. `书房 = 成果展示区`
2. Only show completed成果 in `书房`
3. In-progress / unfinished / interrupted content must go to `我的`
4. Chapters are the primary visual unit
5. The full-book entry is secondary, not the hero
6. Remove redundant bottom memory/info blocks

Do not reintroduce:

- a heavy full-book hero card
- in-progress chapters in shelf
- unfinished-task entry points in shelf
- strong numeric task pressure like `0/45`

## Visual hierarchy for shelf

Preferred order:

1. keep the bookshelf/study background
2. a light explanatory strip if needed
3. chapter成果 shelf as the first visual focus
4. full-book preview as a light secondary entry

If a reference image conflicts with this boundary, follow the product boundary, not the image.

## Verification rule

Do not trust code inspection alone for shelf changes.

After editing shelf-related UI, rerender and verify visually.

Renderer:

```bash
node /Users/xinwei/weiran-env/projects/ai-huiyilu-prototype-uifix/render.js \
  /Users/xinwei/weiran-env/projects/ai-huiyilu-prototype/prototype-v17.html \
  /private/tmp/huiyilu-check
```

Main screenshot to inspect:

- `shelf.png`

## Extra context

Longer project handoff:

- `.claude/codex-handoff-ai-huiyilu.md`
