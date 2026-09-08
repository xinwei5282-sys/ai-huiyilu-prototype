/* V20 additive integration. The online-final V17 source and its flows stay intact. */
(() => {
  'use strict';
  const KEY = 'yunyi.praise.v20';
  const PERSON = 'prototype-current-person';
  const SAMPLE = 'v20/assets/travel.jpg';
  const empty = () => ({ records: [], memories: [], allowMemory: false });
  let state;
  try {
    state = JSON.parse(localStorage.getItem(KEY) || 'null') || empty();
    if (!Array.isArray(state.records) || !Array.isArray(state.memories)) state = empty();
  } catch { state = empty(); }
  let draft = { photo: '', text: '', example: false };
  let result = null, busy = false, uploading = false, issue = '', generation = 0, selectedId = null;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const day = () => new Date().toLocaleDateString('sv-SE');
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const shapes = {
    spark:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/>',
    photo:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
    mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
    book:'<path d="M5 5a2 2 0 0 1 2-2h12v18H7a2 2 0 0 1-2-2Zm0 12h14"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/>',
    heart:'<path d="M12 21S2 14 2 8c0-6 8-7 10-1 2-6 10-5 10 1 0 6-10 13-10 13Z"/>',
    down:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
    back:'<path d="m15 5-7 7 7 7"/>',
  };
  const icon = name => `<svg class="kk-icon" viewBox="0 0 24 24" aria-hidden="true">${shapes[name] || shapes.spark}</svg>`;
  const tabs = [['praise','spark','夸一夸'],['session','mic','讲述'],['shelf','book','书房'],['mine','user','我的']];
  const nav = active => `<nav class="tabbar kk-tabs" aria-label="主导航">${tabs.map(([id,i,label]) => `<button type="button" class="t ${id === active ? 'on' : ''}" data-go="${id}" ${id === active ? 'aria-current="page"' : ''}>${icon(i)}<span>${label}</span></button>`).join('')}</nav>`;
  const status = '<div class="sbar"><span>9:41</span><span class="bat"></span></div><div class="wxcap">··· ◉</div>';
  const header = (title, back, action = '') => `<header class="kk-nav">${back ? `<button data-go="${back}" aria-label="返回">${icon('back')}</button>` : '<span class="kk-wordmark">云忆</span>'}<strong>${title}</strong>${action || '<span class="kk-spacer"></span>'}</header>`;
  const notify = message => { if (typeof window.toast === 'function') window.toast(message); };
  function persist(next) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); state = next; return true; }
    catch { notify('本机空间不足，内容还在当前页，请先保存图片'); return false; }
  }
  function renderInput() {
    const root = $('praise');
    if (busy) {
      root.innerHTML = `${status}${header('夸一夸',null)}<div class="body kk-body kk-loading"><div class="kk-bloom">${icon('spark')}</div><h2>一份好话，正在路上</h2><p>每一个认真生活的瞬间，都值得被看见。</p><p class="kk-demo">原型正在准备演示结果</p><button class="kk-text-button" id="kk-cancel">取消，继续编辑</button></div>${nav('praise')}`;
      $('kk-cancel').onclick = () => { generation++; busy = false; renderInput(); };
      return;
    }
    root.innerHTML = `${status}${header('夸一夸',null,'<button class="kk-text-button" data-go="praise-history">记录</button>')}
      <div class="body kk-body">
        <div class="kk-intro"><span class="kk-eyebrow">看见生活里的小美好</span><h1>这一刻，<br>值得被好好夸一夸。</h1><p>发张照片，说说心情。收下一份专属鼓励。</p><span class="kk-doodle" aria-hidden="true">✳</span></div>
        <label for="kk-photo" class="kk-upload ${draft.photo ? 'has-photo' : ''}" tabindex="0" role="button" aria-label="${draft.photo ? '更换照片' : '选择照片'}">${draft.photo ? `<img src="${escape(draft.photo)}" alt="这次夸夸的照片"><span class="kk-change">${icon('photo')} 换张照片</span>` : `${icon('photo')}<strong>放一张照片</strong><span>今天的自己、做好的作品、路上的风景</span>`}</label>
        <input id="kk-photo" type="file" accept="image/jpeg,image/png,image/webp" hidden>
        <div class="kk-upload-meta"><span>JPG / PNG / WebP · 8MB 内</span><button id="kk-example" class="kk-text-button" ${uploading ? 'disabled' : ''}>用示例试试 ↗</button></div>
        <label class="kk-field-label" for="kk-text">再说一句<span id="kk-count">${draft.text.length}/300</span></label>
        <textarea id="kk-text" maxlength="300" placeholder="比如：终于给自己放了个假，今天只想慢慢走。">${escape(draft.text)}</textarea>
        <details class="kk-context"><summary>${icon('shield')} 让夸夸更懂我 <span>可选</span></summary><label class="kk-check"><input type="checkbox" id="kk-use-memory" ${state.allowMemory ? 'checked' : ''}><span>参考我已授权的原始记录<small>仅使用属于你的讲述和配文，不使用家人的资料。不开启也能正常夸夸。</small></span></label><a class="kk-text-button" href="#praise-history">查看与管理授权记录 ›</a></details>
        ${issue ? `<p class="kk-error" role="alert">${escape(issue)}</p>` : ''}
        <p class="kk-demo">交互原型 · 图片仅在本机使用，生成文案为演示</p>
      </div><div class="kk-footer"><button class="kk-primary" id="kk-generate" ${uploading ? 'disabled' : ''}>${icon('spark')} ${uploading ? '正在读取照片…' : '来，夸夸我'}</button></div>${nav('praise')}`;
    $('kk-text').oninput = e => { draft.text = e.target.value; draft.example = false; $('kk-count').textContent = `${draft.text.length}/300`; };
    $('kk-example').onclick = () => { draft = {photo:SAMPLE,text:'终于给自己放了个假，这次旅行不赶行程，只想在湖边慢慢走。',example:true}; issue = ''; renderInput(); };
    $('kk-photo').onchange = handlePhoto;
    root.querySelector('.kk-upload').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); $('kk-photo').click();} };
    $('kk-use-memory').onchange = e => { const checked = e.target.checked; if (!persist({...state,allowMemory:checked})) e.target.checked = !checked; };
    $('kk-generate').onclick = generate;
  }
  async function handlePhoto(e) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8*1024*1024) {
      issue = '请选择 8MB 以内的 JPG、PNG 或 WebP 照片。'; renderInput(); return;
    }
    uploading = true; issue = ''; renderInput();
    try {
      const url = await new Promise((resolve,reject) => { const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file); });
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement('canvas'), scale = Math.min(1,1000/img.width,1000/img.height);
      canvas.width = Math.max(1,Math.round(img.width*scale)); canvas.height = Math.max(1,Math.round(img.height*scale));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      draft.photo = canvas.toDataURL('image/jpeg',.83); draft.example = false;
    } catch { issue = '这张照片暂时打不开，换一张试试。'; }
    uploading = false; renderInput();
  }
  function findMemory() {
    if (!state.allowMemory) return [];
    const terms=['旅行','槐花','名字','爷爷','做饭','散步','画画','运动'];
    return state.memories.filter(m => m.personId === PERSON && m.enabled && terms.some(t => draft.text.includes(t) && m.original.includes(t))).slice(-2);
  }
  function generate() {
    if (uploading) return;
    if (!draft.photo || !draft.text.trim()) { issue = '选一张照片，再写一句话，就可以开始了。'; renderInput(); return; }
    if (!navigator.onLine) { issue = '网络暂时不可用，照片和文字还在，恢复后再试。'; renderInput(); return; }
    busy = true; issue = ''; const token = ++generation; renderInput();
    setTimeout(() => {
      if (token !== generation || !busy) return;
      const refs = findMemory();
      result = { id:uid('praise'), photo:draft.photo, original:draft.text.trim(), date:day(), example:draft.example,
        title:draft.example ? '慢一点，也有自己的光。' : '你的这份用心，值得被看见。',
        text:draft.example ? '湖面、远山，还有不必赶路的心情。你给自己留出了一个慢慢走的下午，也给生活留了一点自在。愿意认真照顾自己的节奏，这件事本身，就很值得夸奖。' : `你写下「${draft.text.trim()}」，让这个瞬间有了自己的注解。愿意表达感受、珍惜生活里的小事，这份认真很动人。希望你也能看见，自己身上这份小小的光。`,
        references:refs.map(m => ({id:m.id,source:m.source,original:m.original})) };
      busy = false; selectedId = null; window.go('praise-result');
    },900);
  }
  const current = () => selectedId ? state.records.find(x => x.id === selectedId) : result;
  function renderResult() {
    const item = current(), root = $('praise-result');
    if (!item) { root.innerHTML = `${status}${header('属于你的夸夸','praise')}<div class="body kk-body kk-empty">${icon('spark')}<h2>先留下一份小美好</h2><p>选张照片，写一句话，就可以开始。</p><button class="kk-primary" data-go="praise">去夸一夸</button></div>${nav('praise')}`; return; }
    const saved = state.records.some(x => x.id === item.id);
    root.innerHTML = `${status}${header('属于你的夸夸',selectedId ? 'praise-history' : 'praise')}
      <div class="body kk-body"><article class="kk-card"><img src="${escape(item.photo)}" alt="这次夸夸的照片"><div class="kk-card-copy"><div class="kk-card-label"><span>云忆 · 夸一夸</span><span>${escape(item.date)}</span></div><h1>${escape(item.title)}</h1><p>${escape(item.text)}</p><span class="kk-card-sign">每一份认真，都有回响。 ✳</span></div></article>
      ${item.references.length ? `<details class="kk-context"><summary>${icon('shield')} 参考了 ${item.references.length} 条已授权原文</summary>${item.references.map(r=>`<blockquote><b>${escape(r.source)}</b>${escape(r.original)}</blockquote>`).join('')}</details>` : '<p class="kk-source">仅根据本次照片与配文场景展示，未引用其他记录</p>'}
      <p class="kk-demo">${item.example ? '示例照片与演示文案 · 未接入真实 AI' : '演示文案 · 尚未识别你上传的实际照片'}</p>
      ${saved ? '<p class="kk-saved-note">已收进「我的 → 夸夸记录」，随时回来看看。</p>' : '<label class="kk-check kk-result-consent"><input type="checkbox" id="kk-share-original"><span>允许这次配文用于今后的夸夸<small>只保留你写的原文，夸赞不会作为人物事实。</small></span></label>'}
      <button class="kk-text-button kk-again" id="kk-new">再夸一次 ↗</button></div>
      <div class="kk-footer kk-result-actions"><button class="kk-primary" id="kk-save" ${saved ? 'disabled' : ''}>${icon('heart')} ${saved ? '已收藏' : '收藏夸夸'}</button><button class="kk-secondary" id="kk-download">${icon('down')} 保存图片</button></div>${nav('praise')}`;
    $('kk-save').onclick = () => {
      if (state.records.some(x => x.id === item.id)) return;
      let memories = state.memories;
      if ($('kk-share-original')?.checked) memories = [...memories,{id:uid('memory'),personId:PERSON,source:'夸一夸',original:item.original,enabled:true}];
      if (!persist({...state,records:[item,...state.records],memories})) return;
      notify('已收藏到夸夸记录'); renderResult(); updateHistoryCount();
    };
    $('kk-download').onclick = () => downloadCard(item);
    $('kk-new').onclick = () => { selectedId = null; window.go('praise'); };
  }
  function renderHistory() {
    $('praise-history').innerHTML = `${status}${header('夸夸记录','mine','<button class="kk-text-button" data-go="praise">去夸夸</button>')}
      <div class="body kk-body"><div class="kk-history-heading"><span class="kk-eyebrow">给自己的好话，好好收着</span><h1>每一份，都是小小的光。</h1><p>夸夸单独收藏，故事仍在原来的书房。</p></div>
      <div id="kk-history-list">${state.records.length ? state.records.map(x => `<button class="kk-record" data-kk-record="${escape(x.id)}"><img src="${escape(x.photo)}" alt=""><span><small>${escape(x.date)} · ${x.example?'示例':'夸一夸'}</small><strong>${escape(x.title)}</strong><p>${escape(x.original.slice(0,45))}</p></span><i>›</i></button>`).join('') : `<div class="kk-empty">${icon('heart')}<h2>还没有收藏的夸夸</h2><p>收到喜欢的好话，点一下「收藏夸夸」。</p><button class="kk-primary" data-go="praise">收下第一份夸夸</button></div>`}</div>
      <details class="kk-context kk-memory-settings"><summary>${icon('shield')} 夸夸可以使用哪些记录</summary><p>共用已有资料与记忆，按原文授权。关闭授权不影响已保存的故事和夸夸。</p>${state.memories.filter(m => m.personId === PERSON).length ? state.memories.filter(m => m.personId === PERSON).map(m => `<label class="kk-check"><input type="checkbox" data-kk-memory="${escape(m.id)}" ${m.enabled?'checked':''}><span><b>${escape(m.source)} · 我的原文</b><small>${escape(m.original)}</small></span></label>`).join('') : '<p class="kk-no-memory">还没有授权记录。收藏夸夸或收录回忆预览时，可选择允许使用原文。</p>'}</details>
      <p class="kk-demo">本地原型记录 · 当前浏览器保存</p></div>${nav('mine')}`;
    $('praise-history').querySelectorAll('[data-kk-record]').forEach(button => button.onclick = () => { selectedId = button.dataset.kkRecord; window.go('praise-result'); });
    $('praise-history').querySelectorAll('[data-kk-memory]').forEach(input => input.onchange = () => {
      const value = input.checked;
      if (!persist({...state,memories:state.memories.map(m => m.id === input.dataset.kkMemory ? {...m,enabled:value} : m)})) input.checked = !value;
    });
  }
  function updateHistoryCount() {
    const el = $('kk-mine-count'); if (el) el.textContent = state.records.length ? `${state.records.length} 份好话，随时回看` : '收藏喜欢的好话，留给自己';
  }
  async function downloadCard(item) {
    try {
      const img = new Image(); img.src = item.photo; await img.decode();
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); canvas.width = 750;
      ctx.font = '28px sans-serif'; const lines=[];let line='';
      for (const char of item.text) { if(ctx.measureText(line+char).width>630){lines.push(line);line=char;}else line+=char; } if(line)lines.push(line);
      canvas.height = 695 + lines.length*45; ctx.fillStyle='#fff8ef';ctx.fillRect(0,0,750,canvas.height);
      const scale = Math.max(650/img.width,395/img.height); ctx.save();ctx.beginPath();ctx.rect(50,50,650,395);ctx.clip();ctx.drawImage(img,50+(650-img.width*scale)/2,50+(395-img.height*scale)/2,img.width*scale,img.height*scale);ctx.restore();
      ctx.fillStyle='#a83f27';ctx.font='22px sans-serif';ctx.fillText('云忆 · 夸一夸',55,490);ctx.fillStyle='#2a2019';ctx.font='bold 33px serif';ctx.fillText(item.title,55,552);
      ctx.font='28px sans-serif';lines.forEach((s,i)=>ctx.fillText(s,55,610+i*45));ctx.fillStyle='#7c6b5e';ctx.font='19px sans-serif';ctx.fillText('原型演示 · 看见生活里的小美好',55,canvas.height-35);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('No image');
      const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download='云忆-夸夸卡.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('图片已生成，可保存后分享');
    } catch { notify('图片暂时无法生成，请重试'); }
  }
  // Only append new screens. Existing memoir screen IDs and state functions remain unchanged.
  ['praise','praise-result','praise-history'].forEach(id => { const section=document.createElement('section');section.id=id;section.className='screen kk-screen';document.querySelector('.screens').append(section); });
  ['session','shelf','mine'].forEach(id => { const old=$(id).querySelector('.tabbar');if(old) old.outerHTML=nav(id); });
  const mineEntry=document.createElement('button');mineEntry.className='me3-task kk-mine-entry';mineEntry.dataset.go='praise-history';
  mineEntry.innerHTML=`<span class="ic">${icon('heart')}</span><span class="tx"><b>我的夸夸记录</b><span id="kk-mine-count"></span></span><span class="tag">去看看</span>`;
  $('mine').querySelector('.hub-lbl').before(mineEntry);updateHistoryCount();
  $('mine').querySelector('.me3-name > span').textContent='云忆 · 看见美好，珍藏故事';
  // One optional consent on the existing save-to-shelf path. No generated summary is ingested.
  const consent=document.createElement('label');consent.className='kk-check kk-memoir-consent';
  consent.innerHTML='<input type="checkbox" id="kk-memoir-consent"><span>允许这段原文用于个性化夸夸<small>可选，只共享本人讲述原文，收录故事的流程照常。</small></span>';
  $('summary').querySelector('.body .sum2').append(consent);
  document.addEventListener('click', e => {
    if (!e.target.closest('#summary [data-go="shelf"]') || !$('kk-memoir-consent').checked) return;
    const original=typeof window.ivSaidText==='function' ? window.ivSaidText().trim() : '';
    if (!original) { notify('没有可共享的讲述原文，本次只收录故事'); return; }
    if (!state.memories.some(m=>m.source==='回忆录' && m.original===original)) {
      persist({...state,memories:[...state.memories,{id:uid('memory'),personId:PERSON,source:'回忆录',original,enabled:true}]});
    }
    $('kk-memoir-consent').checked=false;
  },true);
  const map=document.querySelector('.map');map.querySelector('.mt').textContent='V20 · 最终版 + 夸一夸';
  const mapButtons=document.createElement('div');mapButtons.innerHTML='<button data-go="praise">【夸一夸】照片 + 一句话</button><button data-go="praise-history">· 我的夸夸记录</button><a class="kk-version-link" href="v20/versions.html">本版范围 / 最终版对照 ↗</a>';map.querySelector('.mt').after(mapButtons);
  const heading=document.querySelector('.head h1');if(heading)heading.textContent='云忆 · V20 最小接入版';
  if (window.PRD_CONTENT) {
    const common={stage:'首发增量 · 复用回忆录现有底座',problem:'新增面向全年龄的照片夸夸，不影响已完成的回忆录业务。',goal:'一张照片加一句话即可获得夸夸，并独立收藏、保存卡片。',users:['所有希望获得鼓励的用户；不要求先创建回忆录。'],inScope:['新增夸一夸、结果、记录3屏；统一4个底部入口。','回忆录31个原页面完整保留。','引用经本人授权的原始记录，AI输出不回灌为事实。'],deferred:['新的会员套餐、积分、广场和复杂记忆管理。'],requirements:['沿用现有账号、媒体、知识库与权限服务，不新建第二套知识库。','原型只做本地文案及关键词引用演示，未连接真实AI或后端。'],edgeCases:['照片与配文均必填；图片格式、大小、读取错误提示。','失败保留输入；存储失败不显示保存成功。'],acceptance:['保存夸夸不新增章节，不扣回忆录题量。','家人记录不用于本人夸夸；撤销授权后停止后续引用。']};
    window.PRD_CONTENT.praise={...common,title:'夸一夸 · 首发 PRD',flow:['直接进入夸一夸。','选照片并输入文字。','可选使用已授权原文。','生成并进入结果。']};
    window.PRD_CONTENT['praise-result']={...common,title:'夸夸结果 · 首发 PRD',flow:['查看照片与夸夸文案。','收藏或保存图片。','可选允许原始配文用于以后回应。']};
    window.PRD_CONTENT['praise-history']={...common,title:'夸夸记录 · 首发 PRD',flow:['我的 → 夸夸记录。','打开记录回看、保存图片。','逐条管理夸夸可用的原文授权。']};
  }
  const originalGo=window.go;
  window.go=function(id) {
    if (id!=='praise' && busy) { generation++;busy=false; }
    if (id==='praise') renderInput();
    if (id==='praise-result') renderResult();
    if (id==='praise-history') renderHistory();
    originalGo(id);
    if(id==='mine')updateHistoryCount();
  };
  renderInput();renderResult();renderHistory();
})();
