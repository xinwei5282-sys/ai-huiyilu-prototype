const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { launchBrowser, closeBrowser } = require('../../../ai-huiyilu-prototype-v19/render-browser.js');

const ROOT = path.resolve(__dirname, '../..');
const V17 = path.join(ROOT, 'prototype-v17.html');
const URL = 'http://127.0.0.1:8881/prototype-v21.html';
const OUT = path.join(__dirname, 'artifacts', 'parity');
fs.mkdirSync(OUT, { recursive: true });

function extract(html, re) { return [...html.matchAll(re)].map(m => m[1]); }
const source = fs.readFileSync(V17, 'utf8');
const phoneStart = source.indexOf('<div class="phone"><div class="screens">');
const scriptStart = source.indexOf('<script', phoneStart);
const bodyMap = source.slice(phoneStart, scriptStart > phoneStart ? scriptStart : source.length);
const scriptBodies = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const screens = extract(source, /<section\b[^>]*\bclass="[^"]*\bscreen\b[^>]*\bid="([^"]+)"/g);
const onclick = extract(source, /onclick="([^"]+)"/g);
const defined = new Set(extract(scriptBodies, /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g));
const handlers = [...new Set(onclick.flatMap(x => [...x.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]))) ].filter(x => defined.has(x));
const sourceIds = extract(bodyMap, /\bid="([A-Za-z][\w-]*)"/g);

(async () => {
  let browser;
  const checks = [];
  const errors = [];
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const ok = (value, message) => { assert.ok(value, message); checks.push(message); };
    const runtimeIds = () => page.$$eval('#memoir-runtime [id]', els => els.map(e => e.id));
    const open = async id => {
      await page.evaluate(id => {
        if (window.Memoir && typeof window.Memoir.open === 'function') window.Memoir.open(id);
        else if (typeof window.go === 'function') window.go(id);
        else location.hash = '#m/' + id;
      }, id);
      await new Promise(resolve => setTimeout(resolve, 30));
    };
    const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.querySelector('#memoir-runtime').scrollWidth <= document.querySelector('#memoir-runtime').clientWidth);
    const click = async selector => { await page.waitForSelector(selector); await page.click(selector); };
    const shot = async name => { await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true }); ok(await noOverflow(), name + ' 无横向溢出'); };

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(URL, { waitUntil: 'networkidle0' });
    ok(await page.$('#app'), 'V21 主应用容器存在');
    ok(await page.$('#memoir-runtime'), '原 V17 runtime 容器存在');
    const ids = await runtimeIds();
    ok(screens.length === 31, '原 V17 提取到 31 个 screen');
    ok(screens.every(id => ids.includes(id)), 'runtime 包含全部 31 个原 screen');
    ok(sourceIds.every(id => ids.includes(id)), 'runtime 保留原用户功能 id');
    const missingHandlers = await page.evaluate(names => names.filter(n => typeof window[n] !== 'function'), handlers);
    ok(missingHandlers.length === 0, '全部原 onclick 函数名可调用');
    for (const id of screens) { await open(id); ok(await page.$eval('#memoir-runtime .screen.on', e => e && e.id), '显式打开 ' + id + ' 激活页面'); ok(await page.$eval('#memoir-runtime .screen.on', (e, target) => e.id === target, id), id + ' 激活 id 正确'); ok(await noOverflow(), id + ' 容器无溢出'); }

    await open('session');
    ok(await page.$('#ivRecToggle, #session [onclick*="ivToggleRec"]'), 'session 录音/暂停入口存在');
    await page.evaluate(() => { ivListen(); ivToggleRec(); });
    ok(await page.$('#ivListenPane.rec-paused') || await page.evaluate(() => window.ivRecPaused === true), 'session 暂停状态可触达');
    ok(await page.$('#ivLiveTxt, #session textarea, #session input'), 'session 文字输入入口存在');
    await page.evaluate(() => { ivWrite(); const t = document.getElementById('ivLiveTxt'); t.textContent = '测试未保存内容'; window._ivHasUnsavedRec = true; ivOpenChapterSwitch(); });
    ok(await page.$('#topicSaveModal.open'), '换题/保存分支可触达');
    await page.evaluate(()=>topicSwitchSave());
    ok(await page.evaluate(()=>!document.getElementById('topicSaveModal').classList.contains('open')), '换题保存后关闭弹层');
    await open('summary');
    ok(await page.$('#sumMedia'), 'summary 媒体区存在');
    await page.evaluate(() => typeof sumMediaAdd === 'function' && sumMediaAdd());
    ok((await page.$$('#sumMedia .sum2-fig')).length > 0, 'summary 可添加媒体');
    for (const id of ['story','chapter','chapterread','invite','review','persona','plans','printbook','setup']) { await open(id); ok(await noOverflow(), id + ' 抽样状态无溢出'); }

    await new Promise(resolve=>setTimeout(resolve,2500));
    for (const [w, name] of [[360, '360'], [390, '390']]) { await page.setViewport({ width: w, height: 844, deviceScaleFactor: 1 }); await open('session'); await shot('session-' + name); await open('summary'); await shot('summary-' + name); await open('mine'); await shot('mine-' + name); await open('persona'); await shot('persona-' + name); await open('printbook'); await shot('printbook-' + name); }
    ok(errors.length === 0, '无 pageerror');
    fs.writeFileSync(path.join(OUT, 'parity-report.json'), JSON.stringify({ pass: true, checks, errors, screens, handlers }, null, 2));
    console.log(JSON.stringify({ pass: true, checks: checks.length, artifacts: OUT }, null, 2));
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { await closeBrowser(browser); }
})();
