# AI Huiyilu Prototype - Agent Rules

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
