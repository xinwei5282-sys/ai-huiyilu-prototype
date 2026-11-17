/* Local, curated poster prototype. No private memoir/profile data is read. */
(()=>{
'use strict';
const KEY='yunyi.daily-posters.v1';
const categories=['早安','好运','平安','宽心','老友','花草','怀旧','幽默','诗意','民俗'];
const defaults=['早安','好运','老友','宽心','怀旧'];
// Metadata describes complete generated images; it is never drawn on a poster.
const items=[{"id": "成品-morning", "asset": "morning", "cat": "早安", "title": "早上好", "body": "窗外有光，心里有盼。今天又是好一天。"}, {"id": "成品-luck", "asset": "luck", "cat": "好运", "title": "好柿成双", "body": "愿家中有喜，身边有伴，日子有甜。"}, {"id": "成品-peace", "asset": "peace", "cat": "平安", "title": "惦记的人都平安", "body": "一家人好好的，就是心里最大的踏实。"}, {"id": "成品-calm", "asset": "calm", "cat": "宽心", "title": "给自己留点时间", "body": "喝杯茶，散散步，做一件自己喜欢的事。"}, {"id": "成品-friends", "asset": "friends", "cat": "老友", "title": "老朋友，见字如面", "body": "各自忙着生活，也别忘了，有空一起坐坐。"}, {"id": "成品-flowers", "asset": "flowers", "cat": "花草", "title": "日子里，总有花开", "body": "把寻常的日子，过得有滋有味。"}, {"id": "成品-memory", "asset": "memory", "cat": "怀旧", "title": "那年的露天电影", "body": "一张小板凳，就是电影院。还记得坐在身旁的人吗？"}, {"id": "成品-humor", "asset": "humor", "cat": "幽默", "title": "今日安排", "body": "上午随心，下午随意，晚上随便走走。"}, {"id": "成品-poetry", "asset": "poetry", "cat": "诗意", "title": "坐看云起时", "body": "行到水穷处，坐看云起时。——王维"}, {"id": "成品-folk", "asset": "folk", "cat": "民俗", "title": "葫芦纳福", "body": "借一份吉祥寓意，愿日子安稳，家人和美。"}, {"id": "成品-morning-alt", "asset": "morning-alt", "cat": "早安", "title": "晨光正好", "body": "新的一天，愿你自在，也愿你欢喜。"}];
let state={prefs:[],scores:{},day:'',ids:[],replacements:0},loadIssue='';
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&Array.isArray(s.prefs)&&Array.isArray(s.ids)){state={...state,...s,prefs:s.prefs.filter(x=>categories.includes(x)),scores:s.scores&&typeof s.scores==='object'?s.scores:{}};}}catch(e){loadIssue='本机偏好暂时无法读取，先为你展示通用精选。';}
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const seed=s=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const all=()=>items;
const find=id=>all().find(x=>x.id===id);
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){notice('本机存储空间不足，这次选择暂未保存。');return false;}}
function recommend(){const d=today(),n=seed(d);const liked=state.prefs.length?state.prefs:defaults;const ranked=[...new Set([...liked,...defaults,...categories.filter(c=>c!=='民俗')])].filter(c=>c!=='民俗'||state.prefs.includes(c)).sort((a,b)=>(liked.includes(b)?100:0)+(Number(state.scores[b])||0)-(liked.includes(a)?100:0)-(Number(state.scores[a])||0));
const cats=ranked.slice(0,5);const rest=categories.filter(c=>!cats.includes(c)&&c!=='平安'&&c!=='花草'&&(c!=='民俗'||state.prefs.includes(c)));const explore=rest.length?[rest[n%rest.length],...rest.filter(c=>c!==rest[n%rest.length])].slice(0,2):['幽默','诗意'];
const pick=c=>{const choices=items.filter(p=>p.cat===c);return choices[n%choices.length].id;};
const chosen=cats.map(pick);for(const c of ['花草','平安',...explore,...ranked]){if(chosen.length>=9)break;if(!chosen.some(id=>find(id).cat===c))chosen.push(pick(c));}
state.ids=chosen.slice(0,9);
state.day=d;state.replacements=0;save();}
const root=document.createElement('section');root.id='daily-posters';root.className='screen dp-screen';document.querySelector('.screens').append(root);
let mode='grid',index=0,draft=[],selected=new Set(),message='',busy=false,batch=false,gridScroll=0;
function ensureDay(){if(state.day!==today()||state.ids.length!==9||state.ids.some(id=>!find(id))){recommend();selected.clear();gridScroll=0;batch=false;}}
function notice(s){message=s;const e=root.querySelector('.dp-preview .dp-notice')||root.querySelector('.dp-notice');if(e)e.textContent=s;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src=p=>window.YunyiPosterImages[p.asset];
const button=(action,label,cls='')=>`<button type="button" class="${cls}" data-dp="${action}">${label}</button>`;
function render(){ensureDay();if(mode==='detail'){renderPreview();return;}root.innerHTML=`<header class="dp-head">${button(mode==='grid'?'home':'back','‹ <span>返回</span>')}<span>每日分享海报</span><span class="dp-head-spacer" aria-hidden="true"></span></header><div class="body dp-body"></div><div class="dp-notice" role="status" aria-live="polite">${esc(message||loadIssue)}</div>`;const body=root.querySelector('.dp-body');
if(mode==='prefs'){body.innerHTML=`<div class="dp-heading"><h1>内容偏好</h1><p>可多选</p></div><div class="dp-prefs">${categories.map(c=>`<button type="button" data-pref="${c}" aria-pressed="${draft.includes(c)}">${c}<span>${draft.includes(c)?'✓':'＋'}</span></button>`).join('')}</div><p class="dp-help">传统民俗仅在你选择后推荐。无需填写生日，不使用你的私人回忆。</p><div class="dp-actions">${button('save-prefs','保存喜好','dp-primary')}${button('cancel-prefs','暂不调整')}</div>`;return;}
const d=new Date();body.innerHTML=`<div class="dp-filterline dp-date"><span>${d.getMonth()+1}月${d.getDate()}日</span></div><div class="dp-grid">${state.ids.map((id,i)=>{const p=find(id);return `<article class="dp-tile${selected.has(i)?' is-selected':''}"><button class="dp-card" data-dp="open" data-index="${i}" data-id="${id}" aria-label="预览：${esc(p.title)}"><img src="${src(p)}" alt="${esc(p.title)}"></button></article>`;}).join('')}</div>`;body.scrollTop=gridScroll;
}
let openerIndex=0;
function canShareImage(){try{return !!navigator.share&&!!navigator.canShare?.({files:[new File([new Uint8Array([137,80,78,71])],'海报.png',{type:'image/png'})]});}catch{return false;}}

function closePreview(){if(busy)return;root.querySelector('.dp-preview')?.remove();mode='grid';render();root.querySelector('.dp-card[data-index="'+openerIndex+'"]')?.focus({preventScroll:true});}
function renderPreview(){
 const p=find(state.ids[index]);let dialog=root.querySelector('.dp-preview');
 if(!dialog){dialog=document.createElement('dialog');dialog.className='dp-preview';dialog.setAttribute('aria-label','海报预览');root.append(dialog);
 dialog.addEventListener('cancel',e=>{e.preventDefault();closePreview();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePreview();}});
 }
 const action=document.activeElement?.dataset.dp;
 dialog.innerHTML=`<button class="dp-preview-close" type="button" data-dp="close" aria-label="关闭预览">×</button><div class="dp-preview-content"><div class="dp-image-area"><img class="dp-large" src="${src(p)}" alt="${esc(p.title+'。'+p.body)}"></div><div class="dp-pagination"><button type="button" data-dp="prev" aria-label="上一张">‹</button><span aria-live="polite">${index+1} / 9</span><button type="button" data-dp="next" aria-label="下一张">›</button></div><div class="dp-actions">${button('save','保存图片','dp-primary')}${canShareImage()?button('share','分享图片'):''}</div></div><div class="dp-notice" role="status" aria-live="polite"></div>`;
 if(!dialog.open)dialog.showModal();
 dialog.querySelector('[data-dp="'+(action==='prev'||action==='next'?action:'close')+'"]')?.focus({preventScroll:true});
}
async function png(i){const p=find(state.ids[i]);const img=new Image();img.src=src(p);await img.decode();const c=document.createElement('canvas');c.width=900;c.height=1200;c.getContext('2d').drawImage(img,0,0,900,1200);return c.toDataURL('image/png');}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
function signal(cat,delta){state.scores[cat]=Math.max(-10,Math.min(10,(Number(state.scores[cat])||0)+delta));save();}
// Small uncompressed ZIP writer, avoiding multiple automatic browser downloads.
function zip(files){const chunks=[],central=[];let offset=0;const enc=new TextEncoder();const header=(size)=>{const a=new Uint8Array(size);return [a,new DataView(a.buffer)];};
for(const f of files){const name=enc.encode(f.name),data=f.data;let crc=0xffffffff;for(const b of data){crc^=b;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;let [a,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);chunks.push(a,name,data);let [b,w]=header(46);w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);w.setUint16(8,0x800,true);w.setUint32(16,crc,true);w.setUint32(20,data.length,true);w.setUint32(24,data.length,true);w.setUint16(28,name.length,true);w.setUint32(42,offset,true);central.push(b,name);offset+=30+name.length+data.length;}
const size=central.reduce((n,a)=>n+a.length,0);let [end,v]=header(22);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);return new Blob([...chunks,...central,end],{type:'application/zip'});}
root.addEventListener('click',async e=>{const pref=e.target.closest('[data-pref]');if(pref){const c=pref.dataset.pref;draft=draft.includes(c)?draft.filter(x=>x!==c):[...draft,c];render();return;}
const b=e.target.closest('[data-dp]');if(!b||busy)return;const a=b.dataset.dp;message='';
if(a==='close'){closePreview();return;}
if(a==='home'){go('session');return;}
if(a==='prefs'){if(mode==='grid')gridScroll=root.querySelector('.body').scrollTop;draft=[...state.prefs];mode='prefs';render();return;}
if(a==='save-prefs'){state.prefs=[...draft];recommend();selected.clear();gridScroll=0;mode='grid';render();notice('喜好已更新。');return;}
if(a==='back'||a==='cancel-prefs'){mode='grid';render();return;}
if(a==='open'){gridScroll=root.querySelector('.body').scrollTop;index=Number(b.dataset.index);openerIndex=index;mode='detail';render();return;}
if(a==='prev'||a==='next'){index=(index+(a==='prev'?8:1))%9;render();return;}
if(['save','share','save-selected'].includes(a)){busy=true;b.disabled=true;try{const list=a==='save-selected'?[...selected]:[index];const files=[];for(const i of list){const data=await png(i),bytes=Uint8Array.from(atob(data.split(',')[1]),x=>x.charCodeAt(0));files.push({name:find(state.ids[i]).title+'.png',data:bytes,cat:find(state.ids[i]).cat});}
if(a==='share'){const f=new File([files[0].data],files[0].name,{type:'image/png'});if(navigator.canShare?.({files:[f]})&&navigator.share){await navigator.share({files:[f]});signal(files[0].cat,2);notice('已完成系统分享操作。');}else{notice('当前浏览器不支持图片分享，请保存图片后到微信发布。');}}else{download(files.length===1?new Blob([files[0].data],{type:'image/png'}):zip(files),files.length===1?files[0].name:'云忆每日海报-'+today()+'.zip');files.forEach(f=>signal(f.cat,1));notice(files.length===1?'已发起图片下载，请查看浏览器下载。':'已发起压缩包下载，解压后可选择图片分享。');}
}catch(err){notice(err.name==='AbortError'?'已取消分享。':'图片暂未保存成功，请重试。');}finally{busy=false;b.disabled=false;}}
});
// Horizontal swipes only; preserve vertical scrolling and long-press saving.
let touchStart=null;
root.addEventListener('touchstart',e=>{touchStart=mode==='detail'&&e.target.closest('.dp-large')&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
root.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
root.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(!busy&&mode==='detail'&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){index=(index+(dx<0?1:8))%9;render();}},{passive:true});
// Mouse dragging mirrors touch swipes in the desktop prototype.
let mouseStart=null;
root.addEventListener('dragstart',e=>{if(e.target.closest('.dp-large'))e.preventDefault();});
root.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&mode==='detail'&&e.target.closest('.dp-large')){mouseStart={x:e.clientX,y:e.clientY};e.target.setPointerCapture(e.pointerId);}});
root.addEventListener('pointercancel',()=>{mouseStart=null;});
root.addEventListener('pointerup',e=>{if(!mouseStart||e.pointerType!=='mouse')return;const dx=e.clientX-mouseStart.x,dy=e.clientY-mouseStart.y;mouseStart=null;if(!busy&&mode==='detail'&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){index=(index+(dx<0?1:8))%9;render();}});
const originalGo=window.go;window.go=function(id){if(id==='daily-posters'){mode='grid';ensureDay();render();history.replaceState(null,'','#daily-posters');}else if(root.classList.contains('on'))history.replaceState(null,'','#'+id);return originalGo(id);};
window.addEventListener('focus',()=>{if(root.classList.contains('on')&&state.day!==today()){mode='grid';render();}});
window.YunyiDailyPosters={exportPNG:png};
})();
