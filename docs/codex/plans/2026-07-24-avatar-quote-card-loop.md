# Avatar and AI Quote Card Loop Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional first-use avatar that synchronizes to profile surfaces and an AI-background quote-card experience with deterministic prototype states and a reusable prompt contract.

**Architecture:** Keep the feature inside the existing single-file prototype while separating behavior into small JavaScript responsibilities: avatar persistence/synchronization and quote-background state simulation. Use browser-side canvas compression plus `localStorage` for prototype-only avatar persistence, and CSS background variants for deterministic AI-result mock states. Validate the HTML contract with Node's built-in test runner and visually verify rendered mobile states.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Canvas API, `localStorage`, Node.js `node:test`, existing Puppeteer renderer.

---

## File responsibility map

**Create**

- `tests/avatar-quote-loop.test.mjs` — static contract tests for required UI hooks, avatar functions, quote-background states, and prompt documentation.
- `docs/ai/quote-card-background-prompts.md` — production-facing prompt contract, style variables, negative constraints, payload and output rules.
- `docs/codex/plans/2026-07-24-avatar-quote-card-loop.md` — executable plan and progress checklist.

**Modify**

- `prototype-v17.html` — avatar picker UI, shared avatar views, local prototype state, quote-card avatar layout, AI-background mock states, PRD-panel requirements.

**Verification artifacts only**

- `/private/tmp/huiyilu-avatar-quote-*` — rendered screenshots; never committed.

---

### Task 1: Add contract tests and prompt source

**Files:**
- Create: `tests/avatar-quote-loop.test.mjs`
- Create: `docs/ai/quote-card-background-prompts.md`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: Write the failing HTML contract test**

Use `node:test` and `node:fs` to load `prototype-v17.html`, then assert the future contract:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../prototype-v17.html', import.meta.url), 'utf8');

test('avatar loop exposes shared hooks', () => {
  for (const hook of ['setupAvatarInput', 'mineAvatar', 'profileAvatar', 'quoteAvatar']) {
    assert.match(html, new RegExp(`id=["']${hook}["']`));
  }
  for (const fn of ['AvatarStore', 'avatarPick', 'avatarRemove', 'syncAvatarViews']) {
    assert.match(html, new RegExp(fn));
  }
});

test('quote card exposes AI background states', () => {
  for (const state of ['generating', 'ready', 'failed']) assert.match(html, new RegExp(state));
  assert.match(html, /quoteBackgroundRegenerate/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: FAIL because the avatar hooks and quote-background functions do not exist yet.

- [ ] **Step 3: Write the prompt contract document**

Create `docs/ai/quote-card-background-prompts.md` with:

- exact JSON input schema;
- fixed prompt template;
- `warm_study`, `vintage_film`, `ink_memory` style clauses;
- negative prompt excluding people, faces, text, logos and QR codes;
- privacy rule excluding avatar, name, phone and full transcript;
- 3:4, 768×1024 preview and 1080×1440 final output requirements.

- [ ] **Step 4: Extend the contract test to verify the prompt document**

```js
const prompt = readFileSync(new URL('../docs/ai/quote-card-background-prompts.md', import.meta.url), 'utf8');
for (const token of ['warm_study', 'vintage_film', 'ink_memory', '不生成人物', '1080 × 1440']) {
  assert.match(prompt, new RegExp(token));
}
```

- [ ] **Step 5: Run the test and confirm only HTML assertions fail**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: prompt-contract test PASS; HTML contract tests FAIL.

---

### Task 2: Implement the optional avatar loop

**Files:**
- Modify: `prototype-v17.html`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: Add shared avatar CSS**

Add reusable classes for picker, preview and shared avatar surfaces:

```css
.avatar-media{overflow:hidden;background:linear-gradient(145deg,#efb58e,#d96d47);display:grid;place-items:center}
.avatar-media img{width:100%;height:100%;object-fit:cover;object-position:center;display:none}
.avatar-media.has-image img{display:block}
.avatar-media.has-image .avatar-fallback{display:none}
.setup-avatar{display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:center}
```

Keep visible action targets at least 60px high and preserve the current warm paper palette.

- [ ] **Step 2: Add the setup avatar picker**

Insert after “这本书写谁？”:

```html
<div class="setup-field setup-avatar-field">
  <div class="setup-label">放一张您的照片 <span>选填</span></div>
  <div class="setup-avatar">
    <button class="avatar-media" type="button" onclick="avatarPick('setupAvatarInput')">...</button>
    <div><b>以后做故事卡时会用到</b><span>只做轻度裁切，不交给 AI 重绘。</span></div>
  </div>
  <input id="setupAvatarInput" type="file" accept="image/*" hidden onchange="avatarPicked(this)">
</div>
```

Provide `换一张` and `暂时不放` actions without blocking the existing main CTA.

- [ ] **Step 3: Replace fixed initials with shared avatar hooks**

Add `id="mineAvatar"`, `id="profileAvatar"`, and `id="quoteAvatar"` to their respective surfaces. Each surface contains an `<img>` plus `.avatar-fallback` with the current “兰” fallback.

- [ ] **Step 4: Implement prototype persistence and synchronization**

Add these responsibilities:

```js
const AvatarStore = {
  key: 'huiyilu.avatar.v1',
  get(){ try{return localStorage.getItem(this.key)||''}catch(_){return ''} },
  set(value){ try{localStorage.setItem(this.key,value)}catch(_){throw new Error('avatar_storage_failed')} },
  clear(){ try{localStorage.removeItem(this.key)}catch(_){} }
};

function avatarPick(inputId){ document.getElementById(inputId||'setupAvatarInput')?.click(); }
function avatarRemove(){ AvatarStore.clear(); syncAvatarViews(); }
function syncAvatarViews(){ /* update setup, mine, profile and quote card surfaces */ }
```

`avatarPicked(input)` reads the file, validates `image/*`, draws a center-cropped 512×512 JPEG at quality `0.82`, stores the Data URL, synchronizes all views, clears the input and shows a success toast. Storage or decode failure keeps the fallback and shows a recoverable message.

- [ ] **Step 5: Initialize and clean up state**

Call `syncAvatarViews()` after DOM setup. Add a profile-row remove/change interaction and ensure removal immediately updates all avatar surfaces.

- [ ] **Step 6: Run the contract tests**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: avatar hook/function assertions PASS; quote-background assertions may still FAIL.

- [ ] **Step 7: Commit the avatar loop**

```bash
git add prototype-v17.html tests/avatar-quote-loop.test.mjs docs/ai/quote-card-background-prompts.md
git commit -m "feat: add optional avatar loop"
```

---

### Task 3: Add AI quote-card background states

**Files:**
- Modify: `prototype-v17.html`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: Restructure the quote card into deterministic layers**

Inside `.qcard`, add:

```html
<div class="qc-ai-bg" id="quoteAiBackground" aria-hidden="true"></div>
<div class="qc-scrim" aria-hidden="true"></div>
<div class="qc-content">...</div>
```

Keep all Chinese text, avatar, brand and QR code outside the background layer so AI artwork never controls typography or identity.

- [ ] **Step 2: Add three ready-state backgrounds**

Implement CSS variants:

- `.style-warm-study` — warm window light, wood and album shapes;
- `.style-vintage-film` — faded paper, grain and restrained vignette;
- `.style-ink-memory` — ink-wash gradients, tree silhouettes and generous blank space.

Each variant must keep the central quote region low-detail with a readable scrim.

- [ ] **Step 3: Add generation status and actions**

Add a status row below the card:

```html
<div class="qc-ai-status" id="quoteAiStatus">
  <span id="quoteAiStatusText">正在为这句话配一幅背景…</span>
  <button id="quoteAiAction" onclick="quoteBackgroundRegenerate()">换一张背景</button>
</div>
```

The status row is informative, not blocking; save and share stay available.

- [ ] **Step 4: Implement the state simulator**

```js
const QuoteBackgroundMock = { state:'idle', styleIndex:0, styles:['warm-study','vintage-film','ink-memory'] };

function quoteBackgroundSetState(state){
  QuoteBackgroundMock.state=state;
  // update card classes, status text and action label
}

function quoteBackgroundRegenerate(){
  quoteBackgroundSetState('generating');
  clearTimeout(window._quoteBgTimer);
  window._quoteBgTimer=setTimeout(()=>{
    QuoteBackgroundMock.styleIndex=(QuoteBackgroundMock.styleIndex+1)%QuoteBackgroundMock.styles.length;
    quoteBackgroundSetState('ready');
  },900);
}
```

Expose `quoteBackgroundDemo('generating'|'ready'|'failed')` for renderer-controlled screenshots. Failed state uses the current paper background and changes the action to `再试一次`.

- [ ] **Step 5: Update the quote-card PRD panel**

Add requirements covering original-avatar display, AI background only, no AI-generated text/person, non-blocking fallback, regenerate action and events:

- `quote_background_generation_started`
- `quote_background_generation_completed`
- `quote_background_generation_failed`
- `quote_background_regenerated`

- [ ] **Step 6: Run the full contract test**

Run: `node --test tests/avatar-quote-loop.test.mjs`  
Expected: all tests PASS.

- [ ] **Step 7: Commit the quote-background experience**

```bash
git add prototype-v17.html tests/avatar-quote-loop.test.mjs
git commit -m "feat: add AI quote card background states"
```

---

### Task 4: Render and visually verify all critical states

**Files:**
- Modify if defects are found: `prototype-v17.html`
- Test: `tests/avatar-quote-loop.test.mjs`

- [ ] **Step 1: Run static checks**

Run:

```bash
node --test tests/avatar-quote-loop.test.mjs
git diff --check
```

Expected: tests PASS; no whitespace errors.

- [ ] **Step 2: Render the standard screen set**

Run:

```bash
node /Users/xinwei/weiran-env/projects/ai-huiyilu-prototype-uifix/render.js \
  /Users/xinwei/weiran-env/projects/ai-huiyilu-prototype/prototype-v17.html \
  /private/tmp/huiyilu-avatar-quote-standard
```

Expected screenshots include `setup.png`, `mine.png`, `profile.png`, `quotecard.png`, and `shelf.png`.

- [ ] **Step 3: Render controlled avatar and background states**

Use the existing render helper or a temporary Puppeteer script to inject a local sample avatar and call:

```js
syncAvatarViews();
quoteBackgroundDemo('generating');
quoteBackgroundDemo('ready');
quoteBackgroundDemo('failed');
```

Capture setup with avatar, mine with avatar, profile with avatar, and quote card in the three AI states.

- [ ] **Step 4: Inspect screenshots visually**

Verify:

- avatar remains centered and undistorted;
- setup CTA does not cover the avatar or final fields;
- mine/profile/quote card use the same avatar;
- quote stays readable over all backgrounds;
- generation and failure copy is clear;
- shelf layout is unchanged.

- [ ] **Step 5: Fix visual defects and rerender affected screens**

For every defect, patch only the affected CSS/HTML/JS, rerun tests, rerender and inspect again. Completion requires a clean second inspection.

- [ ] **Step 6: Final verification commit**

```bash
git add prototype-v17.html tests/avatar-quote-loop.test.mjs docs/ai/quote-card-background-prompts.md
git commit -m "fix: polish avatar quote card loop"
```

If no post-render code changes are necessary, skip the empty commit and report the two feature commits as final evidence.
