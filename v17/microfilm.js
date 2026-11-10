(function(){
  'use strict';
  const core=window.YunyiFilmCore;
  const KEY='yunyi.v17.microfilm.jiang.v1';
  const realCase=window.YunyiJiangCase;
  const casePreview=window.YunyiJiangPreview;
  // Reuse the same chapter IDs and the same case sources in memoir and film.
  if(realCase&&window.CHAPTERS){
    window.CHAPTERS=window.CHAPTERS.map(ch=>{const entries=realCase.sources.filter(source=>source.chapterNo===ch.id);return {...ch,caseId:realCase.id,done:false,sources:entries,stories:entries.map(source=>source.title)};});
    const row=document.querySelector('#shelfFull .sh-row');
    if(row)row.innerHTML=window.CHAPTERS.map((ch,i)=>'<button class="sh-book '+['bk-terra','bk-gold','bk-green','bk-teal','bk-plum','bk-navy'][i%6]+'" onclick="openChapter('+i+')"><span class="bno">'+ch.no+'</span><span class="btt">'+ch.name+'</span><span class="bst">'+ch.stories.length+' 张故事卡</span></button>').join('');
    const heading=document.querySelector('#shelfFull .sh-sec-h .t');if(heading)heading.textContent='蒋老师的故事章节';
    const desc=document.querySelector('#shelfFull .sh-sec-h .d');if(desc)desc.textContent='与微电影共用分类';
    const toc=document.querySelector('#tocDrawer .dw-list');
    if(toc)toc.innerHTML=window.CHAPTERS.map((ch,i)=>'<button class="dw-item" onclick="closeToc();openChapter('+i+')"><span class="nm">'+ch.no+' · '+ch.name+'</span><span class="dwb">'+ch.stories.length+' 张</span></button>').join('');
    const sub=document.querySelector('#tocDrawer .dw-sub');if(sub)sub.textContent='蒋老师 · 10 章 · 151 张真实故事卡';
  }

  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg=name=>'<svg class="mf-icon" viewBox="0 0 24 24" aria-hidden="true">'+({
    camera:'<rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 9 4-2v10l-4-2"/>',
    film:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3V9Z"/>',
    leaf:'<path d="M5 20C5 8 16 4 21 3c0 11-4 17-12 16M5 20l10-9"/>',
    arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',
    photo:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    source:'<path d="M4 4h6l2 2h8v14H4V4ZM8 11h8M8 15h5"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  }[name]||'')+'</svg>';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const photoUrl=photo=>photo?.illustration&&photo.id==='demo-tree'?'v17/assets/story-tree-illustration.png':photo?.illustration&&photo.id==='demo-lamp'?'v17/assets/story-family-lamp.png':photo.url;
  // Reference files supply photograph regions only; controls and text remain live HTML.
  function referenceArt(kind,extra=''){
    const crops={hero:['story',36,132,570,373],lamp:['story',670,370,540,348],person:['materials',57,320,530,344],personWide:['materials',57,320,530,225],front:['materials',61,763,162,166],side:['materials',244,763,157,166],back:['materials',422,763,158,166],yard:['materials',694,750,496,213],preview:['preview',49,430,548,416]};
    const [file,x,y,w,h]=crops[kind];
    return '<div class="mf-reference-art mf-source-crop '+extra+'" role="img" aria-label="设计稿示例画面" style="aspect-ratio:'+w+'/'+h+'!important"><img alt="" src="v17/assets/design-reference/'+file+'.png" style="position:absolute!important;max-width:none!important;width:'+(1269/w*100)+'%!important;height:auto!important;aspect-ratio:auto!important;left:'+(-x/w*100)+'%;top:'+(-y/h*100)+'%;transform:none!important;object-fit:fill!important"></div>';
  }
  function storyPhoto(photo){return photo.illustration&&photo.id==='demo-lamp'?referenceArt('lamp'):'<img src="'+esc(photoUrl(photo))+'" alt="'+esc(photo.name||'本段故事照片')+'">';}
  // Compact repeated long values only when storage is full; old records remain readable.
  function encodeStorage(value){
    const counts=new Map();JSON.stringify(value,(k,v)=>{if(typeof v==='string'&&v.length>=80)counts.set(v,(counts.get(v)||0)+1);return v;});
    const dict=[...counts].filter(([v,n])=>n>1&&v.length*(n-1)>n*16+20).map(([v])=>v), lookup=new Map(dict.map((v,i)=>[v,i]));
    const payload=JSON.stringify(value,(k,v)=>typeof v==='string'?(lookup.has(v)?'\u0001'+lookup.get(v):v.startsWith('\u0001')?'\u0001!'+v:v):v);
    return JSON.stringify({format:'yunyi-dedup-v1',dict,payload});
  }
  function decodeStorage(raw){
    const data=JSON.parse(raw);if(data?.format!=='yunyi-dedup-v1')return data;
    if(!Array.isArray(data.dict)||typeof data.payload!=='string')throw Error('存储格式无效');
    return JSON.parse(data.payload,(k,v)=>{if(typeof v!=='string'||!v.startsWith('\u0001'))return v;if(v.startsWith('\u0001!'))return v.slice(2);const index=v.slice(1);if(!/^\d+$/.test(index)||typeof data.dict[Number(index)]!=='string')throw Error('存储引用无效');return data.dict[Number(index)];});
  }
  let db={version:1,sources:[],projects:[],activeId:null};
  let loadError='';
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const parsed=decodeStorage(raw);if(parsed.version!==1||!Array.isArray(parsed.sources)||!Array.isArray(parsed.projects))throw Error();db=parsed;}
  }catch(e){loadError='已有微电影草稿暂时无法读取。请先导出备份或检查浏览器存储，不会覆盖原数据。';}
  let pendingSave=null,pendingSaveView=null;
  let unsaved=false,view=resumeView(db.projects.find(p=>p.id===db.activeId));
  let selected=new Set(),duration=null,tone='温暖回望';
  let scope='life',selectionBasis='chapter';
  let uploadedStory={title:'',text:''};
  let cardSelection=null,cardGroup='',cardReturn='story',historyIndex=0,novelEditing=false,shotPhotosOpen=false,shotOriginal='';
  let returnTo='session',rangeOpen=false,editIndex=0,readingScroll=0,sceneIndex=0,sceneReturn='production',adjustReturn='story',activeShotId='',directoryChapter=0;
  function characterReferenceKey(p,id){const text=p.characterPhotos?.[id]?.url||'';let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return text?'photo-'+(h>>>0).toString(36)+'-'+text.length:'story-only';}
  function characterImageReady(p,id){const item=p.characterGeneration?.items?.[id];return p.characterGeneration?.revision===p.revision&&item?.referenceKey===characterReferenceKey(p,id)&&item.status==='ready'&&typeof item.imageUrl==='string'&&(/^(https?:\/\/|data:image\/)/i.test(item.imageUrl)||(item.simulated===true&&item.imageUrl==='v17/assets/film-three-views-example.png'));}
  function allCharacterImagesReady(p){return !!p&&storyPeople(p).every(person=>characterImageReady(p,person.id));}
  function protagonistReady(p){return p?.protagonistApproval?.revision===p?.revision&&Array.isArray(p?.protagonistApproval?.people)&&allCharacterImagesReady(p);}
  function resumeView(p){return !p?'home':p.stage==='brief'?'choose':p.editorDraft||p.sourcePending||!core.isApproved(p)?'story':!protagonistReady(p)?'people':p.visualApproval?.revision===p.revision?(p.filmJob?.simulated?'film-preview':'video-demo'):p.visualStep==='waiting'?'preview-wait':'production';}
  function phases(n){return '<ol class="mf-phases" aria-label="制作进度">'+['故事','人物','预览调整','影片'].map((label,i)=>'<li'+(i===n?' aria-current="step"':'')+'><button data-mf="phase" data-phase="'+i+'" '+(i===n?'aria-current="step"':'')+'>'+label+'</button></li>').join('')+'</ol>';}

  const initialBody=$('#story [data-story-edit="body"]')?.textContent.trim()||'';
  const initialTitle=$('#story [data-story-edit="title"]')?.textContent.trim()||'这段回忆';
  const initialChapter=$('#story [data-story-edit="category"]')?.textContent.split('·').pop().trim()||'';
  // Fictional demonstration memories. Never merge these into a user's recorded life.
  const lifeExamples=[
    {id:'v17-demo-origins',title:'家里的第一盏灯',chapterName:'出生与家族',text:'我出生在一个普通的乡村家庭。小时候，家里住的是土坯房，父亲会修农具，母亲总能把一家人的衣服收拾得整整齐齐。晚上点起煤油灯，我们围在桌边吃饭，听大人说田里的收成和村里的新鲜事。那时不懂什么叫富足，只觉得一家人在一起，屋里就是暖的。母亲做饭时，我会站在灶边帮她添柴；父亲从外面回来，我总要先跑到门口，看看他手里有没有带回什么。那些日子没有留下多少照片，家里的灯光和饭菜香，却一直留在我的记忆里。'},
    {id:'v17-demo-school',title:'走过田埂去上学',chapterName:'求学的日子',text:'上小学以后，我每天和邻居家的孩子一起走路去学校。书包是母亲用旧布缝的，课本外面包着报纸，边角卷了也舍不得换。下雨时，田埂上的泥会粘住鞋底，我们就放慢脚步，相互等一等。启蒙老师常常留到很晚，把没听懂的题再讲一遍。有一次，我把一篇作文读给家里人听，父亲虽然不识几个字，却一直认真听到最后。后来生活越来越忙，我才慢慢明白，那段读书的时光留给我的，不只是认识了多少字，还有遇到不懂的事，愿意再学一遍的习惯。'},
    {id:'v17-demo-work',title:'第一次走进纺织厂',chapterName:'成家立业',text:'年轻时，我离开老家，到城里的纺织厂上班。刚进车间，机器的声音让我说话都不自觉地大了起来。师傅带着我熟悉工序，提醒我先看清、再动手，不能图快。第一次独立完成一班工作，我回到宿舍坐了很久，觉得自己终于能靠双手把日子往前推一点了。发第一笔工资时，我先给家里寄了一部分，给母亲买了布料，也给自己添了一双结实的鞋。后来我在厂里认识了许多朋友，我们一起学技术、倒班，也一起在食堂里说笑。那些辛苦和热闹，成了我年轻岁月里很实在的一部分。'},
    {id:'v17-demo-family',title:'两个人的小家',chapterName:'成家立业',text:'我和老伴是经熟人介绍认识的。最初没有多少话题，后来聊起各自的家人和工作，才发现我们都希望把日子过得踏实些。成家时，住处不大，家具也不齐全。我们一件一件添置，旧桌子擦干净还能用，窗帘是自己挑的布，周末一起把屋子收拾一遍。也有为了琐事拌嘴的时候，等气消了，还是会给对方留一口热饭。回过头看，家并不是一下子就有了模样，而是两个人在许多个普通日子里，慢慢商量、慢慢照顾，才一点点变成了后来熟悉的样子。'},
    {id:'v17-demo-children',title:'接女儿放学的路',chapterName:'儿女绕膝',text:'女儿小时候，我们的生活常常围着上班和接送转。谁下班早，谁就去学校门口等；遇到加班，就请邻居帮忙照应一会儿。她拿着作业本跑到我面前，急着说今天学了什么，有时候说着说着，话题就变成了同桌和操场。我一边听，一边想着晚饭该做什么，现在想起来，最想再走一遍的，反倒是那条并不长的放学路。后来她离开家去读书，第一次送她上车，我才懂得当年父母送我出门时的心情。孩子慢慢长大，我们也在学习，怎样把惦记放在心里，把信任交到她手上。'},
    {id:'v17-demo-parents',title:'回家陪父母吃顿饭',chapterName:'亲人与家风',stageName:'家人与陪伴',text:'父母年纪大以后，我回老家的次数渐渐多了。有时只是周末住一晚，帮他们买些日用品，把院子里的东西归拢一下，再一起做顿饭。母亲还是习惯问我累不累，父亲喜欢坐在门口，慢慢说起邻居家的近况。起初我总想着多做一点事，后来发现，他们也很愿意听我把自己的日子讲给他们听。于是我学着把脚步放慢，吃完饭不急着收拾，多坐一会儿，把那些听过许多次的往事再听一遍。家里的许多规矩，就是这样留下来的：有事相互搭把手，离家再远，也记得找个时间回去看看。'},
    {id:'v17-demo-retirement',title:'把平常日子慢慢记下来',chapterName:'退休后的日子',stageName:'晚年生活',text:'退休以后，我终于可以不用赶着闹钟出门。最初还有些不习惯，后来开始种花、散步，也和老朋友约着见面。外孙女教我用手机拍照，我拍过阳台上新开的花，也拍过一家人围坐吃饭的样子，照片有时歪歪的，却都是自己的日子。整理旧东西时，我翻出了工作证、女儿小时候的作业本和一些泛黄的合影，才发现许多故事一直都在，只是从前没有认真讲过。我想把它们慢慢记下来：小时候的家、年轻时的朋友、两个人一起过日子的细节，还有孩子长大的那些年。以后家人再翻到这些回忆，就能知道，我是怎样一步一步，走到了今天。'}
  ].map(s=>({...s,kind:'example',origin:'人生纪事虚构示例'}));
  const exampleScenes={
    'v17-demo-origins':['灯下的一家人','乡村老屋，夜晚','煤油灯照着饭桌。母亲在灶边做饭，孩子添柴；父亲回来，孩子跑到门口。','记忆里的家，是一盏煤油灯。母亲忙着做饭，我在灶边添柴。父亲一回来，我就跑去门口。那时不懂富足，只觉得一家人在一起，屋里就是暖的。'],
    'v17-story':['槐树下的夏夜','村头土坯房外，夏日傍晚','小板凳聚在老槐树下，乡亲们摇着蒲扇说家常。','我家门口有一棵老槐树。夏天傍晚，大家搬着板凳来乘凉，头顶是蝉鸣，身边是说不完的家常。那是我记忆里最凉快、也最热闹的地方。'],
    'v17-demo-school':['田埂上的书包','上学路与家中，求学时光','旧布书包、报纸包着的课本。雨后的田埂上，孩子们放慢脚步，等一等同伴；回家后，孩子读作文，父亲听着。','母亲用旧布给我缝了书包。下雨时，田埂上的泥粘住鞋底，我们就互相等一等。老师把不懂的题再讲一遍，父亲把我的作文听到最后。读书教会我的，是不懂时愿意再学一遍。'],
    'v17-demo-work':['第一份工资','城里纺织厂与宿舍，青年时期','车间里，师傅带着年轻人熟悉工序。工作结束，年轻人在宿舍坐下；布料与结实的鞋，承接第一笔工资的去向。','离开老家，我第一次走进纺织厂。机器声很响，师傅教我先看清，再动手。领到第一笔工资，我给家里寄了一部分，给母亲买布，也给自己添了双鞋。日子开始靠自己的双手向前走。'],
    'v17-demo-family':['慢慢有了家的样子','两个人的小家，成家以后','擦净旧桌，挂起自己选的窗帘。两人一起收拾屋子，桌上留着给对方的热饭。','我们的家不大，家具是一件件添起来的。也为琐事拌过嘴，可气消了，还是记得给对方留口热饭。家是这样慢慢长出来的，在许多个平常日子里，商量着，也照顾着。'],
    'v17-demo-children':['那条放学路','学校门口与离家车站，女儿成长时','女儿拿着作业本跑来，一路讲学校里的事。岁月转过，父母送长大的女儿上车。','那几年，谁下班早，谁就去接女儿。她说课堂，也说同桌和操场。我忙着想晚饭，却没想到，后来最想重走的，是这条放学路。等送她离家读书，我才懂父母当年的惦记，也开始学着把信任交给她。'],
    'v17-demo-parents':['再坐一会儿','老家院子与饭桌，父母年老以后','归拢院子，买回日用品，一家人做饭。饭后没有急着离开，坐下听父亲讲邻里的近况。','父母老了，我回家的次数多起来。起初总想多做些事，后来才明白，他们也想听我讲自己的日子。于是吃完饭，再坐一会儿，把听过的往事再听一遍。有事搭把手，离家再远，也记得回来看看。'],
    'v17-demo-retirement':['把日子留给家人','阳台与家中，退休以后','用手机拍新开的花与团聚的饭桌，翻看工作证、作业本和泛黄合影。','退休后，我开始种花、散步。外孙女教我拍照，照片有时歪歪的，却都是自己的日子。翻出旧工作证和女儿的作业本，才发现故事一直都在。我想慢慢讲给家人听，让他们知道，我是怎样一步一步走到今天的。']
  };
  let typedMemory='';
  const root=document.createElement('section');root.id='film';root.className='screen mf-screen';
  root.setAttribute('aria-label','云忆拾光微电影');$('.screens').appendChild(root);
  const storyTools=$('#story .body');
  if(storyTools){const entry=document.createElement('button');entry.type='button';entry.className='mf-story-entry';entry.dataset.go='film';entry.dataset.filmEntry='story';entry.innerHTML=svg('film')+'制作我的微电影<span>›</span>';storyTools.appendChild(entry);}

  function persist(next,keepDraft=false){
    if(loadError){notify(loadError);return false;}
    try{const plain=JSON.stringify(next);try{localStorage.setItem(KEY,plain);}catch(e){if(e.name!=='QuotaExceededError')throw e;const packed=encodeStorage(next);if(packed.length>=plain.length)throw e;localStorage.setItem(KEY,packed);}db=next;pendingSave=null;unsaved=false;updateSaveState();return true;}
    catch(e){pendingSave=next;if(keepDraft)db=next;unsaved=true;updateSaveState();notify(e.name==='QuotaExceededError'?'本机存储空间不足，草稿暂留在当前页面。请先备份已有数据，再重试保存。':'本机保存失败，草稿暂留在当前页面，请重试保存。');return false;}
  }
  function updateSaveState(){
    const node=$('#film-save-state');if(node){node.textContent=unsaved?'尚未保存 · 请重试':'';node.classList.toggle('mf-save-error',unsaved);const bar=node.closest('.mf-save-bar');if(bar)bar.hidden=!unsaved;}
    const retry=$('#film-retry-save');if(retry)retry.hidden=!unsaved;
  }
  function notify(message){const box=$('#film-notice');if(box){box.textContent=message;box.hidden=false;}else if(typeof toast==='function')toast(message);}
  function project(){return db.projects.find(p=>p.id===db.activeId);}
  function storeProject(p,keepDraft=false){
    const old=db.projects.find(x=>x.id===p.id);
    if(old&&(old.revision!==p.revision||old.story!==p.story)){delete p.protagonistApproval;delete p.scriptApproval;delete p.visualApproval;delete p.demoAssetsConfirmed;delete p.demoPreviewSaved;}

    const examples=p.sources.filter(s=>s.kind==='example'&&!db.sources.some(x=>x.id===s.id));
    return persist({...db,sources:[...db.sources,...clone(examples)],activeId:p.id,projects:db.projects.some(x=>x.id===p.id)?db.projects.map(x=>x.id===p.id?p:x):[p,...db.projects]},keepDraft);
  }
  function sources(){
    if(realCase){const personal=db.sources.filter(s=>s.kind!=='example'&&s.caseId!==realCase.id);const defaults=personal.length?[]:realCase.sources;return [...defaults,...db.sources.filter(s=>s.kind!=='example')].filter((s,i,a)=>a.findLastIndex(x=>x.id===s.id)===i);}
    const existing={id:'v17-story',title:initialTitle,text:initialBody,kind:'example',origin:'V17 故事卡示例',chapterName:initialChapter};
    return [lifeExamples[0],existing,...lifeExamples.slice(1),...db.sources].map(source=>{const a=source.kind==='example'&&exampleScenes[source.id];const illustrations={'v17-demo-origins':{id:'demo-lamp',url:'v17/assets/story-lamp-illustration.png',name:'煤油灯场景配图',illustration:true},'v17-story':{id:'demo-tree',url:'v17/assets/story-tree-illustration.png',name:'老槐树案例配图',illustration:true}};const picture=source.kind==='example'&&illustrations[source.id];return {...source,...(picture&&!source.photos?.length?{photos:[picture]}:{}),...(a?{filmDraft:{heading:a[0],setting:a[1],visual:a[2],narration:a[3]}}:{})};}).filter((x,i,all)=>x.text&&all.findLastIndex(y=>y.id===x.id)===i).map(s=>s.kind==='example'&&s.id==='v17-story'&&!s.chapterName?{...s,chapterName:initialChapter}:s);
  }
  function syncStory(){
    const text=$('#story [data-story-edit="body"]')?.textContent.trim()||'';
    const title=$('#story [data-story-edit="title"]')?.textContent.trim()||'这段回忆';
    if(!text)return false;
    const old=db.sources.find(s=>s.id==='v17-story');
    const chapterName=$('#story [data-story-edit="category"]')?.textContent.split('·').pop().trim()||'';
    const source={id:'v17-story',title,text,kind:(text!==initialBody||title!==initialTitle||old?.kind==='user')?'user':'example',origin:'V17 故事卡正文',chapterName,photos:clone(old?.photos||[])};
    return persist({...db,sources:[...db.sources.filter(s=>s.id!==source.id),source]},true);
  }
  const photoPick=document.createElement('input');photoPick.type='file';photoPick.accept='image/jpeg,image/png,image/webp';photoPick.hidden=true;photoPick.id='film-story-photo-pick';document.body.appendChild(photoPick);
  function showStoryPhoto(){
    const photo=db.sources.find(s=>s.id==='v17-story')?.photos?.[0],inner=$('#story .sum2-photo .inner');
    if(inner&&photo){inner.replaceChildren();const image=document.createElement('img');image.src=photo.url;image.alt=photo.name||'故事照片';image.style.cssText='width:100%;height:100%;object-fit:contain';inner.appendChild(image);}
  }
  window.storyUpload=()=>photoPick.click();
  photoPick.addEventListener('change',async()=>{
    const file=photoPick.files[0];if(!file)return;
    try{
      if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('请选择 JPG、PNG 或 WebP 照片。');
      if(file.size>2*1024*1024)throw Error('本地原型请使用 2MB 以内的照片。');
      const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('照片读取失败，请重试。'));reader.readAsDataURL(file);});
      const image=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('照片无法打开，请换一张。'));image.src=url;});
      if(!syncStory())return;
      const source=db.sources.find(s=>s.id==='v17-story');
      const photos=[{id:'story-photo-'+Date.now(),url,name:file.name,width:image.naturalWidth,height:image.naturalHeight}];
      if(persist({...db,sources:db.sources.map(s=>s.id===source.id?{...s,photos}:s)})){showStoryPhoto();if(typeof toast==='function')toast('照片已保存，会随这段故事带入微电影。');}
    }catch(e){if(typeof toast==='function')toast(e.message);}finally{photoPick.value='';}
  });
  showStoryPhoto();
  function photoSummary(p){
    const photos=p.photoPlan||[];if(!photos.length)return '';
    return '<details class="mf-photo-plan"><summary>故事里的照片 · '+photos.length+' 张</summary><p class="mf-muted">优先用于对应故事，缺少的画面再补充。当前仅检查图片可读取性与尺寸，AI 内容及画质审查待接入。</p>'+photos.map(photo=>'<figure>'+(photo.status!=='unsuitable'?'<img src="'+esc(photoUrl(photo))+'" alt="'+esc(photo.name||'故事原照片')+'" loading="lazy">':'')+'<figcaption><b>'+esc(photo.name||'故事照片')+'</b><span>'+esc(photo.reason)+'</span></figcaption></figure>').join('')+'</details>';
  }
  function archiveTypedMemory(){
    if(!typedMemory.trim())return;
    const text=typedMemory.trim(),existing=db.sources.find(s=>s.text===text);
    const chapterName=window.ivSelectedChapterTitle||$('#ivChapterTitle')?.textContent.trim()||'';
    const source={id:existing?.id||'v17-memory-'+Date.now(),title:existing?.title||text.slice(0,18)+(text.length>18?'…':''),text,kind:'user',origin:'V17 键盘录入的回忆',chapterName};
    persist({...db,sources:[...db.sources.filter(s=>s.id!==source.id),source]},true);
    typedMemory='';
  }
  const savedStory=db.sources.find(s=>s.id==='v17-story'&&s.kind==='user');
  if(savedStory){$('#story [data-story-edit="body"]').textContent=savedStory.text;$('#story [data-story-edit="title"]').textContent=savedStory.title;if(savedStory.chapterName)$('#story [data-story-edit="category"]').textContent=savedStory.chapterName;}
  function checkedProject(){
    const p=project();if(!p)throw Error('请先选择回忆并整理故事。');
    if(p.sourcePending||(!p.uploaded&&core.sourcesChanged(p,sources())))throw Error('原文已更新，请先重新读取并确认剧本。');
    return p;
  }
  function openProject(id){
    let p=db.projects.find(x=>x.id===id);if(!p)return;
    if(!p.uploaded&&core.sourcesChanged(p,sources())&&!p.sourcePending){p={...clone(p),revision:p.revision+1,approval:null,screenplay:null,board:null,stage:'story',sourcePending:true};storeProject(p,true);}
    else persist({...db,activeId:id},true);
    view=resumeView(p);render();
  }
  function badge(p){if(p.caseId===realCase?.id)return '';return '<span class="mf-provenance">'+(p.sources.every(s=>s.kind==='example')?'虚构示例故事 · 制作流程体验':'原型故事预览 · 按原文整理，非实时 AI 创作')+'</span>';}
  function sourceList(items){return items.map(s=>'<div class="mf-source-line">'+svg('source')+'<span>'+esc(s.title)+'</span></div>').join('');}
  function stepper(){
    const n=['choose','story'].indexOf(view);
    return '<ol class="mf-steps" aria-label="制作步骤">'+['选择范围','确认剧本'].map((s,i)=>'<li class="'+(i===n?'current':i<n?'done':'')+'"'+(i===n?' aria-current="step"':'')+'><span>'+(i<n?'✓':i+1)+'</span>'+s+'</li>').join('')+'</ol>';
  }
  function header(title){return '<div class="sbar"><span>9:41</span><span class="bat"></span></div><div class="wxcap">··· ◉</div><header class="mf-nav"><button type="button" data-mf="back" aria-label="返回上一页">‹</button><strong>'+title+'</strong>'+'<span></span>'+'</header>';}
  function footer(content){return '<footer class="mf-foot">'+content+'</footer>';}
  function taskCard(p){
    const waiting=p.visualStep==='waiting',status=p.visualApproval?.revision===p.revision?'影片待制作':waiting?'预览待生成':!core.isApproved(p)?'故事待确认':!protagonistReady(p)?'人物待确认':'预览待调整';
    const created=new Date(p.createdAt),date=p.createdAt&&!isNaN(created.getTime())?[created.getFullYear(),String(created.getMonth()+1).padStart(2,'0'),String(created.getDate()).padStart(2,'0')].join('-'):'';
    return '<button type="button" class="mf-task" data-mf="resume" data-id="'+esc(p.id)+'"><span class="mf-task-icon" aria-hidden="true"></span><span class="mf-task-content"><small>'+status+'</small><b>'+esc(p.title)+'</b>'+(date?'<time>'+date+'</time>':'')+'</span></button>';
  }
  function home(){
    const ordered=[...db.projects].sort((a,b)=>(b.id===db.activeId)-(a.id===db.activeId));
    return header('我的微电影')+'<div class="body mf-body mf-library"><div class="mf-library-heading" role="img" aria-label="我的微电影，用影像珍藏回忆，让故事温暖延续。"></div><div class="mf-section-heading"><h2>我的微电影</h2><span>共 '+ordered.length+' 部</span></div>'+(ordered.length?'<div class="mf-task-list">'+ordered.map(taskCard).join('')+'</div>':'<div class="mf-empty">'+svg('film')+'<b>您的第一部微电影</b><p>从已经记录的回忆开始。</p></div>')+'</div>'+footer('<button class="mf-primary" data-mf="new">'+svg('camera')+'制作我的微电影 '+svg('arrow')+'</button>');
  }
  function settings(value,selectedTone){
    const values=[...new Set([60,120,180,300,value].filter(Boolean))].sort((a,b)=>a-b);
    return '<details class="mf-settings" id="film-settings"><summary>更多设置<span>时长与风格</span></summary><div class="mf-setting"><label for="film-duration">电影时长</label><select id="film-duration"><option value="auto" '+(!value?'selected':'')+'>按内容自动安排</option>'+values.map(v=>'<option value="'+v+'" '+(value===v?'selected':'')+'>约 '+Math.ceil(v/60)+' 分钟</option>').join('')+'</select></div><div class="mf-setting"><label for="film-tone">故事基调</label><select id="film-tone">'+['温暖回望','平实纪实','写给家人的信'].map(t=>'<option '+(selectedTone===t?'selected':'')+'>'+t+'</option>').join('')+'</select></div></details>';
  }
  function canConfirm(p){return p.reviewTarget!=='screenplay'&&!p.editorDraft&&!!p.story.trim()&&!!p.title.trim()&&!p.sourcePending&&!Object.keys(p.passageDrafts||{}).length&&!p.feedbackDraft?.trim()&&!(p.revisionRequest?.status==='pending'&&p.story===p.revisionRequest.story);}
  function groupFilmSources(items,basis){return casePreview?casePreview.groupSources(items,basis,core):core.groupSources(items,basis);}
  function pickedSources(){return core.selectSources(sources(),{scope,selectedIds:[...selected]});}
  function rangeSummary(){const count=pickedSources().length;return (scope==='life'?'人生纪事 · 已包含全部 ':'岁月片段 · 已选择 ')+count+' 段回忆';}
  function choose(){
    const available=core.availableSources(sources()),exampleOnly=available.length&&available.every(s=>s.kind==='example');
    const modes='<div class="mf-direction-options" role="radiogroup" aria-label="电影方向">'+[['life','人生纪事','用全部回忆，串起一路走来的人生。'],['fragment','岁月片段','讲述一段难忘的岁月。'],['upload','上传自己的故事','故事文件。']].map(([id,name,desc])=>'<label class="mf-direction-card"><input type="radio" name="film-scope" value="'+id+'" '+(scope===id?'checked':'')+'><img class="mf-direction-art" src="v17/assets/direction-'+id+'.png" alt=""><span><b>'+name+'</b><small>'+desc+'</small></span></label>').join('')+'</div>';
    return header('制作微电影')+'<div class="body mf-body mf-direction-page mf-direction-choose"><div class="mf-direction-hero" role="img" aria-label="把人生，留在光影里。用影像珍藏回忆，让故事温暖延续。"></div>'+modes+'<p class="mf-provenance">'+(exampleOnly?'当前使用虚构示例回忆，体验制作流程。':(available.every(s=>s.caseId===realCase?.id)?'':'原型预览：根据所选原文整理，尚未接入 AI 创作。'))+'</p></div>'+footer('<button class="mf-primary" id="film-create" data-mf="'+(scope==='life'?'create':scope==='upload'?'upload-story':'select-range')+'" '+(!available.length&&scope!=='upload'?'disabled':'')+'>'+(scope==='life'?'为我写故事':scope==='upload'?'选择故事文件':'选择章节或阶段')+'</button>');
  }
  function range(){
    const available=core.availableSources(sources()),picked=pickedSources();
    const selection=scope==='life'?'<div class="mf-scope-summary"><details><summary>查看包含的内容</summary>'+sourceList(available)+'</details></div>':'<div class="mf-setting mf-group-basis"><label for="film-group-basis">选择方式</label><select id="film-group-basis"><option value="chapter" '+(selectionBasis==='chapter'?'selected':'')+'>按章节选择</option><option value="stage" '+(selectionBasis==='stage'?'selected':'')+'>按人生阶段选择</option></select></div><div class="mf-source-options">'+groupFilmSources(sources(),selectionBasis).map(g=>{const all=g.sourceIds.every(id=>selected.has(id)),some=g.sourceIds.some(id=>selected.has(id));return '<label class="mf-source-option"><input type="checkbox" data-mf-group="'+esc(g.id)+'" '+(all?'checked':'')+' '+(some&&!all?'data-partial="true"':'')+'><span class="mf-source-main"><span class="mf-source-top"><b>'+esc(g.name)+'</b><em>'+g.sources.length+' 段回忆</em></span><span class="mf-source-excerpt">'+esc(g.sources.map(s=>s.title).join('、'))+'</span></span></label>';}).join('')+'</div>';
    return header('选择岁月片段')+'<div class="body mf-body mf-direction-page"><span class="mf-eyebrow">岁月片段</span><h1>想讲哪一段岁月？</h1>'+selection+'<p class="mf-range-default">'+rangeSummary()+'</p></div>'+footer('<button class="mf-primary" id="film-create" data-mf="create" '+(!picked.length?'disabled':'')+'>为我写故事 '+svg('arrow')+'</button>');
  }
  function filmSourcePool(p){
    const all=p.uploaded?[]:core.availableSources(sources());
    return [...(p.selectionPool||[]),...p.sources,...all].filter((item,i,a)=>a.findIndex(x=>x.id===item.id)===i);
  }
  function storySnapshot(p){const snapshot=clone(p);delete snapshot.regenerationHistory;delete snapshot.editorDraft;delete snapshot.passageDrafts;return snapshot;}
  function storyHistory(p){
    const history=p.regenerationHistory||[],item=history[historyIndex];if(!item)return header('原稿记录')+'<div class="body mf-body">暂无原稿记录</div>';
    const when=new Date(item.at),date=isNaN(when.getTime())?'':when.toLocaleString('zh-CN');
    return header('原稿记录')+'<div class="body mf-body mf-history"><label for="mf-history-version">选择原稿</label><select id="mf-history-version">'+history.map((h,i)=>'<option value="'+i+'" '+(i===historyIndex?'selected':'')+'>第 '+esc(h.revision)+' 版 · '+esc(new Date(h.at).toLocaleString('zh-CN'))+'</option>').join('')+'</select><h1>'+esc(item.title)+'</h1><p>'+esc(date)+'</p><div class="mf-history-text">'+esc(item.story)+'</div>'+(item.snapshot?'':'<p>此旧记录仅保留正文，无法完整恢复选材。</p>')+'</div>'+footer('<button class="mf-primary" data-mf="restore-story-history" '+(!item.snapshot?'disabled':'')+'>恢复这份原稿</button>');
  }
  function story(p){
    const scenes=core.reviewScenes(p),draft=p.editorDraft||{title:p.title,passages:scenes.map((sc,i)=>p.passageDrafts?.[i]??sc.narration)},active=Math.min(p.storyPage||0,scenes.length-1);
    return header('确认故事')+'<div class="body mf-body mf-story-overview">'+phases(0)+'<div class="mf-manuscript"><span class="mf-eyebrow">'+esc(p.scopeName||'人生纪事')+' · 故事稿</span><h1>'+esc(draft.title)+'</h1><p>'+scenes.length+' 节故事 <span>·</span> '+(p.uploaded?'本人上传':p.sources.length+' 张回忆卡')+'</p></div>'+(p.sourcePending?'<div class="mf-warning">原文有更新。<button class="mf-text-link" data-mf="refresh-sources">重新整理故事 ›</button></div>':'')+(p.editorDraft?'<div class="mf-warning">故事有未保存的修改，请进入阅读页保存。</div>':'')+'<div class="mf-source-entry"><div class="mf-source-entry-info"><span class="mf-source-entry-icon">'+svg('source')+'</span><span><b>故事选材</b><small>已选 '+p.sources.length+' 张故事卡</small></span></div><button data-mf="select-story-cards">调整 ›</button></div>'+((p.regenerationHistory||[]).length?'<button class="mf-text-link mf-history-entry" data-mf="story-history">查看原稿记录 ›</button>':'')+'<button class="mf-reading-entry" data-mf="read-story"><span class="mf-reading-kicker">故事正文 · '+scenes.length+' 节</span><h3>阅读和调整故事</h3><p>'+esc(scenes[0]?.narration.slice(0,65)||'')+'…</p><b>阅读故事 '+svg('arrow')+'</b></button>'+badge(p)+'</div>'+footer('<button class="mf-primary" id="film-approve" data-mf="approve" '+(!canConfirm(p)?'disabled':'')+'>故事没问题，继续</button>');
  }
  function storyContents(p){
    const scenes=core.reviewScenes(p);
    return '<div class="mf-toc-overlay"><button type="button" class="mf-toc-mask" data-mf="close-story-toc" aria-label="关闭故事目录"></button><aside class="mf-toc-drawer" role="dialog" aria-modal="true" aria-labelledby="mf-toc-title"><div class="mf-toc-head"><h2 id="mf-toc-title">故事目录</h2><button type="button" data-mf="close-story-toc" aria-label="关闭故事目录">×</button></div><div class="mf-toc">'+scenes.map((sc,i)=>'<button data-mf="read-story" data-index="'+i+'" '+(i===(p.storyPage||0)?'aria-current="page"':'')+'><span>'+String(i+1).padStart(2,'0')+'</span><b>'+esc(p.editorDraft?.titles?.[i]??sc.title)+'</b><i>›</i></button>').join('')+'</div></aside></div>';
  }
  function storyReader(p){
    const scenes=core.reviewScenes(p),draft=p.editorDraft,chapters=scenes.map((scene,i)=>{const photos=(p.photoPlan||[]).filter(photo=>photo.status!=='unsuitable'&&(scene.sourceIds||[]).includes(photo.sourceId));const text=draft?.passages?.[i]??scene.narration;const content=novelEditing?'<label class="mf-novel-edit-label" for="mf-inline-story-'+i+'">本节正文</label><textarea class="mf-novel-edit" id="mf-inline-story-'+i+'" data-inline-story="'+i+'" rows="8">'+esc(text)+'</textarea>':'<div class="mf-novel-text">'+text.split(/\n+/).filter(Boolean).map(paragraph=>'<p>'+esc(paragraph)+'</p>').join('')+'</div>';const chapterTitle=draft?.titles?.[i]??scene.title;const heading=novelEditing?'<label class="mf-novel-edit-label" for="mf-chapter-title-'+i+'">章节标题</label><input class="mf-novel-title-edit" id="mf-chapter-title-'+i+'" data-chapter-title="'+i+'" maxlength="80" value="'+esc(chapterTitle)+'">':'<h2>'+esc(chapterTitle)+'</h2>';return '<article class="mf-novel-chapter" id="mf-novel-'+i+'"><div class="mf-novel-number">第 '+(i+1)+' 节</div>'+heading+photos.map(photo=>'<figure class="mf-inline-photo">'+storyPhoto(photo)+'<figcaption>故事中的照片</figcaption></figure>').join('')+content+'</article>';}).join('');
    const action=novelEditing?'<button class="mf-primary" data-mf="save-inline-story" '+(!draft?'disabled':'')+'>保存修改</button>':'<button class="mf-primary" data-mf="edit-novel">编辑故事</button>';
    return header('阅读故事')+'<div class="mf-novel-toolbar"><button data-mf="story-toc">目录</button></div><div class="body mf-body mf-novel-reader"><div class="mf-novel-cover"><span>人生故事</span>'+(novelEditing?'<label class="mf-novel-edit-label" for="mf-inline-title">故事书名</label><textarea id="mf-inline-title" class="mf-novel-book-edit" maxlength="80" rows="2">'+esc(draft?.title??p.title)+'</textarea>':'<h1>'+esc(draft?.title||p.title)+'</h1>')+'<p>'+scenes.length+' 节故事</p></div>'+chapters+'</div>'+footer('<div class="mf-novel-actions"><button class="mf-secondary" data-mf="story-overview">返回确认</button>'+action+'</div>');
  }
  function adjust(p){
    const scenes=core.reviewScenes(p),draft=p.editorDraft||{title:p.title,passages:scenes.map((s,i)=>p.passageDrafts?.[i]??s.narration)};
    editIndex=Math.min(editIndex,scenes.length-1);
    return header('调整故事')+'<div class="body mf-body"><h1 class="mf-work-title">调整故事</h1><p class="mf-step-intro">修改故事文字，或重选故事卡后重新整理。</p><button class="mf-secondary mf-edit-source-entry" data-mf="select-story-cards">选择故事卡，重新编写 ›</button><label class="mf-field-label" for="film-edit-title">故事标题</label><input id="film-edit-title" class="mf-title-input" maxlength="40" value="'+esc(draft.title)+'"><label class="mf-field-label" for="film-edit-section">要调整的片段</label><select id="film-edit-section">'+scenes.map((s,i)=>'<option value="'+i+'" '+(i===editIndex?'selected':'')+'>'+String(i+1).padStart(2,'0')+' '+esc(s.title)+'</option>').join('')+'</select><label class="mf-field-label" for="film-edit-text">故事正文</label><textarea id="film-edit-text">'+esc(draft.passages[editIndex])+'</textarea>'+(p.revisionRequest?.text?'<p class="mf-muted">之前的修改意见：'+esc(p.revisionRequest.text)+'</p>':'')+'</div>'+footer('<div class="mf-preview-actions"><button class="mf-secondary" data-mf="cancel-adjust">取消调整</button><button class="mf-primary" data-mf="save-adjust">保存并预览</button></div>');
  }
  function captureAdjustment(){
    const p=project(),scenes=core.reviewScenes(p),draft=clone(p.editorDraft||{title:p.title,passages:scenes.map((s,i)=>p.passageDrafts?.[i]??s.narration)});
    draft.title=$('#film-edit-title').value;draft.passages[editIndex]=$('#film-edit-text').value;
    if($('#film-edit-action')){draft.directions=draft.directions||clone(p.screenplayDraft.scenes);draft.directions[editIndex]={...draft.directions[editIndex],setting:$('#film-edit-setting').value,action:$('#film-edit-action').value};}
    return storeProject({...p,editorDraft:draft},true);
  }

  const storyFilePick=document.createElement('input');storyFilePick.type='file';storyFilePick.accept='.txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';storyFilePick.hidden=true;document.body.appendChild(storyFilePick);
  storyFilePick.addEventListener('change',async()=>{const file=storyFilePick.files[0];if(file)await readStoryFile(file);storyFilePick.value='';});
  function loadStoryLibrary(src,globalName){return new Promise((resolve,reject)=>{if(window[globalName])return resolve(window[globalName]);const script=document.createElement('script');script.src=src;script.onload=()=>resolve(window[globalName]);script.onerror=()=>reject(Error('读取组件加载失败，请检查本地服务后重试。'));document.head.appendChild(script);});}
  async function readStoryFile(file){
    try{
      if(!/\.(txt|docx|pdf)$/i.test(file.name))throw Error('请选择 TXT、DOCX 或 PDF 文件；旧版 DOC 请先另存为 DOCX。');
      if(file.size>10*1024*1024)throw Error('请选择 10MB 以内的文件。');
      notify('正在读取故事，请稍候。');let text='';
      if(/\.txt$/i.test(file.name)){text=await file.text();if(text.includes('\uFFFD'))throw Error('TXT 编码无法识别，请保存为 UTF-8 后重试。');}
      else if(/\.docx$/i.test(file.name)){const mammoth=await loadStoryLibrary('v17/vendor/mammoth/mammoth.browser.min.js','mammoth');text=(await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;}
      else {const pdfjs=await loadStoryLibrary('v17/vendor/pdfjs/pdf.min.js','pdfjsLib');pdfjs.GlobalWorkerOptions.workerSrc='v17/vendor/pdfjs/pdf.worker.min.js';const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,cMapUrl:'v17/vendor/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'v17/vendor/pdfjs/standard_fonts/'}).promise;const pages=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i),content=await page.getTextContent();pages.push(content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim());}text=pages.join('\n\n');await pdf.destroy();}
      text=text.replace(/^\uFEFF/,'').trim();if(!text)throw Error('没有读取到文字。扫描件或图片型 PDF 请先识别文字后再上传。');
      if(text.length>500000)throw Error('故事正文过长，请拆分为 50 万字以内的文件。');
      uploadedStory={title:file.name.replace(/\.(txt|docx|pdf)$/i,''),text};view='upload-story';render();notify('故事已读取，请核对正文。');
    }catch(error){notify(error.message||'文件读取失败，请检查文件格式后重试。');}
  }
  function uploadStory(){
    return header('上传自己的故事')+'<div class="body mf-body mf-direction-page mf-upload-story"><span class="mf-eyebrow">自己的故事</span><h1>把故事交给时光</h1><p class="mf-step-intro">请核对文件中提取的故事正文，然后补充人物照片。</p><label for="film-upload-title">故事标题</label><input id="film-upload-title" type="text" maxlength="100" placeholder="给故事起个名字" value="'+esc(uploadedStory.title)+'"><label for="film-upload-file" class="mf-upload-file">重新选择文件<input id="film-upload-file" type="file" accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label><label for="film-upload-text">故事正文</label><textarea id="film-upload-text" placeholder="在这里粘贴或输入您的故事">'+esc(uploadedStory.text)+'</textarea><p class="mf-step-hint">故事保存在本机浏览器。影片生成服务尚未接入，暂不能生成视频。</p></div>'+footer('<button class="mf-primary" data-mf="create-upload">核对故事 '+svg('arrow')+'</button>');
  }
  function storyPeople(p){
    const definitions=[['父亲','父亲',/父亲|爸爸|我爸(?!妈)/],['母亲','母亲',/母亲|妈妈|我妈/],['小芬','小芬 · 妻子',/小芬/],['妹妹','妹妹',/妹妹/],['女儿','女儿',/(?<!他|她)女儿(?:学设计|喜欢艺术|选产品设计|喜欢画画)|我(?:的)?女儿/],['儿子','儿子',/儿子(?:学建筑|喜欢电脑|选建筑)|我(?:的)?儿子/],['奶奶','奶奶',/我(?:的)?奶奶/],['俞师傅','俞师傅',/我的师傅姓俞|俞师傅/]];
    const scenes=core.reviewScenes(p);
    const people=[{id:'我',name:p.caseId?'蒋老师 · 主人公':'我 · 主人公',sections:scenes.map(sc=>sc.title),evidence:p.uploaded?'请核对故事中的主人公':'故事的第一人称讲述者'}];
    for(const [id,name,pattern] of definitions){
      const matches=scenes.filter(sc=>pattern.test(sc.narration));if(!matches.length)continue;
      const evidence=matches.flatMap(sc=>sc.narration.split(/[。！？\n]/)).find(t=>pattern.test(t))||'';
      people.push({id,name,sections:matches.map(sc=>sc.title),evidence});
    }
    return people;
  }
  function filmRoles(p){return storyPeople(p).map(person=>person.id);}
  function people(p){
    const persons=storyPeople(p),current=persons.find(person=>person.id===p.visualRole)||persons[0],role=current.id,photo=p.characterPhotos?.[role],item=p.characterGeneration?.items?.[role],ready=characterImageReady(p,role),allReady=allCharacterImagesReady(p);
    const readyCount=persons.filter(person=>characterImageReady(p,person.id)).length;
    const label=person=>characterImageReady(p,person.id)?'已生成':p.characterGeneration?.revision===p.revision&&p.characterGeneration.items?.[person.id]?.status==='not_connected'?'未接入':'待生成';
    const cards='<div class="mf-people-summary"><span>'+persons.length+' 位故事人物</span><span>已生成 '+readyCount+' / '+persons.length+'</span></div><div class="mf-character-picker" aria-label="选择故事人物">'+persons.map(person=>'<button type="button" data-mf="select-person" data-role="'+esc(person.id)+'" aria-pressed="'+(person.id===role)+'"><b>'+esc(person.id==='我'?(p.caseId?'蒋老师':'我'):person.id)+'</b><small>'+label(person)+'</small></button>').join('')+'</div>';
    const image=ready?'<figure class="mf-person-result"><img src="'+esc(item.imageUrl)+'" alt="'+esc(current.name)+'的人物形象"><figcaption>'+(item.simulated?'人物形象示例 · 原型模拟生成':photo?'根据参考照片生成':'根据故事生成的示意形象')+'</figcaption></figure>':'<div class="mf-person-pending"><b>'+(item?.status==='not_connected'?'形象生成服务尚未接入':'人物形象待生成')+'</b><span>'+(photo?'将参考这张照片':'没有照片时，将根据故事生成示意形象')+'</span></div>';
    return header('故事中的人物')+'<div class="body mf-body mf-mobile-step mf-people-page">'+phases(1)+'<h1>故事里的重要人物</h1>'+cards+'<article class="mf-person-choice"><h2>'+esc(current.name)+'</h2>'+image+(photo?'<img class="mf-board-photo" src="'+esc(photoUrl(photo))+'" alt="'+esc(current.name)+'的参考照片">':'')+'<label class="mf-upload-photo">'+(photo?'更换此人物照片':'添加此人物照片')+'<input type="file" accept="image/jpeg,image/png,image/webp" data-character-photo="'+esc(role)+'"></label></article></div>'+footer('<div class="mf-person-actions"><button class="mf-secondary" data-mf="generate-characters" '+(allReady?'disabled':'')+'>生成人物形象</button><button class="mf-primary" data-mf="confirm-protagonist" '+(!allReady?'disabled':'')+'>生成影片预览</button></div>');
  }
  // The prototype persists a blocked request; a service must supply actual generated results.
  function preparePreview(p){
    let next=clone(p);if(!next.screenplay)next=core.buildScreenplay(next);
    const old=next.previewJob;
    const identity=JSON.stringify([next.revision,next.protagonistApproval.people]);
    next.previewJob={id:old?.identity===identity?old.id:'preview-'+Date.now(),identity,revision:next.revision,status:'not_connected',
      scriptStatus:'local_draft',items:next.screenplay.scenes.map(sc=>{
        const key=JSON.stringify([identity,sc.id,sc.narration,sc.action,next.sceneRequests?.[sc.id]?.text||'',chapterShots(next,sc).map(shot=>[shot.id,next.shotAssets?.[shot.id]||null])]);
        const previous=old?.items?.find(item=>item.key===key);
        return previous||{sceneId:sc.id,key,status:'not_connected',attempt:0};
      })};
    next.visualStep='preview';return next;
  }
  function generationPage(p,film=false){
    const job=film?p.filmJob:p.previewJob,status=job?.status||'not_connected',failed=status==='failed',ready=status==='ready',blocked=status==='not_connected';
    const local=job?.scope==='segment',name=film?'影片制作':local?'更新这一段':'生成影片预览';
    const total=job?.items?.length||p.screenplay?.scenes.length||0,done=job?.items?.filter(x=>x.status==='ready').length||0;
    const title=ready?(film?'影片已准备好':'预览已准备好'):failed?'这次生成未完成':blocked?'内容已保存':film?'正在制作您的影片':local?'正在更新这一段':'正在准备影片预览';
    const note=blocked?'当前原型暂不支持生成影像，故事和修改已保存在本机。':failed?'已完成的内容会保留，可以重试未完成部分。':'这需要一些时间。您可以先离开，稍后从“我的微电影”回来查看。';
    return header(name)+'<div class="body mf-body mf-job-page">'+phases(film?3:2)+'<div class="mf-job-emblem">'+svg('film')+'</div><span class="mf-eyebrow">'+esc(p.title)+'</span><h1>'+title+'</h1><p class="mf-job-description">'+note+'</p><ol class="mf-job-stages"><li><span>01</span><div><b>'+(film?'准备影片素材':'整理讲述与画面内容')+'</b><small>'+(blocked?'文字内容已保留':ready?'已完成':'按已确认的故事和人物准备')+'</small></div></li><li><span>02</span><div><b>'+(film?'生成视频并合成声音':'逐段生成预览画面')+'</b><small>'+(blocked?'尚未开始':done+' / '+total+' 段已完成')+'</small></div></li><li><span>03</span><div><b>'+(film?'保存影片':'查看预览与调整')+'</b><small>'+(ready?'可以查看':blocked?(film?'尚未开始':'可查看已保存内容'):'完成后可在这里查看')+'</small></div></li></ol>'+(local?'<p class="mf-job-assurance">本次调整已保存，其他内容保留。</p>':'')+''+(failed?'<p class="mf-muted">暂不能重试，您可以先查看已保存的内容。</p>':'')+'</div>'+footer(blocked&&!film?'<button class="mf-primary" data-mf="open-preview">查看已保存的内容 '+svg('arrow')+'</button>':'<button class="mf-primary" data-mf="home">先离开，回我的微电影</button><button class="mf-job-secondary" data-mf="'+(film?'back-board':'open-preview')+'">'+(ready?'查看结果':film?'返回预览与调整':'查看已保存的内容')+'</button>');
  }
  function chapterShotMode(p,scene){return p.shotSplitModes?.[scene.id]||(Object.keys(p.shotAssets||{}).some(id=>id.startsWith(scene.id+'-'))||!!p.visualApproval||p.previewJob?.items?.some(item=>item.sceneId===scene.id&&item.status==='ready')?'legacy':'paragraph');}
  function chapterShots(p,scene){return core.previewShots(scene,window.YunyiJiangGeneratedStory?.chapters.flatMap(ch=>ch.paragraphs)||[],{legacy:chapterShotMode(p,scene)==='legacy'});}
  function migrateLegacyShotChapter(p,scene){
    if(chapterShotMode(p,scene)!=='legacy'||p.visualApproval||p.previewJob?.items?.some(item=>item.sceneId===scene.id&&item.status==='ready'))return null;
    const refs=window.YunyiJiangGeneratedStory?.chapters.flatMap(ch=>ch.paragraphs)||[],old=core.previewShots(scene,refs,{legacy:true}),fresh=core.previewShots(scene,refs),keys=Object.keys(p.shotAssets||{}).filter(id=>id.startsWith(scene.id+'-'));
    if(!keys.length||keys.some(id=>!old.some(shot=>shot.id===id))||old.map(x=>x.narration).join('')!==fresh.map(x=>x.narration).join(''))return null;
    const ranged=shots=>{let at=0;return shots.map(shot=>{const start=at;at+=shot.narration.length;return {...shot,start,end:at};});};
    const oldRanges=ranged(old),newRanges=ranged(fresh),next=clone(p),previous=Object.fromEntries(keys.map(id=>[id,clone(p.shotAssets[id])]));
    next.shotSplitBackup={...(next.shotSplitBackup||{}),[scene.id]:{mode:'legacy',assets:previous}};
    for(const id of keys)delete next.shotAssets[id];
    for(const target of newRanges){const contributors=oldRanges.filter(x=>x.start<target.end&&target.start<x.end&&previous[x.id]);if(!contributors.length)continue;const records=contributors.map(x=>previous[x.id]);const photos=records.flatMap(x=>x.photos||[]).filter((photo,i,a)=>a.findIndex(x=>x.url===photo.url)===i);const requests=[...new Set(records.map(x=>x.request?.trim()).filter(Boolean))];const excludedUrls=[...new Set(records.flatMap(x=>x.excludedUrls||[]))];next.shotAssets[target.id]={...(photos.length?{photos}:{}),...(requests.length?{request:requests.join('\n\n')}:{}),...(excludedUrls.length?{excludedUrls}:{})};}
    next.shotSplitModes={...(next.shotSplitModes||{}),[scene.id]:'paragraph'};
    const previousSelection=oldRanges.find(x=>x.id===p.visualShot);if(previousSelection){const mapped=newRanges.find(x=>x.start<previousSelection.end&&previousSelection.start<x.end);if(mapped)next.visualShot=mapped.id;}
    const oldStep=next.visualStep,oldScope=next.previewJob?.scope,oldTarget=next.previewJob?.targetShotId,prepared=preparePreview(next);prepared.visualStep=oldStep;if(oldScope)prepared.previewJob.scope=oldScope;if(oldTarget)prepared.previewJob.targetShotId=prepared.visualShot||oldTarget;return prepared;
  }
  function shotAssets(p,shot){
    const original=(p.photoPlan||[]).filter(photo=>photo.status!=='unsuitable'&&shot.sourceIds.includes(photo.sourceId)&&!(p.shotAssets?.[shot.id]?.excludedUrls||[]).includes(photo.url));
    return [...original,...(p.shotAssets?.[shot.id]?.photos||[])].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
  }
  function previewContents(p){
    const scenes=p.screenplay.scenes,scene=scenes[directoryChapter]||scenes[0],shots=scene?chapterShots(p,scene):[];
    return header('选择章节与片段')+'<div class="body mf-body mf-card-selection mf-shot-directory"><div class="mf-card-selection-head"><h1>选择章节与片段</h1><p id="film-card-count">共 '+scenes.length+' 章</p></div><div class="mf-card-columns"><nav class="mf-chapter-list" aria-label="章节">'+scenes.map((sc,i)=>'<button type="button" data-mf="preview-chapter" data-index="'+i+'" '+(i===directoryChapter?'aria-current="true"':'')+'><span>'+esc(sc.title)+'</span><small>第 '+(i+1)+' 章</small></button>').join('')+'</nav><section class="mf-card-results" aria-label="片段"><div class="mf-card-results-title"><b>'+esc(scene?.title||'片段')+'</b><span>'+shots.length+' 段</span></div><div class="mf-shot-list">'+shots.map((shot,j)=>'<button class="mf-shot-option" data-mf="select-shot" data-chapter="'+directoryChapter+'" data-shot="'+esc(shot.id)+'"><span>片段 '+String(j+1).padStart(2,'0')+'</span><b>'+esc(shot.narration.trim().slice(0,65))+'…</b><small>'+shotAssets(p,shot).length+' 张参考素材 · 画面待生成</small><i>›</i></button>').join('')+'</div></section></div></div>';
  }
  function production(p){
    const scenes=p.screenplay.scenes,i=Math.min(p.visualIndex||0,scenes.length-1),scene=scenes[i],shots=chapterShots(p,scene);
    const nav='<div class="mf-script-nav"><button class="mf-chapter-prev" data-mf="frame-prev" '+(!i?'disabled':'')+'>‹ 上一章</button><button class="mf-directory-entry" data-mf="preview-toc" aria-label="选择章节和片段，当前第 '+(i+1)+' 章"><b>第 '+(i+1)+' / '+scenes.length+' 章</b><span>选择章节 ▾</span></button><button class="mf-chapter-next" data-mf="frame-next" '+(i===scenes.length-1?'disabled':'')+'>下一章 ›</button></div>';
    const cards=shots.map((shot,j)=>{const assets=shotAssets(p,shot),request=p.shotAssets?.[shot.id]?.request;return '<article class="mf-script-shot" id="film-shot-'+esc(shot.id)+'"><div class="mf-shot-heading"><h2>片段 '+String(j+1).padStart(2,'0')+'</h2><span>'+assets.length+' 张参考素材</span></div><div class="mf-shot-pending">'+svg('film')+'<span>预览画面尚未生成</span></div><h3 class="mf-narration-label">讲述</h3><p class="mf-shot-narration">'+esc(shot.narration)+'</p><div class="mf-linked-assets"><div class="mf-asset-heading"><h3>参考素材</h3><button data-mf="shot-assets" data-shot="'+esc(shot.id)+'">选择 / 调整</button></div>'+(assets.length?'<div class="mf-asset-grid">'+assets.map(photo=>'<figure><img src="'+esc(photoUrl(photo))+'" alt="'+esc(photo.name||'本段参考素材')+'" loading="lazy"><figcaption>参考素材 · '+esc(photo.name||'照片')+'</figcaption></figure>').join(''):'<p class="mf-no-linked-assets">尚未关联参考素材</p>')+''+(request?'<p class="mf-shot-request">画面要求：'+esc(request)+'</p>':'')+'</div></article>';}).join('');
    return header('预览与调整')+'<div class="mf-script-top">'+phases(2)+nav+'</div><div class="body mf-body mf-script-reader"><div class="mf-chapter-heading"><h1>'+esc(scene.title)+'</h1></div><section class="mf-chapter-direction"><div class="mf-direction-heading"><h2>本章场景与画面安排</h2><button class="mf-text-link" data-mf="edit-scene" data-index="'+i+'">调整 ›</button></div><p>'+esc(scene.setting)+'</p><p>'+esc(scene.action)+'</p></section>'+cards+'</div>'+footer('<button class="mf-primary" data-mf="confirm-demo-assets">满意，制作影片</button>');
  }
  function shotAssetEditor(p){
    const scene=p.screenplay.scenes[p.visualIndex||0],shot=chapterShots(p,scene).find(x=>x.id===activeShotId);if(!shot)return header('片段已变化')+'<div class="body mf-body">原讲述已调整，请返回重新选择片段。</div>';
    const chosen=new Set((p.shotAssets?.[shot.id]?.photos||[]).map(x=>x.url)),original=shotAssets({...p,shotAssets:{}},shot);
    const pool=[...(p.photoPlan||[]).filter(x=>x.status!=='unsuitable'),...Object.values(p.characterPhotos||{}),...Object.values(p.shotAssets||{}).flatMap(x=>x.photos||[])].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);
    return header('调整这段画面')+'<div class="body mf-body mf-shot-editor"><div class="mf-shot-context"><span>这段讲述</span><p class="mf-shot-narration">'+esc(shot.narration)+'</p></div><label class="mf-shot-question" for="film-shot-request">想让画面怎么变化？</label><textarea id="film-shot-request" placeholder="例如：老房子前，家人一起散步">'+esc(p.shotAssets?.[shot.id]?.request||'')+'</textarea><details class="mf-shot-photos" '+(shotPhotosOpen?'open':'')+'><summary><span><b>添加参考照片</b><small id="mf-shot-photo-count">已选 '+shotAssets(p,shot).length+' 张 · 可选</small></span><i>⌄</i></summary><div class="mf-asset-choices">'+pool.map((photo,j)=>{const linked=original.some(x=>x.url===photo.url);return '<label><input type="checkbox" data-shot-pick="'+j+'" '+((linked&&!(p.shotAssets?.[shot.id]?.excludedUrls||[]).includes(photo.url))||chosen.has(photo.url)?'checked':'')+'><img src="'+esc(photoUrl(photo))+'" alt="'+esc(photo.name||'参考照片')+'"><span>'+esc(photo.name||'人物照片')+'</span></label>';}).join('')+'</div><label class="mf-upload-photo">＋ 添加照片<input type="file" accept="image/jpeg,image/png,image/webp" data-shot-photo="'+esc(shot.id)+'"></label></details></div>'+footer('<button class="mf-primary" data-mf="submit-shot">保存调整</button>');
  }
  function shotPool(p){return [...(p.photoPlan||[]).filter(x=>x.status!=='unsuitable'),...Object.values(p.characterPhotos||{}),...Object.values(p.shotAssets||{}).flatMap(x=>x.photos||[])].filter((x,i,a)=>a.findIndex(y=>y.url===x.url)===i);}
  function saveShotAssets(change){const p=clone(project()),scene=p.screenplay.scenes[p.visualIndex||0],mode=chapterShotMode(p,scene);p.shotSplitModes={...(p.shotSplitModes||{}),[scene.id]:mode};p.shotAssets={...(p.shotAssets||{}),[activeShotId]:{...(p.shotAssets?.[activeShotId]||{}),...change}};delete p.visualApproval;return storeProject(preparePreview(p),true);}
  function narrationEdit(p){
    const sc=p.screenplay.scenes[p.visualIndex||0];
    return header('改讲述')+'<div class="body mf-body"><h1>'+esc(sc.title)+'</h1><p class="mf-step-intro">把这段话改成您想表达的样子。保存后，仅本段画面需要重新准备。</p><label class="mf-field-label" for="film-narration-text">这段怎么说</label><textarea id="film-narration-text" class="mf-script-edit">'+esc(p.narrationDrafts?.[sc.id]??sc.narration)+'</textarea><p class="mf-muted">完整故事稿保留，其他段落不变。</p></div>'+footer('<div class="mf-preview-actions"><button class="mf-secondary" data-mf="cancel-narration">取消</button><button class="mf-primary" data-mf="save-narration">保存并更新本段</button></div>');
  }
  function sceneEdit(p){
    const scene=p.screenplay.scenes[sceneIndex];
    const photos=(p.photoPlan||[]).filter(photo=>(scene.sourceIds||[]).includes(photo.sourceId)&&photo.status!=='unsuitable');
    return header('调整本章画面')+'<div class="body mf-body mf-scene-editor"><label class="mf-scene-question" for="film-scene-request">希望画面怎么变化？</label><textarea id="film-scene-request" placeholder="例如：院子再小一点，人物穿着更朴素。">'+esc(p.sceneRequests?.[scene.id]?.text||'')+'</textarea><section class="mf-scene-photos"><div class="mf-scene-photos-heading"><b>补充参考照片</b><small>已有 '+photos.length+' 张 · 可选</small></div>'+photos.slice(-1).map(photo=>'<figure>'+storyPhoto(photo)+'<figcaption>'+(photo.illustration?'示例配图':'您的参考照片')+'</figcaption></figure>').join('')+'<label class="mf-upload-photo">＋ 添加照片<input type="file" accept="image/jpeg,image/png,image/webp" data-scene-photo="'+sceneIndex+'"></label></section></div>'+footer('<div class="mf-preview-actions"><button class="mf-secondary" data-mf="close-scene">返回</button><button class="mf-primary" data-mf="save-scene-request">保存调整</button></div>');
  }

  function splitReview(p){return production(p);}
  function splitting(){return production(project());}
  let personRole='';

  function personViews(p){
    const photo=p.characterPhotos?.[personRole];
    const original=photo?'<section class="mf-person-photo"><h2>'+esc(personRole)+' · 上传的照片</h2><img class="mf-board-photo" src="'+esc(photoUrl(photo))+'" alt="上传的原照片"><p class="mf-muted">您的照片；下方多角度图为独立示例。</p></section>':referenceArt('person','mf-person-main');
    return header('人物形象')+'<div class="body mf-body mf-board-workspace mf-person-page"><div class="mf-person-intro"><h1>人物形象</h1><p>为微电影确定主要人物的形象参考</p></div>'+original+'<section class="mf-board-section"><h2>多角度参考</h2><div class="mf-person-example">'+['front','side','back'].map((v,i)=>'<figure>'+referenceArt(v)+'<figcaption>'+['正面','侧面','背面'][i]+'</figcaption></figure>').join('')+'</div></section><p class="mf-warning">人物形象参考示例，并非由上传照片生成；三视图服务尚未接入。</p>'+(photo?'<button class="mf-text-link" data-mf="generate-person">生成人物三视图 ›</button>':'')+'</div>'+footer('<button class="mf-primary" data-mf="confirm-person-demo">'+(photo?'确认照片，返回素材':'返回制作素材')+'</button>');
  }
  function reviewAssets(p){return production(p);}

  function videoDemo(){return generationPage(project(),true);}

  function filmPreview(p){
    return header('影片预览')+'<div class="body mf-body mf-final-preview">'+phases(3)+'<div class="mf-final-heading"><span>光影留住时光</span><h1>'+esc(p.title)+'</h1><p>一段珍贵的故事，一部属于自己的电影</p></div><div class="mf-final-player"><video controls playsinline preload="metadata" poster="v17/assets/film-family-illustration.png" src="v17/assets/film-demo-preview.mp4" aria-label="微电影示例视频"></video><span class="mf-final-badge">示例影片</span></div></div>'+footer('<button class="mf-secondary" data-mf="back-board">返回预览与调整</button>');
  }

  function filmShots(p){
    const cards=p.screenplay.scenes.map((scene,i)=>'<button class="mf-section-row" data-mf="edit-film-scene" data-index="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><span><b>'+esc(scene.title)+'</b><small>'+esc(scene.narration)+'</small></span><span>›</span></button>').join('');
    return header('改一改影片')+'<div class="body mf-body mf-sections"><h1>哪段故事想改一改？</h1><p>先选一段，再告诉我们哪里不满意。</p>'+cards+'<p class="mf-muted">当前为故事段落预览，影片生成与片段重制尚未接入。</p></div>'+footer('<button class="mf-primary" data-mf="show-film-preview">返回影片预览</button>');
  }


  function storyCards(p){
    const pool=filmSourcePool(p).map(window.YunyiMemoirCatalog.normalize),groups=groupFilmSources(pool,'chapter');
    if(!groups.some(g=>g.id===cardGroup))cardGroup=groups[0]?.id||'';
    const group=groups.find(g=>g.id===cardGroup),set=cardSelection||new Set(p.sources.map(s=>s.id));
    return header('调整故事卡')+'<div class="body mf-body mf-card-selection"><div class="mf-card-selection-head"><h1>哪些故事放进影片？</h1><p id="film-card-count">已选 '+set.size+' / '+pool.length+' 张</p></div><div class="mf-card-columns"><nav class="mf-chapter-list" aria-label="故事章节">'+groups.map(g=>'<button type="button" data-mf="card-chapter" data-group="'+esc(g.id)+'" '+(g.id===cardGroup?'aria-current="true"':'')+'><span>'+esc(g.name)+'</span><small>'+g.sources.length+' 张</small></button>').join('')+'</nav><section class="mf-card-results" aria-label="故事卡"><div class="mf-card-results-title"><b>'+esc(group?.name||'故事卡')+'</b><span>'+(group?.sources.length||0)+' 张</span></div><div class="mf-card-list">'+(group?.sources||[]).map(source=>'<article class="mf-source-option"><label><input type="checkbox" data-film-card="'+esc(source.id)+'" '+(set.has(source.id)?'checked':'')+'><span><b>'+esc(source.title)+'</b><small>'+esc(source.text.slice(0,68))+'…</small></span></label></article>').join('')+'</div></section></div></div>'+footer('<div class="mf-preview-actions"><button class="mf-secondary" data-mf="cancel-card-selection">取消</button><button class="mf-primary" data-mf="regenerate-cards" '+(!set.size?'disabled':'')+'>按所选重新整理故事</button></div>');
  }

  function render(){
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    let p=project();if(['story','story-reader','story-toc','script','board','production','people'].includes(view)&&!p)view='home';
    if(p&&!p.uploaded&&!['home','choose','range'].includes(view)&&core.sourcesChanged(p,sources())&&!p.sourcePending){
      p={...clone(p),revision:p.revision+1,approval:null,screenplay:null,board:null,stage:'story',sourcePending:true};
      delete p.visualApproval;storeProject(p,true);if(view!=='home'&&view!=='choose')view='story';
    }
    let preparationError='';
    if(p&&['script','board','production','people','review-assets','video-demo','film-preview','film-shots','scene-edit','narration-edit','preview-wait','preview-toc','shot-assets'].includes(view)){
      if(!core.isApproved(p)||p.sourcePending)view='story';
      else if(view!=='people'&&!protagonistReady(p))view='people';
      else if(view!=='people'){
        try{
          if(!p.screenplay){p=core.buildScreenplay(p);storeProject(p,true);}
          if(p.screenplay.scenes.some(sc=>!Object.hasOwn(sc,'setting'))){p=clone(p);p.screenplay.scenes.forEach((sc,i)=>{if(!Object.hasOwn(sc,'setting'))sc.setting=p.screenplayDraft?.scenes[i]?.setting||'依据故事原文核对地点与年代';});delete p.scriptApproval;storeProject(p,true);}
          if(!p.previewJob||p.previewJob.revision!==p.revision){p=preparePreview(p);storeProject(p,true);}
          if(['production','preview-toc'].includes(view)){const sc=p.screenplay.scenes[p.visualIndex||0],migrated=sc&&migrateLegacyShotChapter(p,sc);if(migrated&&storeProject(migrated))p=migrated;}
          if(view==='script')view='production';
        }catch(e){view='story';preparationError=e.message;}
      }
    }
    root.dataset.layout='mobile-v2';root.dataset.view=view;
    const content=view==='story-history'?storyHistory(p):view==='preview-toc'?previewContents(p):view==='shot-assets'?shotAssetEditor(p):view==='story-reader'?storyReader(p):view==='story-toc'?storyContents(p):view==='preview-wait'?generationPage(p):view==='narration-edit'?narrationEdit(p):view==='story-cards'?storyCards(p):view==='people'?people(p):view==='scene-edit'?sceneEdit(p):view==='home'?home():view==='choose'?choose():view==='upload-story'?uploadStory():view==='range'?range():view==='story'?story(p):view==='adjust'?adjust(p):view==='person-views'?personViews(p):view==='review-assets'?reviewAssets(p):view==='video-demo'?videoDemo():view==='film-preview'?filmPreview(p):view==='film-shots'?filmShots(p):view==='splitting'?splitting():view==='split-review'?splitReview(p):production(p);
    root.innerHTML=content+'<div class="mf-save-bar" '+(!unsaved?'hidden':'')+'><span id="film-save-state" aria-live="polite">'+(unsaved?'尚未保存 · 请重试':'')+'</span><button id="film-retry-save" data-mf="retry-save" '+(!unsaved?'hidden':'')+'>重试保存</button></div><div id="film-notice" class="mf-notice" role="status" hidden></div>';
    if(loadError||preparationError)notify(loadError||preparationError);autoHeight();root.querySelectorAll('.mf-story-card[open] textarea,#mf-inline-title').forEach(growInlineStory);
    if(view==='production'&&p?.visualShot)document.getElementById('film-shot-'+p.visualShot)?.scrollIntoView({block:'start'});
    root.querySelectorAll('[data-partial="true"]').forEach(input=>input.indeterminate=true);
  }
  function growInlineStory(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';}
  function autoHeight(){const t=$('#film-story');if(t){t.style.height='auto';t.style.height=Math.max(240,t.scrollHeight)+'px';}}
  function updateStory(){
    const p=project();if(!p)return;
    const next=core.editStory(p,$('#film-story').value,$('#film-title').value);
    if(next.revision!==p.revision){storeProject(next,true);$('#film-approve').disabled=!canConfirm(next);const tag=$('#film .mf-document-meta');if(tag)tag.innerHTML='<span>剧本稿 · 第 '+next.revision+' 版</span><span class="mf-label">修改后待重新确认</span>';}
    try{core.reviewScenes(next).forEach((s,i)=>{const node=root.querySelectorAll('.mf-reading-scene>p')[i];if(node)node.textContent=s.narration;});root.querySelector('.mf-work-title').textContent=next.title;}catch(e){$('#film-approve').disabled=true;}
    autoHeight();
  }
  function run(action,button){
    try{
      if(action==='select-story-cards'){if(view==='adjust'&&!captureAdjustment())return;if(project().editorDraft||Object.keys(project().passageDrafts||{}).length){notify('请先保存当前故事修改，再调整选材。');return;}cardReturn=view;cardSelection=new Set(project().sources.map(s=>s.id));cardGroup='';view='story-cards';render();return;}
      if(action==='story-history'){if(project().editorDraft||Object.keys(project().passageDrafts||{}).length){notify('请先保存当前故事修改，再查看原稿。');return;}historyIndex=Math.max(0,(project().regenerationHistory||[]).length-1);view='story-history';render();return;}
      if(action==='restore-story-history'){const current=project(),item=current.regenerationHistory?.[historyIndex];if(!item?.snapshot)throw Error('该原稿缺少完整选材，暂不能恢复。');const history=[...current.regenerationHistory,{revision:current.revision,title:current.title,story:current.story,at:Date.now(),snapshot:storySnapshot(current)}];const next={...clone(item.snapshot),id:current.id,revision:current.revision+1,regenerationHistory:history,approval:null,screenplay:null,board:null,stage:'story',storyPage:0};for(const k of ['protagonistApproval','scriptApproval','visualApproval','previewJob','filmJob','editorDraft','passageDrafts'])delete next[k];if(storeProject(next)){view='story';render();notify('已恢复原稿，请重新确认故事。');}return;}
      if(action==='card-chapter'){const top=root.querySelector('.mf-chapter-list')?.scrollTop||0;cardGroup=button.dataset.group;render();root.querySelector('.mf-chapter-list').scrollTop=top;return;}
      if(action==='cancel-card-selection'){cardSelection=null;view=cardReturn;render();return;}
      if(action==='regenerate-cards'){
        const old=project(),pool=filmSourcePool(old),picked=pool.filter(s=>cardSelection?.has(s.id));
        if(!picked.length)throw Error('请至少保留一张故事卡。');
        const base={...clone(old),sources:clone(picked),selectionPool:clone(pool),revision:old.revision+1,sourcePending:false};
        const next=casePreview?casePreview.draft(base,core):core.storyPreview(core.draftScreenplay(base));
        next.duration=core.recommendDuration(core.reviewScenes(next).map(s=>({text:s.narration})));
        next.regenerationHistory=[...(old.regenerationHistory||[]),{revision:old.revision,title:old.title,story:old.story,sourceIds:old.sources.map(s=>s.id),editorDraft:old.editorDraft||null,at:Date.now(),snapshot:storySnapshot(old)}];
        for(const k of ['editorDraft','passageDrafts','visualApproval','demoAssetsConfirmed','demoPreviewSaved','revisionRequest','feedbackDraft','sceneRequests','changedIndices','previewJob','filmJob','protagonistApproval','scriptApproval','narrationDrafts'])delete next[k];
        next.visualIndex=0;next.visualStep='people';
        if(storeProject(next)){cardSelection=null;view='story';render();notify('已按所选故事卡重新整理，请重新核对故事。');}return;
      }
      if(action==='read-story'){const index=Number(button?.dataset.index||0);root.querySelector('.mf-toc-overlay')?.remove();if(view!=='story-reader'){view='story-reader';render();}const target=root.querySelector('#mf-novel-'+index);if(target&&button?.dataset.index!==undefined)target.scrollIntoView({block:'start'});return;}
      if(action==='story-toc'){if(!root.querySelector('.mf-toc-overlay')){root.insertAdjacentHTML('beforeend',storyContents(project()));root.querySelector('.mf-toc-head button').focus();}return;}
      if(action==='close-story-toc'){root.querySelector('.mf-toc-overlay')?.remove();root.querySelector('[data-mf="story-toc"]')?.focus();return;}
      if(action==='story-overview'){novelEditing=false;view='story';render();return;}
      if(action==='story-prev'||action==='story-next'){const p=project(),n=core.reviewScenes(p).length,index=Math.max(0,Math.min(n-1,(p.storyPage||0)+(action==='story-next'?1:-1)));if(storeProject({...p,storyPage:index},true))render();return;}
      if(action==='select-person'){if(storeProject({...project(),visualRole:button.dataset.role},true))render();return;}
      if(action==='generate-characters'){
        let p=clone(checkedProject());if(!core.isApproved(p))throw Error('请先确认故事。');const people=storyPeople(p),old=p.characterGeneration;
        const items=Object.fromEntries(people.map(person=>{const key=characterReferenceKey(p,person.id),previous=old?.revision===p.revision?old.items?.[person.id]:null;return [person.id,previous?.referenceKey===key&&characterImageReady(p,person.id)?previous:{referenceKey:key,mode:p.characterPhotos?.[person.id]?'photo':'story',status:'ready',simulated:true,imageUrl:'v17/assets/film-three-views-example.png'}];}));
        p.characterGeneration={revision:p.revision,items};if(storeProject(p,true)){render();notify('人物示例形象已准备好，可以继续。');}return;
      }
      if(action==='confirm-protagonist'){
        let p=clone(checkedProject());if(!core.isApproved(p))throw Error('请先确认故事。');if(!allCharacterImagesReady(p))throw Error('请先完成人物形象生成。');
        p.protagonistApproval={revision:p.revision,at:Date.now(),people:storyPeople(p).map(person=>({id:person.id,reference:p.characterPhotos?.[person.id]?.url||null}))};
        p=preparePreview(p);p.visualStep='waiting';
        if(storeProject(p,true)){view='preview-wait';render();}return;
      }
      if(action==='phase'){
        const n=Number(button.dataset.phase),p=project();
        if(view==='adjust'&&!captureAdjustment())return;
        if(n===0){view='story';render();return;}
        if(!core.isApproved(p)||!canConfirm(p)){notify('请先保存并确认故事，再进入后续步骤。');return;}
        if(n===1){view='people';render();return;}
        if(!protagonistReady(p)){notify('请先完成人物形象生成。');return;}
        if(n===2){view='production';render();return;}
        if(!p.filmJob||p.filmJob.revision!==p.revision||p.visualApproval?.revision!==p.revision){notify('请先在预览调整中确认制作影片。');return;}
        view=p.filmJob.simulated?'film-preview':'video-demo';render();return;
      }
      if(action==='preview-chapter'){const top=root.querySelector('.mf-chapter-list')?.scrollTop||0;directoryChapter=Number(button.dataset.index);render();root.querySelector('.mf-chapter-list').scrollTop=top;return;}
      if(action==='preview-toc'){directoryChapter=project().visualIndex||0;view='preview-toc';render();return;}
      if(action==='select-shot'){if(!storeProject({...project(),visualIndex:Number(button.dataset.chapter),visualShot:button.dataset.shot},true))return;view='production';render();document.getElementById('film-shot-'+button.dataset.shot)?.scrollIntoView({block:'start'});return;}
      if(action==='shot-assets'){shotPhotosOpen=false;activeShotId=button.dataset.shot;shotOriginal=JSON.stringify(project().shotAssets?.[activeShotId]||{});if(!storeProject({...project(),visualShot:activeShotId},true))return;view='shot-assets';render();return;}
      if(action==='submit-shot'){const p=clone(project()),changed=JSON.stringify(p.shotAssets?.[activeShotId]||{})!==shotOriginal;if(!changed){run('back-shot');return;}p.visualStep='waiting';p.previewJob.scope='segment';p.previewJob.targetShotId=activeShotId;if(storeProject(p,true)){view='preview-wait';render();}return;}
      if(action==='back-shot'){view='production';render();document.getElementById('film-shot-'+activeShotId)?.scrollIntoView({block:'start'});return;}
      if(action==='listen-narration'){
        if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){notify('当前浏览器不支持试听，请阅读下方文字。');return;}
        if(window.speechSynthesis.speaking){window.speechSynthesis.cancel();button.textContent='试听';return;}
        const utterance=new SpeechSynthesisUtterance(project().screenplay.scenes[project().visualIndex||0].narration);utterance.lang='zh-CN';utterance.rate=.9;
        utterance.onend=()=>button.textContent='试听';utterance.onerror=()=>{button.textContent='试听';notify('试听未能播放，可继续查看文字。');};button.textContent='停止试听';window.speechSynthesis.speak(utterance);return;
      }
      if(action==='edit-narration'){view='narration-edit';render();return;}
      if(action==='cancel-narration'){const p=clone(project()),sc=p.screenplay.scenes[p.visualIndex||0];if(p.narrationDrafts)delete p.narrationDrafts[sc.id];if(storeProject(p,true)){view='production';render();}return;}
      if(action==='save-narration'){
        let p=clone(checkedProject()),sc=p.screenplay.scenes[p.visualIndex||0],text=$('#film-narration-text').value.trim();if(!text)throw Error('请保留这段讲述。');
        if(sc.narration!==text){sc.narration=text;sc.action='讲述已修改，画面内容待重新整理。';delete p.visualApproval;delete p.scriptApproval;p.board=null;p=preparePreview(p);}
        if(p.narrationDrafts)delete p.narrationDrafts[sc.id];p.visualStep='waiting';p.previewJob.scope='segment';if(storeProject(p,true)){view='preview-wait';render();}return;
      }
      if(action==='view-generation'){const p={...project(),visualStep:'waiting'};if(storeProject(p,true)){view='preview-wait';render();}return;}
      if(action==='open-preview'){const p={...project(),visualStep:'preview'};if(storeProject(p,true)){view='production';render();}return;}
      if(action==='select-person'){const p=project();if(storyPeople(p).some(person=>person.id===button.dataset.role)&&storeProject({...p,visualRole:button.dataset.role},true))render();return;}
      if(action==='retry-job'){notify('生成服务尚未接入，内容已保留；未重复创建任务。');return;}
      if(action==='retry-preview'){notify('生成服务尚未接入，本段请求已保留；未重复创建任务。');return;}
      if(action==='frame-prev'||action==='frame-next'){const p=project(),index=Math.max(0,Math.min(p.screenplay.scenes.length-1,(p.visualIndex||0)+(action==='frame-next'?1:-1)));if(storeProject({...p,visualIndex:index},true))render();return;}
      if(action==='close-scene'){view=sceneReturn;render();return;}
      if(action==='edit-scene'||action==='edit-film-scene'){sceneReturn=action==='edit-film-scene'?'film-shots':'production';sceneIndex=Number(button.dataset.index);view='scene-edit';render();return;}
      if(action==='save-scene-request'){const p=clone(checkedProject()),text=$('#film-scene-request').value.trim();if(!text)throw Error('请填写想调整的地方。');p.sceneRequests={...(p.sceneRequests||{}),[p.screenplay.scenes[sceneIndex].id]:{text,revision:p.revision,status:'pending',updatedAt:Date.now()}};delete p.visualApproval;const next=preparePreview(p);next.visualStep='waiting';next.previewJob.scope='segment';if(storeProject(next,true)){view='preview-wait';render();}return;}
      if(action==='play-demo'){const video=root.querySelector('video');video.play().then(()=>button.hidden=true).catch(()=>notify('播放未开始，请再次点击播放。'));return;}
      if(action==='person-example'){personRole='';view='person-views';render();return;}
      if(action==='show-split'){view='split-review';render();return;}
      if(action==='confirm-split'){const p=clone(project());p.splitReviewed=true;if(storeProject(p,true)){view='production';render();}return;}
      if(action==='person-views'){personRole=button.dataset.role;if(!project()?.characterPhotos?.[personRole]){notify('请先上传人物照片。');return;}view='person-views';render();return;}
      if(action==='confirm-person-demo'){const p=clone(project());if(p.characterPhotos?.[personRole])p.characterPhotos[personRole].demoConfirmed=true;if(storeProject(p,true)){view='production';render();notify('演示已确认，画布传输尚未接入。');}return;}
      if(action==='generate-person'||action==='generate-all'){notify('AI 图片生成服务尚未接入，暂未生成资产。');return;}
      if(action==='generate-assets'){view='review-assets';render();return;}
      if(action==='confirm-demo-assets'){const p=clone(checkedProject());if(p.editorDraft||Object.keys(p.narrationDrafts||{}).length)throw Error('请先完成讲述调整。');p.visualApproval={revision:p.revision,at:Date.now()};p.filmJob={id:'film-demo-'+Date.now(),revision:p.revision,status:'ready',simulated:true};if(storeProject(p,true)){view='film-preview';render();}return;}
      if(action==='review-demo-assets'){view='review-assets';render();return;}
      if(action==='show-film-preview'){view='film-preview';render();return;}
      if(action==='edit-film-shots'){view='film-shots';render();return;}
      if(action==='retry-film-shot'){notify('原型演示：此段视频重制服务尚未接入。');return;}
      if(action==='save-film-demo'){const p=clone(project());p.demoPreviewSaved=true;if(storeProject(p,true))notify('演示预览已保存在本机。');return;}
      if(action==='back-board'){view='production';render();return;}
      if(action==='generate-image'){notify('AI 场景图生成服务尚未接入。');return;}
      if(action==='new'){selected=new Set();scope='life';selectionBasis='chapter';duration=null;tone='温暖回望';db.activeId=null;view='choose';render();}
      if(action==='home'){view='home';render();}
      if(action==='upload-story'){storyFilePick.click();return;}
      if(action==='create-upload'){
        const title=$('#film-upload-title').value.trim()||'我的故事',text=$('#film-upload-text').value.trim();
        uploadedStory={title,text};if(!text)throw Error('请先输入故事正文或上传 TXT 文件。');
        const source={id:'uploaded-'+Date.now(),title,text,kind:'user',origin:'本人上传的故事'};
        const base=core.createProject([source],{duration:core.recommendDuration([source]),tone,scope:'fragment',title});
        base.uploaded=true;base.scopeName='自己上传的故事';base.selectionPool=[source];
        const p=core.storyPreview(core.draftScreenplay(base));
        if(storeProject(p)){uploadedStory={title:'',text:''};view='story';render();}return;
      }
      if(action==='select-range'){view='range';render();return;}
      if(action==='back'){if(view==='shot-assets'){run('back-shot');return;}if(view==='preview-toc'){view='production';render();return;}if(view==='story-reader'||view==='story-toc'||view==='story-history'){view='story';render();return;}if(view==='preview-wait'||view==='video-demo'){view='home';render();return;}if(view==='story-cards'){cardSelection=null;view=cardReturn;render();return;}if(view==='range'||view==='upload-story'){if(view==='upload-story')uploadedStory={title:$('#film-upload-title').value,text:$('#film-upload-text').value};view='choose';render();return;}if(view==='scene-edit'){view=sceneReturn;render();return;}if(view==='film-shots'){view='film-preview';render();return;}if(view==='production'||view==='review-assets'){view='people';render();return;}if(view==='narration-edit'){run('cancel-narration');return;}if(view==='script'){view='people';render();return;}if(view==='people'){view='story';render();return;}if(view==='adjust'){run('cancel-adjust');return;}if(view==='choose'){view='home';render();return;}if(view==='home'){window.go(returnTo);return;}view='home';render();}
      if(action==='resume')openProject(button.dataset.id);
      if(action==='create'){
        const picked=pickedSources();
        const groupNames=scope==='fragment'?groupFilmSources(sources(),selectionBasis).filter(g=>g.sourceIds.some(id=>selected.has(id))).map(g=>g.name):[];
        const named=groupNames.filter(name=>!['未分章回忆','未分阶段'].includes(name));
        const title=scope==='life'?'我的人生纪事':named.length?named.join('、').slice(0,28)+' · 岁月片段':picked[0]?.title;
        const base=core.createProject(picked,{duration:duration||core.recommendDuration(picked),tone,scope,selectionBasis,groupNames,title});
        base.selectionPool=clone(picked);
        const p=casePreview?casePreview.draft(base,core):core.storyPreview(core.draftScreenplay(base));
        p.duration=core.recommendDuration(core.reviewScenes(p).map(s=>({text:s.narration})));
        pendingSaveView='story';if(storeProject(p)){pendingSaveView=null;view='story';render();}
      }
      if(action==='save-passage'){
        const i=Number(button.dataset.index),text=$('#film-passage-'+i).value;
        const next=core.editNarration(checkedProject(),i,text);delete (next.passageDrafts||{})[i];
        if(storeProject(next,true))render();
      }
      if(action==='convert-preview'){const p=checkedProject(),readable=core.storyPreview(p);const next={...core.editStory(p,readable.story,p.title),reviewTarget:'story',legacyScreenplay:{story:p.story,revision:p.revision,approval:p.approval}};if(storeProject(next)){view='story';render();}}
      if(action==='adjust'){adjustReturn=view==='story-reader'?'story-reader':'story';readingScroll=$('#film .body').scrollTop;const body=$('#film .body'),top=body.getBoundingClientRect().top;const passages=[...root.querySelectorAll('.mf-preview-scene')];const current=passages.findIndex(el=>el.getBoundingClientRect().bottom>top+40);editIndex=button?.dataset.index!==undefined?Number(button.dataset.index):(project().caseId?project().storyPage||0:Math.max(0,current));view='adjust';render();}
      if(action==='edit-novel'){const body=root.querySelector('.mf-novel-reader'),scroll=body.scrollTop;novelEditing=true;render();const nextBody=root.querySelector('.mf-novel-reader');nextBody.querySelectorAll('.mf-novel-edit').forEach(growInlineStory);nextBody.scrollTop=scroll;return;}
      if(action==='save-inline-story'){
        const p=checkedProject(),draft=p.editorDraft;if(!draft)return;if(!draft.title.trim()||draft.passages.some(text=>!text.trim()))throw Error('请保留故事标题和每节正文。');
        const scenes=core.reviewScenes(p),titles=draft.titles||scenes.map(sc=>sc.title);if(titles.length!==scenes.length||titles.some(t=>!t.trim()))throw Error('请保留每节的标题。');const titlesChanged=titles.some((t,i)=>t.trim()!==scenes[i].title);const next=core.editPreview(p,draft.title,draft.passages);if(titlesChanged){const prior=next.screenplayDraft||{scenes};next.screenplayDraft={...prior,scenes:prior.scenes.map((sc,i)=>({...sc,title:titles[i].trim()}))};if(next.revision===p.revision)next.revision++;next.approval=null;next.screenplay=null;next.board=null;next.stage='story';}delete next.editorDraft;delete next.passageDrafts;next.feedbackDraft='';if(next.story!==p.story&&next.revisionRequest)next.revisionRequest.status='resolved_by_user';next.duration=core.recommendDuration(core.reviewScenes(next).map(sc=>({text:sc.narration})));const body=root.querySelector('.mf-body'),scroll=body.scrollTop,opened=[...root.querySelectorAll('.mf-story-card[open]')].map(el=>el.id);if(storeProject(next,true)){if(view==='story-reader')novelEditing=false;render();root.querySelectorAll('.mf-story-card').forEach(el=>el.open=opened.includes(el.id));root.querySelector('.mf-body').scrollTop=scroll;notify('故事修改已保存。');}return;
      }
      if(action==='save-adjust'){
        if(!captureAdjustment())return;
        const p=checkedProject(),draft=p.editorDraft;const next=core.editPreview(p,draft.title,draft.passages);
        if(draft.directions){const changed=draft.directions.some((d,i)=>d.action!==p.screenplayDraft.scenes[i]?.action||d.setting!==p.screenplayDraft.scenes[i]?.setting);if(changed){next.screenplayDraft={...next.screenplayDraft,scenes:next.screenplayDraft.scenes.map((sc,i)=>({...sc,action:draft.directions[i].action,setting:draft.directions[i].setting}))};if(next.revision===p.revision)next.revision++;next.approval=null;next.screenplay=null;next.board=null;next.stage='story';}}
        if(!next.title.trim())throw Error('请填写电影片名。');
        delete next.editorDraft;delete next.passageDrafts;next.feedbackDraft='';
        if(next.story!==p.story&&next.revisionRequest)next.revisionRequest.status='resolved_by_user';
        next.duration=core.recommendDuration(core.reviewScenes(next).map(s=>({text:s.narration})));
        if(storeProject(next,true)){view=adjustReturn;render();$('#film .body').scrollTop=readingScroll;}
      }
      if(action==='cancel-adjust'){const next=clone(project());delete next.editorDraft;delete next.passageDrafts;if(storeProject(next,true)){view=adjustReturn;render();$('#film .body').scrollTop=readingScroll;}}
      if(action==='approve'){
        const current=checkedProject();
        if(!canConfirm(current))throw Error('请先完善故事或处理修改意见，再确认。');
        const ready={...current,duration:core.recommendDuration(core.reviewScenes(current).map(scene=>({text:scene.narration})))};
        const p=core.approve(ready,true);
        delete p.visualApproval;p.splitReviewed=true;p.visualStep='people';if(storeProject(p)){view='people';render();}
      }
      if(action==='edit-story'){view='story';render();}
      if(action==='feedback'){
        updateStory();const p={...core.requestRevision(checkedProject(),$('#film-feedback').value),feedbackDraft:''};
        if(storeProject(p)){view='story';render();}
      }
      if(action==='original'){
        const p=project();const panel=document.createElement('dialog');panel.className='mf-original-dialog';
        panel.innerHTML='<div class="mf-dialog-head"><h2>选用的原文</h2><button aria-label="关闭原文">×</button></div>'+p.sources.map(s=>'<article><h3>'+esc(s.title)+'</h3><p>'+esc(s.text)+'</p></article>').join('');
        $('.screens').appendChild(panel);panel.querySelector('button').onclick=()=>panel.close();panel.addEventListener('close',()=>panel.remove());panel.showModal();
      }
      if(action==='refresh-sources'){
        const p=project(),latest=p.sources.map(s=>sources().find(x=>x.id===s.id)).filter(Boolean);
        if(!latest.length)throw Error('原文已不可用，请返回重新选取。');
        if(!window.confirm('将按最新原文重新生成剧本预览，当前剧本的修改和旧分镜会被替换。是否继续？'))return;
        const next=core.storyPreview(core.draftScreenplay({...clone(p),sources:clone(latest),story:latest.map(s=>s.text).join('\n\n'),sourcePending:false,approval:null,screenplay:null,board:null,stage:'story',updatedAt:Date.now()}));delete next.editorDraft;delete next.passageDrafts;
        if(storeProject(next)){view='story';render();}
      }
      if(action==='retry-save'){const destination=pendingSaveView;if(persist(pendingSave||db)){pendingSaveView=null;if(destination){view=destination;render();}notify('已重新保存到本机。');}}
      if(action==='export'){
        const data=core.exportPackage(checkedProject());
        const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download='云忆微电影-'+data.project.title.replace(/[\\/:*?"<>|]/g,'')+'-v'+data.project.revision+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('制作资料已下载，包含选用原文、确认剧本、剧本和分镜。');
      }
    }catch(e){notify(e.message);}
  }
  root.addEventListener('toggle',e=>{if(e.target.matches('.mf-shot-photos'))shotPhotosOpen=e.target.open;if(e.target.matches('.mf-story-card')&&e.target.open){const field=e.target.querySelector('textarea');if(field)growInlineStory(field);}},true);
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.querySelector('.mf-toc-overlay')){e.preventDefault();run('close-story-toc');}});
  root.addEventListener('click',e=>{const button=e.target.closest('[data-mf]');if(button)run(button.dataset.mf,button);});
  root.addEventListener('input',e=>{
    if(e.target.id==='film-shot-request'){saveShotAssets({request:e.target.value});return;}
    if(e.target.id==='film-narration-text'){const p=clone(project()),sc=p.screenplay.scenes[p.visualIndex||0];p.narrationDrafts={...(p.narrationDrafts||{}),[sc.id]:e.target.value};storeProject(p,true);return;}
    if(e.target.id==='film-scene-request'){const p=clone(project());p.sceneRequests={...(p.sceneRequests||{}),[p.screenplay.scenes[sceneIndex].id]:{text:e.target.value,revision:p.revision,status:'draft'}};storeProject(p,true);return;}

    if(e.target.id==='film-person-prompt'){const p=clone(project());if(p.characterPhotos?.[personRole]){p.characterPhotos[personRole].prompt=e.target.value;p.characterPhotos[personRole].demoConfirmed=false;storeProject(p,true);}return;}
    if(e.target.matches('#mf-inline-title,[data-inline-story],[data-chapter-title]')){if(e.target.tagName==='TEXTAREA')growInlineStory(e.target);const p=project(),scenes=core.reviewScenes(p),draft=clone(p.editorDraft||{title:p.title,passages:scenes.map((sc,i)=>p.passageDrafts?.[i]??sc.narration)});if(e.target.id==='mf-inline-title')draft.title=e.target.value;else if(e.target.dataset.chapterTitle!==undefined){draft.titles=draft.titles||scenes.map(sc=>sc.title);draft.titles[Number(e.target.dataset.chapterTitle)]=e.target.value;}else draft.passages[Number(e.target.dataset.inlineStory)]=e.target.value;storeProject({...p,editorDraft:draft},true);const save=root.querySelector('[data-mf="save-inline-story"]'),approve=root.querySelector('#film-approve');if(save)save.disabled=false;if(approve)approve.disabled=true;return;}
    if(e.target.matches('#film-edit-title,#film-edit-text,#film-edit-setting,#film-edit-action')){captureAdjustment();return;}
    if(e.target.matches('[data-passage]')){const p={...project(),passageDrafts:{...project().passageDrafts,[e.target.dataset.passage]:e.target.value}};storeProject(p,true);$('#film-approve').disabled=true;}
    if(e.target.matches('#film-story,#film-title'))updateStory();
    if(e.target.id==='film-feedback'){
      const p={...project(),feedbackDraft:e.target.value};storeProject(p,true);$('#film-approve').disabled=!canConfirm(p);
    }
  });
  root.addEventListener('change',async e=>{
    if(e.target.id==='film-upload-file'){const file=e.target.files[0];if(file)await readStoryFile(file);e.target.value='';return;}
    if(e.target.id==='film-preview-chapter'){directoryChapter=Number(e.target.value);render();return;}
    if(e.target.dataset.shotPick!==undefined){const p=project(),photo=shotPool(p)[Number(e.target.dataset.shotPick)],photos=p.shotAssets?.[activeShotId]?.photos||[];if(photo)saveShotAssets({photos:e.target.checked?[...photos.filter(x=>x.url!==photo.url),photo]:photos.filter(x=>x.url!==photo.url),excludedUrls:e.target.checked?(p.shotAssets?.[activeShotId]?.excludedUrls||[]).filter(url=>url!==photo.url):[...new Set([...(p.shotAssets?.[activeShotId]?.excludedUrls||[]),photo.url])]});const count=root.querySelector('#mf-shot-photo-count');if(count)count.textContent='已选 '+root.querySelectorAll('[data-shot-pick]:checked').length+' 张 · 可选';return;}

    if(e.target.id==='film-role'){if(storeProject({...project(),visualRole:e.target.value},true))render();return;}
    if(e.target.id==='film-frame-index'){if(storeProject({...project(),visualIndex:Number(e.target.value)},true))render();return;}

    if(e.target.matches('[data-scene-photo],[data-character-photo],[data-shot-photo]')){
      const file=e.target.files[0],index=Number(e.target.dataset.scenePhoto),role=e.target.dataset.characterPhoto;if(!file)return;
      try{
        if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('请选择 JPG、PNG 或 WebP 照片。');
        if(file.size>2*1024*1024)throw Error('请选择 2MB 以内的照片。');
        const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('照片读取失败，请重试。'));reader.readAsDataURL(file);});
        await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(Error('照片无法打开，请换一张。'));image.src=url;});
        const p=clone(project());delete p.visualApproval;
        if(e.target.dataset.shotPhoto){activeShotId=e.target.dataset.shotPhoto;if(saveShotAssets({photos:[...(p.shotAssets?.[activeShotId]?.photos||[]),{id:'shot-photo-'+Date.now(),url,name:file.name}]}))render();return;}
        if(role){delete p.protagonistApproval;delete p.scriptApproval;p.visualStep='people';p.characterPhotos={...(p.characterPhotos||{}),[role]:{url,name:file.name}};}else{const scene=p.screenplay.scenes[index],sourceId=scene?.sourceIds?.[0];if(!sourceId)throw Error('无法关联场景，请重试。');p.photoPlan=[...(p.photoPlan||[]),{id:'scene-photo-'+Date.now(),sourceId,url,name:file.name,status:'pending_review',reason:'用户上传，待核对'}];}
        const scroll=$('#film .body').scrollTop;if(storeProject(p,true)){render();$('#film .body').scrollTop=scroll;notify(role?'人物照片已保存。':'场景图已保存。');}
      }catch(error){notify(error.message);}return;
    }

    if(e.target.id==='film-script-index'){if(storeProject({...project(),scriptIndex:Number(e.target.value)},true))render();return;}
    if(e.target.id==='film-edit-section'){if(!captureAdjustment())return;editIndex=Number(e.target.value);render();return;}
    if(e.target.id==='film-story-page'){if(storeProject({...project(),storyPage:Number(e.target.value)},true))render();return;}
    if(e.target.id==='mf-history-version'){historyIndex=Number(e.target.value);render();return;}
    if(e.target.id==='film-card-group'){cardGroup=e.target.value;render();return;}
    if(e.target.dataset.filmCard){e.target.checked?cardSelection.add(e.target.dataset.filmCard):cardSelection.delete(e.target.dataset.filmCard);root.querySelector('#film-card-count').textContent='已选 '+cardSelection.size+' / '+filmSourcePool(project()).length+' 张';root.querySelector('[data-mf="regenerate-cards"]').disabled=!cardSelection.size;return;}
    if(e.target.name==='film-scope'){rangeOpen=true;scope=e.target.value;selected=new Set();render();return;}
    if(e.target.id==='film-group-basis'){rangeOpen=true;selectionBasis=e.target.value;render();return;}
    if(e.target.matches('[data-mf-group]')){
      const group=groupFilmSources(sources(),selectionBasis).find(g=>g.id===e.target.dataset.mfGroup);
      if(group)group.sourceIds.forEach(id=>e.target.checked?selected.add(id):selected.delete(id));
      $('#film-create').disabled=!pickedSources().length;const summary=root.querySelector('.mf-range-default');if(summary)summary.textContent=rangeSummary();
    }
    if(e.target.id==='film-duration'||e.target.id==='film-tone'){
      if(view==='choose'){duration=$('#film-duration').value==='auto'?null:Number($('#film-duration').value);tone=$('#film-tone').value;}
      else if(view==='story'){
        const p=project();const value=$('#film-duration').value;
        const next={...clone(p),duration:value==='auto'?core.recommendDuration([{text:p.story}]):Number(value),tone:$('#film-tone').value,
          revision:p.revision+1,approval:null,screenplay:null,board:null,stage:'story'};
        if(storeProject(next,true)){render();$('#film-settings').open=true;}
      }
    }
  });
  document.addEventListener('input',e=>{if(e.target.matches('#ivLiveTxt[contenteditable="true"]'))typedMemory=e.target.textContent;});
  document.addEventListener('focusout',e=>{if(e.target.matches('#story [data-story-edit="body"],#story [data-story-edit="title"],#story [data-story-edit="category"]'))syncStory();});
  document.addEventListener('click',e=>{
    if(e.target.closest('#summary [data-go="shelf"]'))archiveTypedMemory();
    const entry=e.target.closest('[data-film-entry]');if(!entry)return;
    returnTo=entry.closest('#session')?'session':entry.closest('#story')?'story':'mine';
    if(entry.dataset.filmEntry==='story'){syncStory();selected=new Set();scope='life';selectionBasis='chapter';view='choose';}
    else if(entry.closest('#mine'))view='home';
    else if(entry.dataset.filmEntry==='home'){view='home';}
    else view='home';
  },true);
  const originalGo=window.go;
  window.go=function(id){if(id==='film'){history.replaceState(null,'','#film');render();}else if(root.classList.contains('on'))history.replaceState(null,'','#'+id);return originalGo(id);};
  window.addEventListener('storage',e=>{
    if(e.key!==KEY)return;
    if(unsaved){notify('其他窗口更新了草稿。本页有未保存文字，请先备份，避免覆盖。');return;}
    if(e.newValue){try{const incoming=decodeStorage(e.newValue);if(incoming.version===1&&Array.isArray(incoming.projects)&&Array.isArray(incoming.sources)){db=incoming;if(root.classList.contains('on'))render();}}catch(err){notify('其他窗口的草稿无法读取，请刷新前先保存当前文字。');}}
  });
  if(window.PRD_CONTENT)window.PRD_CONTENT.film={"title":"人生微电影 · 本期 PRD","stage":"故事 → 人物 → 预览调整 → 影片","problem":"把用户的回忆整理成可核对的故事和影片，减少专业脚本操作。","goal":"确认故事与人物后，由 AI 视频服务返回脚本拆解与画面，用户在同一预览中查看和调整。","promptDocs":[["查看本期完整 PRD","docs/codex/prd/v17-microfilm-current.md"],["查看故事与分镜提示词","docs/ai/microfilm-story-prompts.md"],["查看案例故事提示词","docs/ai/jiang-story-writing-prompt-v2.md"]],"status":["当前为本地原型；AI 视频、人物三视图、预览画面和影片服务尚未接入。","本地规则片段仅供演示，不代表 AI 视频服务结果。"],"users":["本人","家人／整理者"],"flow":["选择人生纪事、岁月片段或上传自己的故事。","生成并确认完整故事；可阅读、编辑、调整选材及查看原稿。","核对故事人物，有照片以照片为参考，无照片根据故事生成示意形象；全部人物形象生成完成后才能继续。","提交预览任务；后台生成脚本拆解与画面，等待后查看结果。","同页查看画面与讲述，调整受影响片段，满意后提交影片制作。"],"requirements":["写故事及重选故事提示词、人物提取和三视图提示词见完整 PRD 与提示词文档。","人物形象生成完成是进入预览前置条件；三视图后台按需处理，无照片生成示意形象，不冒充真实人物。","生产环境的脚本拆解及对应图片由 AI 视频服务返回，本应用按章节、片段和版本直接展示。","用户修改当前故事或人物后，撤销受影响的旧确认与生成结果。","任务状态来自服务，支持离开恢复、失败重试和防重复提交。"],"edgeCases":["生成失败保留输入及旧成果。","部分片段失败不伪称全部完成。","素材缺失、地址过期、版本变更及旧结果晚到需正确处理。"],"acceptance":["以真实服务返回验证每个片段与对应图片。","验证人物参考、三视图和提示词版本可追溯。","验证选材、故事编辑、确认、等待、局部调整和恢复。","本地原型、演示视频和截图不能代替真实生成验收。"]};
  // Preserve the earlier seven-section draft and open a separate complete version once.
  const priorCase=project();
  if(priorCase?.caseId===realCase?.id&&(priorCase.caseVersion!==realCase.version||!priorCase.literaryFormat||priorCase.storyEdition!==casePreview.storyEdition)){
    try{
      const base={...clone(priorCase),id:'film-'+Date.now()+'-complete',revision:1,createdAt:Date.now(),sourcePending:false};
      const align=source=>{const current=realCase.sources.find(s=>s.id===source.id);return current?{...source,chapterNo:current.chapterNo,stageId:current.stageId,chapterName:current.chapterName,stageName:current.stageName}:source;};
      base.sources=base.sources.map(align);base.selectionPool=(base.selectionPool||base.sources).map(align);
      if(base.scope==='fragment')base.groupNames=groupFilmSources(base.sources,base.selectionBasis||'chapter').map(g=>g.name);
      const next=casePreview.draft(base,core);
      for(const k of ['editorDraft','passageDrafts','visualApproval','demoAssetsConfirmed','demoPreviewSaved','revisionRequest','feedbackDraft','sceneRequests','changedIndices'])delete next[k];
      next.duration=core.recommendDuration(core.reviewScenes(next).map(s=>({text:s.narration})));
      next.previousDraftId=priorCase.id;next.visualIndex=0;next.visualStep='people';
      if(storeProject(next))view='story';
    }catch(e){loadError='完整稿暂未能整理，原草稿仍保留：'+e.message;}
  }
  window.YunyiFilm={read:()=>clone(db),storageKey:KEY,openProject};
})();
