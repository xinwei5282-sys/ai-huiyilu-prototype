# Life Story Plan Tiers Implementation Plan

> **For Codex execution:** This plan may be executed inline in the current session or step-by-step with explicit checkpoints. Keep checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the prototype package page to show the confirmed 15-question, 100-question, and full-question life story tiers.

**Architecture:** Keep the existing single-file prototype structure. Change only the package-facing screen, related account tile text, PRD metadata, and field table copy; do not alter the elder interview flow.

**Tech Stack:** Static HTML/CSS/JavaScript in `prototype-v17.html`, verified through local render or static inspection when renderer is unavailable.

---

### File Structure

- Modify: `prototype-v17.html`
  - Package screen markup for the three tiers.
  - "My" page package summary.
  - PRD metadata, package question rules, and field definitions for `plans`.
- Create: `docs/codex/plans/2026-07-24-life-story-plan-tiers.md`
  - Lightweight implementation plan for this approved prototype change.

### Task 1: Update Package-Facing Copy

- [x] Replace old package names and counts with:
  - `人生初卷`: 15 selected questions.
  - `人生长卷`: 100 curated interview questions.
  - `家族典藏`: current full 303-question interview bank.
- [x] Add copy that explains questions are scheduled by AI in the background and skipped when not applicable.
- [x] Keep question counts visible only on the package page and account package summary.

### Task 2: Update PRD And Field Metadata

- [x] Update `plans` PRD goal and requirements to describe nested tiers and low-pressure scheduling.
- [x] Replace `剩余题量` with `题库调度` or `成书深度`.
- [x] Add `packageTiers` to `plans` PRD so the right panel lists package question rules:
  - `人生初卷 · 15 题`: fixed question IDs `1, 3, 5, 13, 16, 32, 36, 47, 63, 78, 111, 145, 173, 236, 288`.
  - `人生长卷 · 100 题`: chapter quota logic across family, childhood, schooling, career, marriage, children, hardship, era/relationships, values/later life, and legacy/sensory memory.
  - `家族典藏 · 303 题`: full current interview bank with AI applicability checks and sensitive-question handling.
- [x] Add PRD renderer support for the `套餐题目内置规则` block.
- [x] Update metrics and events only if needed; no new interaction event is required for this prototype-only copy change.

### Task 3: Verify

- [x] Search the prototype for old package counts such as `200 问`, `80`, and `500 问`.
- [x] Render or inspect the `plans` screen to confirm the new text appears and the screen remains readable.
- [x] Confirm no interview-flow text introduces a question denominator.
