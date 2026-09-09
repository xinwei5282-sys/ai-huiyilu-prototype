/* V17 functions stay intact. This adapter joins them to the V21 mobile product. */
(() => {
  const root=document.getElementById('memoir-runtime');
  const originalGo=window.go;
  const key='yunyi.architecture.v21';
  let lastRaw='',summaryRaw=null,editingId=null,active='',saving=false;
  const identityTemplates=new Map();
  const read=()=>window.Yunyi?.read()||JSON.parse(localStorage.getItem(key)||'null');
  const persist=next=>window.Yunyi?.save(next)||false;
  const ids=['family','childhood','school','service','marriage','children'];
  const text=(selector)=>root.querySelector(selector)?.textContent.trim()||'';
  const h=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=>Date.now()+'-'+Math.random().toString(36).slice(2,7);
  const date=()=>new Date().toLocaleDateString('sv-SE');
  // The application owns hash routing; V17's public screen functions still work.
  window.removeEventListener('hashchange',window.applyHash);
  window.applyHash=()=>{};
  root.querySelectorAll('.screen.on').forEach(x=>x.classList.remove('on'));
  function syncIdentity(){
    const db=read();if(!db)return;
    root.querySelector('.hm2-greet h1').textContent='';
    root.querySelectorAll('#mine .me3-name>b').forEach(e=>e.textContent=db.name);
    const lines=root.querySelectorAll('#profile .profile-line');
    [0,1].forEach(i=>{if(lines[i])lines[i].querySelector('span').textContent=db.name;});
    root.querySelectorAll('[data-avatar-view]').forEach(e=>{if(!AvatarStore.get())e.textContent=db.name.slice(-1);});
    const subject=db.subject||{relation:'self',name:db.name},name=subject.name||'家人';
    if(!identityTemplates.size){
      ['#invite','#landing','#collaborators','#contribute','#quotecard','#personaposter','#bookRead'].forEach(selector=>{
        const el=root.querySelector(selector);if(!el)return;
        const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node;
        while((node=walker.nextNode()))if(node.textContent.includes('兰秀英'))identityTemplates.set(node,node.textContent);
      });
    }
    identityTemplates.forEach((original,node)=>{if(node.isConnected)node.textContent=original.replaceAll('兰秀英',name);});
    const subjectInput=document.getElementById('memoir-subject-name');
    if(subjectInput&&document.activeElement!==subjectInput)subjectInput.value=subject.name||'';
    root.querySelectorAll('#setupStep1>.setup-field:first-child .setup-chip').forEach((el,i)=>el.classList.toggle('on',['self','parents','family'][i]===subject.relation));
    const badge=document.getElementById('memoir-subject-badge');if(badge)badge.textContent='正在记录：'+name;

  }
  function captureDraft(){
    const raw=text('#ivLiveTxt');
    if(!raw||!window._ivHasUnsavedRec)return true;
    const db=read();if(!db)return true;
    return persist({...db,draft:{...db.draft,text:raw,prompt:text('#ivQ'),chapterId:ids[window.ivQuestionChapter||0]||'family',legacy:true,photo:db.draft.photo||''}});
  }
  function hide(){
    if(!root.hidden){captureDraft();ivLiveStop();ivClearFlash();}
    root.hidden=true;document.getElementById('app').hidden=false;
  }
  function open(screen,options={}){
    const target=root.querySelector('.screen#'+CSS.escape(screen));
    if(!target)return window.Yunyi?.go('home');
    if(active==='session'&&screen!=='session')captureDraft();
    document.getElementById('app').hidden=true;root.hidden=false;
    if(screen==='share'){
      originalGo('story');root.querySelectorAll('.screen.on').forEach(e=>e.classList.remove('on'));target.classList.add('on');
    }else originalGo(screen);
    active=screen;syncIdentity();
    if(screen==='shelf')renderShelf();
    if(screen==='summary'&&!lastRaw)root.querySelector('#summary .sum2-date').textContent='示例小结';
    if(screen==='session'){
      ivCloseQuestionSelect();
      const recovery=document.getElementById('v21-draft-recovery');
      if(recovery)recovery.hidden=!read()?.draft?.text;
    }
    if(screen==='summary')document.getElementById('memoir-allow-original').disabled=!lastRaw;
    if(options.history!==false&&location.hash!=='#m/'+screen)history.pushState(null,'','#m/'+screen);
    window.Yunyi?.nav('m/'+screen);
  }
  function start(kind='question',q=null){
    if(kind!=='resume'){lastRaw='';summaryRaw=null;ivClearMedia();}
    open('session');
    if(kind==='resume'){
      const d=read()?.draft;if(!d?.text)return;
      ivWrite();document.getElementById('ivLiveTxt').textContent=d.text;
      window.ivLiveFull=d.text;window.ivLiveIdx=d.text.length;window._ivHasUnsavedRec=true;
      if(d.prompt)document.getElementById('ivQ').textContent=d.prompt;
      return;
    }
    if(kind==='free'){ivFreeEntry();}
    else if(kind==='photo'){ivPhotoEntry();}
    else {ivStructuredStart();if(q?.chapterId){const i=ids.indexOf(q.chapterId);if(i>=0)ivPickQuestionChapter(i);}}
  }
  function bindChapterItems(){
    const db=read();if(!db)return;
    db.items.filter(x=>x.type==='story'&&x.legacy).forEach(x=>{
      const i=Math.max(0,ids.indexOf(x.chapterId)),c=CHAPTERS[i];
      if(!c.stories.includes(x.title))c.stories.push(x.title);
      c.done=true;
    });
  }
  function renderShelf(){
    const row=root.querySelector('#shelf .sh-row');if(!row)return;
    const colors=['terra','gold','green','teal','plum','navy'];
    row.replaceChildren();
    CHAPTERS.forEach((c,i)=>{if(!c.done)return;const button=document.createElement('button');button.className='sh-book bk-'+colors[i%colors.length];button.dataset.chapterIndex=i;button.setAttribute('aria-label',c.no+' '+c.name);button.innerHTML='<span class="bno">'+h(c.no)+'</span><span class="btt">'+h(c.name)+'</span><span class="bst">'+c.stories.length+' 段故事</span>';button.onclick=()=>openChapter(i);row.append(button);});
  }
  function summaryMedia(items){
    const flow=root.querySelector('#sumMedia');
    items.forEach(item=>{
      const fig=document.createElement('figure');fig.className='sum2-fig';fig.draggable=true;
      const media=item.type==='video'?'<div class="media"><span>视频素材 · 演示预览</span></div>':'<div class="media"><img src="'+h(item.url)+'" alt="'+h(item.name||'本次照片')+'" style="width:100%;height:100%;object-fit:cover"></div>';
      fig.innerHTML='<div class="frame">'+media+'</div><figcaption>'+h(item.name||'本次照片')+'</figcaption><button class="sm-del" aria-label="移除素材" onclick="sumMediaDel(event,this)">×</button>';flow.append(fig);
    });
    sumMediaCover();
  }
  function saveSummary(){
    const db=read();if(!db)return false;
    const title=text('#summary .sum2-title span')||'一段值得记住的时光';
    const body=[...root.querySelectorAll('#sumMedia>p')].filter(e=>!e.hidden).map(e=>e.textContent).join('\n\n');
    const existing=db.items.find(x=>x.legacy&&x.original===lastRaw&&x.title===title);
    if(existing)return true;
    const media=[...root.querySelectorAll('#sumMedia .sum2-fig')].map(f=>({name:f.querySelector('figcaption')?.textContent||'',url:f.querySelector('img')?.src||'',type:f.querySelector('img')?'photo':'video'}));
    const x={id:id(),type:'story',legacy:true,title,body,original:lastRaw,chapterId:ids[window.ivQuestionChapter||0]||'family',date:date(),photo:media.find(m=>m.type==='photo')?.url||'',media};
    const allow=document.getElementById('memoir-allow-original').checked&&!!lastRaw;
    const next={...db,items:[x,...db.items],draft:{...db.draft,text:'',legacy:false},memories:allow?[...db.memories,{id:id(),source:'story',person:'self',original:lastRaw,enabled:true}]:db.memories};
    if(!persist(next))return false;
    window._ivHasUnsavedRec=false;bindChapterItems();toast('已珍藏到回忆录章节');return true;
  }
  window.go=function(screen){
    if(!window.Yunyi)return originalGo(screen);
    if(screen==='mine')return window.Yunyi.go('me');
    if(screen==='shelf'&&active==='summary'&&!saveSummary())return;
    if(screen==='share')return originalGo('share');
    open(screen);
  };
  // Capture user's own words before the original demo advances its interview state.
  const done=window.ivDone;
  window.ivDone=function(){lastRaw=text('#ivLiveTxt')||lastRaw;captureDraft();return done.apply(this,arguments);};
  const showSummary=window.ivShowSummary;
  window.ivShowSummary=function(){
    lastRaw=text('#ivLiveTxt')||lastRaw;
    showSummary.apply(this,arguments);
    if(lastRaw){
      if(summaryRaw!==lastRaw){
        const flow=root.querySelector('#sumMedia');flow.replaceChildren();
        const paragraph=document.createElement('p');paragraph.textContent=lastRaw;flow.append(paragraph);
        summaryMedia(window._ivMediaItems||[]);summaryRaw=lastRaw;
        document.getElementById('memoir-allow-original').checked=false;
      }
      const short=lastRaw.split(/[。！？\n]/)[0].trim();
      root.querySelector('#summary .sum2-title span').textContent=short.length>20?short.slice(0,20)+'…':short||'本次讲述';
      root.querySelector('#summary .sum2-eyebrow').textContent=CHAPTERS[window.ivQuestionChapter||0]?.name||'回忆录';
      const quote=root.querySelector('#summary .sum2-quote');quote.textContent='';quote.hidden=true;
      root.querySelector('#summary .sum2-date').textContent=date()+' · 本次讲述';
      document.getElementById('sumCate').style.display='none';
      root.querySelector('#summary .body').scrollTop=0;
    }
  };
  const addMedia=window.sumMediaAdd;
  window.sumMediaAdd=function(){addMedia.apply(this,arguments);const fig=root.querySelector('#sumMedia .sum2-fig:last-child');if(fig){fig.querySelector('.media').innerHTML='<img src="v20/assets/travel.jpg" alt="示例照片" style="width:100%;height:100%;object-fit:cover">';fig.querySelector('figcaption').textContent='示例照片 · 可移除';}};
  const topicSave=window.topicSwitchSave;
  window.topicSwitchSave=function(){if(!captureDraft())return;return topicSave.apply(this,arguments);};
  const edits=window.storySaveEdits;
  window.storySaveEdits=function(silent){
    if(saving)return;saving=true;
    try{
      edits(silent);
      const db=read();if(!db)return;
      if(editingId){const next={...db,items:db.items.map(x=>x.id===editingId?{...x,title:text('#story [data-story-edit="title"]'),body:text('#story [data-story-edit="body"]'),quote:text('#story [data-story-edit="quote"]')}:x)};persist(next);}
    }finally{saving=false;}
  };
  function story(itemId){
    const x=read()?.items.find(x=>x.id===itemId);if(!x)return;
    editingId=x.id;open('story');history.replaceState(null,'','#m/story/'+encodeURIComponent(x.id));
    root.querySelector('#story [data-story-edit="title"]').textContent=x.title;
    root.querySelector('#story [data-story-edit="body"]').textContent=x.body;
    root.querySelector('#story [data-story-edit="quote"]').textContent=x.quote||'';
    root.querySelector('#story [data-story-edit="category"]').textContent=CHAPTERS[Math.max(0,ids.indexOf(x.chapterId))].name;
  }
  const chapterText=window.chapterStoryText;
  window.chapterStoryText=function(ch,st,i){const x=read()?.items.find(x=>x.legacy&&x.title===st);return h(x?x.body:chapterText(ch,st,i));};
  const avatarSet=AvatarStore.set;
  AvatarStore.set=function(src){avatarSet.call(AvatarStore,src);syncIdentity();};
  // New shell routes are available at every otherwise root-level original page.
  ['session','mine','onboarding','setup','userpath','devhandoff','landing'].forEach(screen=>{
    const bar=document.createElement('div');bar.className='v21-return';
    bar.innerHTML='<button type="button" data-yunyi-home>‹ 首页</button><span>'+(screen==='session'?'回忆录':'云忆')+'</span><button type="button" data-yunyi-me>我的 ›</button>';
    root.querySelector('#'+screen).prepend(bar);
  });
  const sessionNote=document.createElement('div');sessionNote.className='v21-demo-note';sessionNote.textContent='';sessionNote.hidden=true;
  root.querySelector('#session .v21-return').after(sessionNote);
  const recovery=document.createElement('div');recovery.id='v21-draft-recovery';recovery.className='v21-draft-row';recovery.hidden=true;
  recovery.innerHTML='<span>上次的讲述还在</span><button data-memoir-resume>接着讲 ›</button>';
  root.querySelector('#session .v21-return').after(recovery);
  const saveDraftButton=document.createElement('button');saveDraftButton.type='button';saveDraftButton.className='v21-save-draft';saveDraftButton.textContent='先存草稿';saveDraftButton.onclick=()=>{if(captureDraft()){ivLiveStop();window.Yunyi.go('drafts');}};
  root.querySelector('#session .v21-return span').replaceWith(saveDraftButton);
  const shelf=root.querySelector('#shelf .sh2-hero');
  shelf.querySelector('.sh2-title').textContent='珍藏';shelf.querySelector('.sh2-sub').textContent='';
  const tabs=document.createElement('div');tabs.className='v21-collection-tabs';tabs.innerHTML='<button data-yunyi-library="all">全部</button><button data-yunyi-library="praise">夸夸卡</button><button class="selected">回忆录</button>';shelf.after(tabs);
  const label=document.createElement('label');label.className='v21-memory-consent';label.innerHTML='<input id="memoir-allow-original" type="checkbox"><span>允许云忆记住这段原文<small>仅使用你亲自讲述的内容；可在「我的」撤回授权。</small></span>';
  root.querySelector('#summary .body').append(label);
  root.addEventListener('click',e=>{
    if(e.target.closest('[data-yunyi-home]'))window.Yunyi.go('home');
    if(e.target.closest('[data-yunyi-me]'))window.Yunyi.go('me');
    if(e.target.closest('[data-memoir-resume]'))start('resume');
    const filter=e.target.closest('[data-yunyi-library]');if(filter)window.Yunyi.library(filter.dataset.yunyiLibrary);
  });
  root.querySelectorAll('#profile .profile-line.editable').forEach((el,i)=>{if(i<2){el.removeAttribute('data-toast');el.addEventListener('click',()=>window.Yunyi.go('settings'));}});
  root.querySelectorAll('#mine [data-toast^="朗读"],#mine [data-toast^="字号"]').forEach(el=>{el.removeAttribute('data-toast');el.onclick=()=>window.Yunyi.go('settings');});
  const subjectInput=document.getElementById('memoir-subject-name');
  if(subjectInput)subjectInput.addEventListener('change',()=>{const db=read(),name=subjectInput.value.trim();if(!name){subjectInput.value=db.subject?.name||db.name;return;}if(persist({...db,subject:{...(db.subject||{relation:'self'}),name}}))syncIdentity();});
  const pickSubject=window.setupPick;
  window.setupPick=function(el,multi){pickSubject.apply(this,arguments);const options=root.querySelector('#setupStep1>.setup-field:first-child .setup-options');if(!multi&&options?.contains(el)){const relation=['self','parents','family'][[...options.children].indexOf(el)],db=read();if(db){const name=relation==='self'?db.name:(db.subject?.relation===relation?db.subject.name:'');persist({...db,subject:{relation,name}});syncIdentity();}}};
  window.Memoir={open,start,hide,story,captureDraft,syncIdentity,bindChapterItems,saveSummary,chapters:()=>CHAPTERS,avatar:()=>AvatarStore.get()};
})();
