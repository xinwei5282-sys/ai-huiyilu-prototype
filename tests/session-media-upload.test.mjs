import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../prototype-v17.html', import.meta.url), 'utf8');

test('recording page always exposes a photo and video picker', () => {
  assert.match(
    html,
    /class="iv-foot iv2-foot"[\s\S]*class="[^"]*iv2-media-add[^"]*"[\s\S]*照片\/视频[\s\S]*id="ivMediaPick"[^>]*accept="image\/\*,video\/\*"[^>]*multiple[^>]*onchange="ivMediaPicked\(this\)"[\s\S]*class="iv-recctrl"/,
  );
  assert.match(html, /class="[^"]*iv2-media-add[^"]*"[^>]*onclick="ivOpenMediaPicker\(\)"/);
  assert.match(html, /function ivOpenMediaPicker\(\)[\s\S]*getElementById\('ivMediaPick'\)[\s\S]*\.click\(\)/);
});

test('uploaded media thumbnails switch the main preview when clicked', () => {
  assert.match(html, /tile\.onclick=function\(\)\{ivSelectMedia\(index\);\}/);
  assert.match(html, /function ivSelectMedia\(index\)/);
  assert.match(html, /classList\.toggle\('selected',tileIndex===index\)/);
});

test('main media preview keeps a fixed frame while switching aspect ratios', () => {
  assert.match(html, /#ivListenPane\.has-media \.iv2-photo-preview\{height:126px\}/);
  assert.doesNotMatch(html, /iv2-photo-preview\.portrait\{height:/);
});
