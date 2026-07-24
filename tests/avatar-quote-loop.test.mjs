import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../prototype-v17.html', import.meta.url), 'utf8');
const prompts = await readFile(new URL('../docs/ai/quote-card-background-prompts.md', import.meta.url), 'utf8');

test('first-time setup skips avatar while profile avatar remains editable', () => {
  assert.doesNotMatch(html, /id="setupAvatarInput"/);
  assert.match(html, /id="profileAvatarInput"/);
  assert.match(html, /id="avatarCropper"/);
  assert.match(html, /确认使用/);
  assert.match(html, /huiyilu\.avatar\.v1/);
  assert.match(html, /data-avatar-view/);
  assert.match(html, /id="avatarCropImage"/);
  assert.match(html, /<button class="setup-cta secondary"[^>]*>跳过<\/button>/);
});

test('quote card exposes non-blocking AI background states and styles', () => {
  assert.match(html, /quoteBackgroundDemo/);
  assert.match(html, /data-quote-bg="warm-study"/);
  assert.match(html, /data-quote-bg="vintage-film"/);
  assert.match(html, /data-quote-bg="ink-memory"/);
  assert.match(html, /quoteBackgroundRender\('generating'/);
  assert.match(html, /生成失败，已保留当前背景/);
});

test('background prompt protects identity and reserves card layout', () => {
  assert.match(prompts, /不生成人物、面孔、手、身体/);
  assert.match(prompts, /左下头像区域/);
  assert.match(prompts, /右下二维码区域/);
  assert.match(prompts, /不发送头像、姓名、手机号或完整访谈原文/);
});

test('chapter share opens mini program sharing without landing navigation', () => {
  assert.match(html, />分享章节<\/button>/);
  assert.match(html, /已打开小程序分享，可发送当前章节/);
  assert.doesNotMatch(html, /data-go="landing"[^>]*>[\s\S]{0,300}分享章节/);
});

test('AI persona is optional, half-body, shareable, and can become avatar', () => {
  assert.doesNotMatch(html, /id="setupAvatarInput"/);
  assert.match(html, /id="persona"/);
  assert.match(html, /制作我的形象/);
  assert.match(html, /先上传一张清晰半身照/);
  assert.match(html, /无需裁剪/);
  assert.match(html, /personaRender\('source'\)/);
  assert.match(html, /分享人物形象/);
  assert.match(html, /personaSetAvatar/);
  assert.match(html, /更换半身照/);
  assert.match(html, /function personaReset\(\)/);
  assert.doesNotMatch(html, /personaRestoreAvatar|恢复原头像/);
  assert.match(html, /id="personaposter"/);
  assert.match(html, /把一生，<br>讲成一本书/);
  assert.match(html, /扫码，也为父母留下一本/);
});
