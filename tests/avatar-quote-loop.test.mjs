import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../prototype-v17.html', import.meta.url), 'utf8');
const prompts = await readFile(new URL('../docs/ai/quote-card-background-prompts.md', import.meta.url), 'utf8');
const personaPrompts = await readFile(new URL('../docs/ai/persona-image-prompts.md', import.meta.url), 'utf8');

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

test('background prompt uses article context and reserves card layout', () => {
  assert.match(prompts, /article_content/);
  assert.match(prompts, /core_meaning/);
  assert.match(prompts, /visual_elements/);
  assert.match(prompts, /根据文章语境决定是否出现人物/);
  assert.match(prompts, /不得声称或暗示为用户本人的真实影像/);
  assert.match(prompts, /左下头像区域/);
  assert.match(prompts, /右下二维码区域/);
  assert.match(prompts, /不把完整文章直接发送给图片模型/);
  assert.match(html, /背景必须结合金句内容与所在文章语境/);
  assert.match(html, /文章相关人物可以出现在背景中/);
  assert.match(prompts, /金句内容不设字数上限/);
  assert.match(html, /金句','可编辑文本，用于金句卡和分享','不限制字数；可为空/);
  assert.match(html, /不限制字数，卡片自动换行适配/);
  assert.doesNotMatch(html, /金句[^\n]{0,80}(?:0-40|1-40) 字/);
});

test('persona prompt locks identity while allowing controlled styling', () => {
  assert.match(personaPrompts, /唯一人物身份依据/);
  assert.match(personaPrompts, /脸型、五官结构与比例/);
  assert.match(personaPrompts, /不要把人物年轻化/);
  assert.match(personaPrompts, /0\.80–0\.90/);
  assert.match(personaPrompts, /不得进入“可设为头像”状态/);
  assert.match(html, /原始照片是唯一身份依据/);
  assert.match(html, /生成结果与参考照片为同一人/);
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
  assert.match(html, /上传照片[\s\S]*选择风格[\s\S]*完成/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /personaRender\('source'\)/);
  assert.match(html, /分享人物形象/);
  assert.match(html, /personaSetAvatar/);
  assert.match(html, /更换半身照/);
  assert.match(html, /function personaReset\(\)/);
  assert.doesNotMatch(html, /再做一张/);
  assert.doesNotMatch(html, /人物形象是可选功能，不影响记录和分享/);
  assert.doesNotMatch(html, /personaRestoreAvatar|恢复原头像/);
  assert.match(html, /id="personaposter"/);
  assert.match(html, /把一生，<br>讲成一本书/);
  assert.match(html, /扫码，也为父母留下一本/);
});
