/* Topic recommendations and user-triggered poster requests. No live generation service. */
(()=>{
'use strict';
const KEY='yunyi.daily-posters.v1';
const subscriptionTypes=[
 {id:'news',name:'热点资讯',desc:'看看新鲜事，聊聊身边事'},
 {id:'health',name:'每日健康',desc:'每天一个有用的健康知识'},
 {id:'folk',name:'每日一卦',desc:'读一则卦意，添一点生活启发'},
 {id:'memory',name:'怀旧往事',desc:'重温老时光，也分享自己的故事'},
 {id:'festival',name:'节日关怀',desc:'逢节日、节气，送一份应景问候'},
 {id:'poetry',name:'每日诗句',desc:'一句好诗，一幅好景，一份心意'}
];
const healthTopics=['饮食营养','睡眠','日常运动','关节养护','心情调适','居家防跌倒'];
// These are complete generated sample images, not a live generation service.
const items=[
 ['blessing-morning','晨光正好'],['blessing-bamboo','清风作伴'],['blessing-luck','好事慢慢来'],
 ['blessing-river','一路从容'],['blessing-friends','得闲来坐坐'],['blessing-home','一餐一暖'],
 ['blessing-flowers','花开有信'],['blessing-peace','灯火可亲'],['blessing-evening','把心放宽']
].map(([asset,title])=>({id:asset,asset,title,cat:'每日祝福',body:''}));
const core=window.YunyiDailyPosterCore;
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const find=id=>items.find(x=>x.id===id);
let raw=null,loadIssue='';
try{raw=JSON.parse(localStorage.getItem(KEY)||'null');}catch{loadIssue='本机记录暂时无法读取，先展示祝福样例。';}
let state=core.init(raw,items,today());
const settings=()=>core.desired(state);
function commit(next){try{localStorage.setItem(KEY,JSON.stringify(next));state=next;return true;}catch{notice('本机记录未保存，请重试。');return false;}}
function changeSettings(patch){return commit(core.update(state,patch,today(),true));}
const effectiveMessage=()=> '已保存，后续推荐和新制作将使用这些设置。';
const displayedGroups=()=>{const groups=state.groups.filter(g=>g.status==='ready');for(const chosen of studio.selected||[]){if(!find(chosen.id))continue;const key='chosen-'+chosen.day;let group=groups.find(g=>g.key===key);if(!group){group={key,date:chosen.day,status:'ready',ids:[],chosen:true};groups.push(group);}if(!group.ids.includes(chosen.id))group.ids.push(chosen.id);}return groups.sort((a,b)=>b.date.localeCompare(a.date));};
let previewGroup=null;
const previewIds=()=>previewGroup?.ids||state.groups.find(g=>g.date===today()&&g.status==='ready')?.ids||displayedGroups()[0]?.ids||[];
const root=document.createElement('section');root.id='daily-posters';root.className='screen dp-screen';document.querySelector('.screens').append(root);
let signatureChoice='zhuwen';
const signatureStyles=[{id:'script',name:'行书签名',desc:'轻巧舒展，适合照片与生活感悟'},{id:'zhuwen',name:'朱文印章',desc:'红字留白，清雅有书卷气'},{id:'baiwen',name:'白文印章',desc:'朱底白字，沉稳而有分量'}];
let mode='feed',index=0,message='',busy=false,gridScroll=0;
function ensureDay(){state=core.advance(state,today());}
function notice(s){message=s;const e=root.querySelector('.dp-preview .dp-notice')||root.querySelector('.dp-notice');if(e)e.textContent=s;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const src=p=>window.YunyiPosterImages[p.asset];
const button=(action,label,cls='')=>`<button type="button" class="${cls}" data-dp="${action}">${label}</button>`;
function render(){root.dataset.mode=mode;if(mode==='detail'){renderPreview();return;}ensureDay();root.innerHTML=`<header class="dp-head"><button type="button" data-dp="${mode==='feed'?'home':'back'}" aria-label="返回"><span class="dp-back-chevron" aria-hidden="true"></span></button><span>${mode==='subscriptions'?'订阅内容':mode==='identity'?'海报署名':mode==='compose'?'制作我的海报':mode==='memory'?'选择一段回忆':mode==='review'?'确认内容':mode==='job'?'制作记录':mode==='grid'?'我的海报':mode==='samples'?'推荐海报':'每日分享'}</span><span class="dp-head-spacer" aria-hidden="true"></span></header><div class="body dp-body"></div><div class="dp-notice" role="status" aria-live="polite">${esc(message||loadIssue)}</div>`;const body=root.querySelector('.dp-body');
if(['feed','compose','memory','review','job'].includes(mode)){renderStudio(body);mountComposerActions();return;}
if(mode==='subscriptions'){
body.innerHTML=`<div class="dp-settings-intro"><h1>把喜欢的，留给每天</h1><p>每天1张祝福，每订阅一类多1张。提前准备好，并通过微信提醒你。</p><p>当前计划每天 ${studioCore.recommendationPlan(today(),settings()).length} 张，素材不足时不凑数。</p></div><div class="dp-subscriptions">${subscriptionTypes.map(t=>`<div class="dp-sub-row"><button class="dp-sub-toggle" type="button" role="switch" aria-checked="${settings().subscriptions.includes(t.id)}" data-subscription="${t.id}" aria-label="${t.name}"><span><strong>${t.name}</strong><small>${t.desc}</small></span><i class="dp-switch" aria-hidden="true"></i></button>${t.id==='news'&&settings().subscriptions.includes('news')?`<div class="dp-health-options dp-news-options"><p>你想看哪些资讯？<span>可多选</span></p><div>${core.NEWS_TOPICS.map(topic=>`<button type="button" data-news="${topic}" aria-pressed="${settings().newsTopics.includes(topic)}">${topic}</button>`).join('')}</div><small>不选则推荐综合资讯，关闭订阅会保留已选方向。</small></div>`:''}${t.id==='health'&&settings().subscriptions.includes('health')?`<div class="dp-health-options"><p>你想关注哪些方面？<span>可多选</span></p><div>${healthTopics.map(t=>`<button type="button" data-health="${t}" aria-pressed="${settings().healthTopics.includes(t)}">${t}</button>`).join('')}</div><small>不选也可以，我们会准备通用健康知识。</small></div>`:''}</div>`).join('')}</div><p class="dp-setting-foot">设置用于后续推荐，已有作品和已提交的制作保持不变。<br>未订阅的类型不推荐，仍可主动制作；取消订阅后停止后续推荐。</p><details class="dp-prototype-note"><summary>原型说明</summary><p>本机可保存订阅和关注方向。资讯、健康审核、民俗、回忆及诗句内容生成尚未接入；首页固定祝福图片仅作样式参考，不是当天自动推荐结果。主动制作可保存请求；自动准备、成品推送与微信消息尚未接入。</p></details>`;return;}
if(mode==='identity'){
body.innerHTML=`<div class="dp-sign-heading"><small>留一点，只属于你的印记</small><h1>为作品落个款</h1><p>选一次，以后的海报沿用。</p></div><form class="dp-identity-form"><label for="dp-pen-name">你的笔名</label><input id="dp-pen-name" name="penName" maxlength="12" value="${esc(settings().penName)}" autocomplete="off" placeholder="建议2—6个字"><div class="dp-sign-options" role="group" aria-label="选择落款样式">${signatureStyles.map(x=>`<button type="button" data-dp="signature-style" data-style="${x.id}" aria-pressed="${signatureChoice===x.id}"><div class="dp-sign-art"><img src="v17/assets/signatures/yunshan-${x.id}.png" alt="云山${x.name}生成样例"></div><div class="dp-sign-copy"><strong>${x.name}${x.id==='zhuwen'?'<em>推荐</em>':''}</strong><p>${x.desc}</p></div><i aria-hidden="true">${signatureChoice===x.id?'✓':''}</i></button>`).join('')}</div><p class="dp-sign-preview-note">${settings().penName==='云山'?'当前展示「云山」落款效果。':'以上为「云山」风格示例，你的笔名专属效果待接入生成。'}</p><p class="dp-field-help">每张海报只用一种落款。位置和大小随画面调整。</p></form><div class="dp-compose-bottom dp-sign-save"><small>保存后用于新海报，已有图片不变</small>${button('save-identity','保存落款','dp-primary')}</div>`;const dock=body.querySelector('.dp-sign-save');dock.classList.add('dp-action-dock');root.append(dock);return;}
const groups=mode==='samples'?[{date:today(),key:'samples',status:'ready',ids:items.map(p=>p.id)}]:displayedGroups(),pending=null;
const dateLabel=day=>{const [y,m,d]=day.split('-');return (y!==today().slice(0,4)?y+'年':'')+Number(m)+'月'+Number(d)+'日';};
const controls=`<nav class="dp-tools" aria-label="海报设置">${button('subscriptions','订阅内容')}${button('identity','海报署名')}</nav>`;
body.innerHTML=`${mode==='grid'&&studio.jobs.length?`<section class="dp-job-list"><h2>制作记录</h2>${studio.jobs.map(j=>`<button type="button" data-dp="job" data-job="${j.id}"><span>${esc(j.input.text?.slice(0,22)||j.input.memory?.title||j.input.topic?.title||'我的照片海报')}</span><small>待接入生成服务 ›</small></button>`).join('')}</section>`:''}${!groups.length?'<div class="dp-empty">还没有已完成的海报。<br>先说一句话，做一张属于自己的。</div>':''}${pending?`<div class="dp-filterline dp-date"><span>${dateLabel(today())}</span>${controls}</div><div class="dp-empty" role="status"><strong>今天的海报正在准备</strong><p>${esc(pending.reason)}</p>${button('identity','查看海报署名')}</div>`:''}${groups.map((group,gi)=>`<section class="dp-day-group" data-date="${group.date}"><div class="dp-filterline dp-date"><span>${dateLabel(group.date)}</span>${group.chosen?'<small>我选用的海报</small>':mode==='samples'?'<small>原型样例 · 云山署名</small>':'<small>原型历史样例</small>'}</div><div class="dp-grid">${group.ids.map((id,i)=>{const p=find(id);return `<article class="dp-tile"><button class="dp-card" data-dp="open" data-day="${group.date}" data-group="${esc(group.key||group.date)}" data-index="${i}" data-id="${id}" aria-label="预览：${esc(p.title)}"><img src="${src(p)}" alt="${esc(p.title)}"></button></article>`;}).join('')}</div></section>`).join('')}`;body.scrollTop=gridScroll;

}
const studioCore=window.YunyiPosterStudio,STUDIO_KEY='yunyi.poster-studio.v1';
let studio=studioCore.init(null),activeJob='',memoryQuery='',recognition=null;
try{studio=studioCore.init(JSON.parse(localStorage.getItem(STUDIO_KEY)||'null'));}catch{loadIssue='制作草稿暂时无法读取，请稍后重试。';}
function persistStudio(next){try{localStorage.setItem(STUDIO_KEY,JSON.stringify(next));studio=next;return true;}catch{notice('内容未保存，本机空间可能不足，请保留当前页面后重试。');return false;}}
function persistDraft(){const input=root.querySelector('#dp-my-words');if(input)studio.draft.text=input.value;return persistStudio(studio);}
const hasDraft=()=>!!(studio.draft.text||studio.draft.memoirText||studio.draft.photo||studio.draft.memory||studio.draft.topic||studio.draft.sourceText||studio.draft.sourceUrl);
function memoirSources(personalOnly=false){
 let user=[];try{const stored=JSON.parse(localStorage.getItem('yunyi.v17.microfilm.jiang.v1')||'null');user=(stored?.sources||[]).filter(s=>s.kind==='user'&&s.caseId!==window.YunyiJiangCase?.id&&typeof s.text==='string'&&s.text.trim());}catch{notice('回忆暂时无法读取，可以先写下自己的话。');return [];}
 if(personalOnly)return user.map(s=>({...s,sourceLabel:'我的回忆'}));
 if(user.length)return user.map(s=>({...s,sourceLabel:'我的回忆'}));
 return (window.YunyiJiangCase?.sources||[]).filter(s=>s.text?.trim()).map(s=>({...s,sourceLabel:'原型示例 · 蒋老师的回忆'}));
}
function memoryList(){return memoirSources().filter(s=>(s.title+s.text).includes(memoryQuery)).map(s=>`<button type="button" class="dp-memory-row" data-dp="pick-memory" data-memory="${esc(s.id)}"><small>${esc(s.sourceLabel)}</small><strong>${esc(s.title)}</strong><p>${esc(s.text.slice(0,80))}…</p></button>`).join('')||'<p class="dp-empty">没有找到这段回忆，可以换个词，或返回直接写下来。</p>';}
function inputSummary(d){return `<p class="dp-review-type">分享类型：${esc(d.category||d.topic?.category||'每日祝福')}</p>${d.topic?`<div class="dp-topic-context"><small>${esc(d.topic.category)}</small><strong>${esc(d.topic.title)}</strong>${d.topic.sourceLabel?`<small>${esc(d.topic.sourceLabel)}</small>`:''}${d.topic.text?`<p>${esc(d.topic.text).replace(/\n/g,'<br>')}</p>`:''}</div>`:''}${d.category==='怀旧往事'&&d.memoirText?`<section class="dp-review-block"><small>写下的往事</small><p>${esc(d.memoirText)}</p></section>`:''}${d.text?.trim()?`<section class="dp-review-block"><small>你的感受 · 创作参考</small><p>${esc(d.text).replace(/\n/g,'<br>')}</p></section>`:''}${d.photo?`<figure class="dp-input-photo"><img src="${esc(d.photo.url)}" alt="我选择的照片"><figcaption>${esc(d.photo.name)}</figcaption></figure>`:''}${d.memory?`<details class="dp-selected-memory"><summary>${esc(d.memory.title)}</summary><small>${esc(d.memory.sourceLabel)}</small><p>${esc(d.memory.text)}</p></details>`:''}`;}
function timelineGroups(){
 const byDay=new Map();
 const get=day=>{if(!byDay.has(day))byDay.set(day,{date:day,key:'timeline-'+day,ids:[],jobs:[]});return byDay.get(day);};
 for(const g of displayedGroups())for(const id of g.ids)if(find(id)&&!get(g.date).ids.includes(id))get(g.date).ids.push(id);
 if(settings().penName==='云山'){const g=get(today());for(const p of items)if(!g.ids.includes(p.id))g.ids.push(p.id);}
 for(const j of studio.jobs){const d=new Date(j.createdAt);if(Number.isNaN(d.getTime()))continue;const day=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');get(day).jobs.push(j);}
 return [...byDay.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
function timelineDate(day){const d=new Date();d.setDate(d.getDate()-1);const yesterday=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');const [y,m,date]=day.split('-');return `${y!==today().slice(0,4)?y+'年':''}${Number(m)}月${Number(date)}日${day===today()?' <em>· 今天</em>':day===yesterday?' <em>· 昨天</em>':''}`;}
function renderTimeline(){return timelineGroups().map(g=>`<section class="dp-day-group" data-date="${g.date}"><div class="dp-filterline dp-date"><span>${timelineDate(g.date)}</span><i aria-hidden="true"></i></div>${g.jobs.length?`<div class="dp-job-list">${g.jobs.sort((a,b)=>b.createdAt-a.createdAt).map(j=>`<button type="button" data-dp="job" data-job="${esc(j.id)}"><span>${esc(j.input.text?.slice(0,22)||j.input.memory?.title||j.input.topic?.title||'我的照片海报')}</span><small>待接入生成服务 ›</small></button>`).join('')}</div>`:''}<div class="dp-grid">${g.ids.map((id,i)=>`<article class="dp-tile"><button class="dp-card" data-dp="open" data-day="${g.date}" data-group="${g.key}" data-index="${i}" aria-label="预览：${esc(find(id).title)}"><img src="${src(find(id))}" alt="${esc(find(id).title)}"></button></article>`).join('')}</div></section>`).join('')||'<p class="dp-empty">还没有海报，先做一张吧。</p>';}
const composeExamples={
 "随心分享": [
  {
   "title": "把日子过慢一点",
   "text": "示例中的感受：忙了大半辈子，现在喜欢坐下来喝茶，看窗外的树。",
   "feeling": "忙了大半辈子，现在喜欢坐下来喝茶，看窗外的树。",
   "posterTitle": "慢下来，也是一种丰盛",
   "posterBody": "半盏茶，一窗绿。日子不必赶，心安便是好时光。",
   "visual": "窗边茶盏、午后光影，留白式横排",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "做成一件小事",
   "text": "示例中的感受：自己种的花终于开了，每天照顾它，看见花开特别满足。",
   "feeling": "自己种的花终于开了，每天照顾它，看见花开特别满足。",
   "posterTitle": "认真生活，自有回响",
   "posterBody": "一日日浇灌，一点点等待。寻常日子，也会开出自己的花。",
   "visual": "优先使用用户花卉照片，文字避让花朵",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "珍惜老朋友",
   "text": "示例中的感受：老朋友聚了一次，没有什么大事，就是聊聊天，觉得很开心。",
   "feeling": "老朋友聚了一次，没有什么大事，就是聊聊天，觉得很开心。",
   "posterTitle": "老友相逢，岁月生香",
   "posterBody": "不必盛宴，不必远行。几句闲话，便把旧时光坐暖了。",
   "visual": "茶桌或用户合影，温暖自然的摄影版式",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  }
 ],
 "每日祝福": [
  {
   "title": "问候远方朋友",
   "text": "示例中的感受：想给很久没见的朋友送句早安，希望他每天心情好。",
   "feeling": "想给很久没见的朋友送句早安，希望他每天心情好。",
   "posterTitle": "晨光如约，愿你安好",
   "posterBody": "把一份惦念寄给清晨：愿你今日有好心情，眼前有小欢喜。",
   "visual": "清晨窗光与花枝，轻巧落款",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "祝家人顺遂",
   "text": "示例中的感受：孩子最近忙，我不想催他，只希望他吃好睡好，平平安安。",
   "feeling": "孩子最近忙，我不想催他，只希望他吃好睡好，平平安安。",
   "posterTitle": "不催归期，只愿安好",
   "posterBody": "忙碌时记得吃饭，疲惫时好好歇息。家里的灯，总为你留着。",
   "visual": "暖灯与餐桌，短句层次分明",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "送给自己的祝福",
   "text": "示例中的感受：想给自己打打气，以后的日子开开心心过。",
   "feeling": "想给自己打打气，以后的日子开开心心过。",
   "posterTitle": "往后的日子，向暖而行",
   "posterBody": "把心放宽，把日子过实。愿每个平常的今天，都有值得期待的小事。",
   "visual": "开阔晨色与小径，明亮但不夸张",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  }
 ],
 "热点资讯": [
  {
   "title": "社区生活更方便",
   "text": "示例中的感受：看到社区生活服务改善的报道，觉得方便老人生活很有意义。",
   "feeling": "看到社区生活服务改善的报道，觉得方便老人生活很有意义。",
   "posterTitle": "便利近一点，生活暖一分",
   "posterBody": "资讯要点由真实报道核验后填入。个人感悟可表达：把寻常小事照顾好，便是生活里实在的温暖。",
   "visual": "资讯摘要与个人观点分区，底部保留来源日期",
   "sourceLabel": "资讯情境示例 · 不是真实新闻",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "科技走进日常",
   "text": "示例中的感受：看到一项方便日常生活的新技术，我更关心老人能不能轻松使用。",
   "feeling": "看到一项方便日常生活的新技术，我更关心老人能不能轻松使用。",
   "posterTitle": "好技术，也该好上手",
   "posterBody": "技术事实以原报道为准。个人感悟可表达：进步的温度，在于让更多人用得明白、用得安心。",
   "visual": "干净图文版式，不虚构产品照片或性能",
   "sourceLabel": "资讯情境示例 · 不是真实新闻",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "老街重新热闹起来",
   "text": "示例中的感受：看到老街保护和修缮的报道，想起以前在那里逛街的感觉。",
   "feeling": "看到老街保护和修缮的报道，想起以前在那里逛街的感觉。",
   "posterTitle": "留住老街，也留住乡愁",
   "posterBody": "项目情况按报道核验。个人感悟可表达：盼老街留下熟悉的模样，也长出新的烟火气。",
   "visual": "经授权的原报道图片或明确示意插画，注明来源",
   "sourceLabel": "资讯情境示例 · 不是真实新闻",
   "demo": true,
   "referenceOnly": true
  }
 ],
 "每日健康": [
  {
   "title": "散步时的小欢喜",
   "text": "示例中的感受：最近喜欢饭后出去走走，看看树，感觉心情轻松些。",
   "feeling": "最近喜欢饭后出去走走，看看树，感觉心情轻松些。",
   "posterTitle": "走一走，看见日子的好",
   "posterBody": "把脚步放缓，看看树影，听听风声。忙着生活，也记得感受生活。",
   "visual": "树影步道，作为个人生活表达，不写疗效",
   "sourceLabel": "生活表达案例 · 非医疗建议",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "认真吃一餐饭",
   "text": "示例中的感受：今天给自己做了一顿喜欢的饭，觉得照顾自己也挺重要。",
   "feeling": "今天给自己做了一顿喜欢的饭，觉得照顾自己也挺重要。",
   "posterTitle": "一餐一饭，好好待自己",
   "posterBody": "为自己认真做一顿饭，让平常的日子有滋有味。",
   "visual": "使用用户餐食照片，不推断营养指标",
   "sourceLabel": "生活表达案例 · 非医疗建议",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "给忙碌留个停顿",
   "text": "示例中的感受：一天忙下来，想提醒自己别硬撑，累了就休息。",
   "feeling": "一天忙下来，想提醒自己别硬撑，累了就休息。",
   "posterTitle": "歇一歇，也是认真生活",
   "posterBody": "事情可以慢慢做，心也需要片刻安静。愿你记得，把自己照顾好。",
   "visual": "柔和灯光、书与茶，避免医疗结论",
   "sourceLabel": "生活表达案例 · 非医疗建议",
   "demo": true,
   "referenceOnly": true
  }
 ],
 "每日一卦": [
  {
   "title": "谦卦：有分量的人",
   "text": "示例中的感受：这些年做了不少事，越来越觉得没必要到处证明自己。",
   "feeling": "这些年做了不少事，越来越觉得没必要到处证明自己。",
   "posterTitle": "不露锋芒，自有分量",
   "posterBody": "地中有山，谦。有本领而不自满，有成绩而不居功。谦和待人，笃定做事。",
   "visual": "核验后的谦卦六爻、远山、印章，非个人起卦",
   "sourceLabel": "文化解读案例 · 非个人起卦",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "谦卦：留有余地",
   "text": "示例中的感受：与人相处，愿意多听一点，事情反而更好商量。",
   "feeling": "与人相处，愿意多听一点，事情反而更好商量。",
   "posterTitle": "心有余地，相处从容",
   "posterBody": "借谦卦说处世：有自己的主张，也容得下不同的声音。留一分谦和，多一分从容。",
   "visual": "卦象清楚、文字简洁，疏朗山水",
   "sourceLabel": "文化解读案例 · 非个人起卦",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "谦卦：踏实做事",
   "text": "示例中的感受：不想争一时的风头，把手里的事情慢慢做好就行。",
   "feeling": "不想争一时的风头，把手里的事情慢慢做好就行。",
   "posterTitle": "把事做好，便有底气",
   "posterBody": "借谦卦说做事：不忙于显露，先认真耕耘。笃定走好眼前的路，自有一份安稳。",
   "visual": "石径、山势与准确卦象，不加入运势承诺",
   "sourceLabel": "文化解读案例 · 非个人起卦",
   "demo": true,
   "referenceOnly": true
  }
 ],
 "怀旧往事": [
  {
   "title": "看见旧合影",
   "text": "示例中的感受：翻到年轻时与同事的合影，想起那时候一起忙工作的日子。",
   "feeling": "翻到年轻时与同事的合影，想起那时候一起忙工作的日子。",
   "posterTitle": "一张旧照，满是当年",
   "posterBody": "照片留住了年轻的模样，也留住了并肩的日子。再看一眼，心里仍有当年的热乎劲。",
   "visual": "使用原合影，不改人物面貌，不补造姓名年份",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "想起母亲做的饭",
   "text": "示例中的感受：看到一道家常菜，想起小时候母亲在厨房忙碌的样子。",
   "feeling": "看到一道家常菜，想起小时候母亲在厨房忙碌的样子。",
   "posterTitle": "最想念的，是家里的味道",
   "posterBody": "一道家常味，牵出旧时光。岁月走了很远，心里仍惦记那一餐温热。",
   "visual": "用户菜品照片或厨房示意，不生成冒充亲人的形象",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "记得第一次带徒弟",
   "text": "示例中的感受：想起第一次带徒弟，现在看他们能独当一面，心里很欣慰。",
   "feeling": "想起第一次带徒弟，现在看他们能独当一面，心里很欣慰。",
   "posterTitle": "手艺传下去，心意留下来",
   "posterBody": "当年认真教过的，如今有人接着做好。回头看，那份耐心，有了令人欣慰的回响。",
   "visual": "工具、双手等真实素材，人物经历以用户提供为准",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  }
 ],
 "节日关怀": [
  {
   "title": "重阳给父母的心意",
   "text": "示例中的感受：重阳节想给父母送祝福，希望他们平安，也希望多陪陪他们。",
   "feeling": "重阳节想给父母送祝福，希望他们平安，也希望多陪陪他们。",
   "posterTitle": "岁岁重阳，长长牵挂",
   "posterBody": "愿你们平安舒心，日子有暖。把祝福送到，也把陪伴放进往后的每一天。",
   "visual": "明确重阳创作主题，菊花与暖色，不断言今天是重阳",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "中秋想念家人",
   "text": "示例中的感受：中秋不能回家，想用海报告诉家人我惦记他们。",
   "feeling": "中秋不能回家，想用海报告诉家人我惦记他们。",
   "posterTitle": "月照两地，心在一处",
   "posterBody": "今夜未能同桌，牵挂从未走远。愿一轮明月，替我把祝福送到家。",
   "visual": "圆月、窗与家灯，确认节日再发布",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "新年问候老朋友",
   "text": "示例中的感受：新年想给老朋友们送点不俗套的祝福，平安开心就很好。",
   "feeling": "新年想给老朋友们送点不俗套的祝福，平安开心就很好。",
   "posterTitle": "新岁相逢，愿你常安",
   "posterBody": "愿新的一年，有相聚的欢喜，也有独处的自在。平常日子里，常有温暖相伴。",
   "visual": "节制朱红与梅枝，文字舒展",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  }
 ],
 "每日诗句": [
  {
   "title": "读王维，学一点从容",
   "text": "示例中的感受：最近喜欢王维这句诗，遇事不想那么着急了。",
   "feeling": "最近喜欢王维这句诗，遇事不想那么着急了。",
   "posterTitle": "行到水穷处，坐看云起时",
   "posterBody": "王维《终南别业》。个人感悟：路有转折，心可从容。停一停，也能看见新的风景。",
   "visual": "原诗与个人感悟分层，云山与留白",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "读陶渊明，珍惜闲时",
   "text": "示例中的感受：退休后喜欢种花，觉得简单的日子也很好。",
   "feeling": "退休后喜欢种花，觉得简单的日子也很好。",
   "posterTitle": "采菊东篱下，悠然见南山",
   "posterBody": "陶渊明《饮酒·其五》。个人感悟：把日子安放在一草一木间，寻常也有自己的滋味。",
   "visual": "菊花、篱落和远山，保留准确作者作品",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  },
  {
   "title": "读苏轼，记住好时节",
   "text": "示例中的感受：看到秋天的果子，觉得人生每个阶段都有值得喜欢的地方。",
   "feeling": "看到秋天的果子，觉得人生每个阶段都有值得喜欢的地方。",
   "posterTitle": "一年好景君须记，最是橙黄橘绿时",
   "posterBody": "苏轼《赠刘景文》。个人感悟：不必只恋春光，眼前也有值得珍藏的好景。",
   "visual": "橙橘与秋叶，原诗准确，感悟不冒充古诗",
   "sourceLabel": "表达案例 · 非本人经历",
   "demo": true,
   "referenceOnly": true
  }
 ]
};
function sourceLink(value){try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol))return '';return `<a class="dp-source-link" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">查看原文 ↗</a>`;}catch{return '';}}
const newsReferences=[
 {id:'community',title:'社区助餐服务更贴近老年人',text:'示例摘要：社区围绕老人日常用餐，完善助餐服务与便民安排。正式内容需以核验后的报道为准。'},
 {id:'technology',title:'让智能设备更容易使用',text:'示例摘要：围绕大字界面、简化操作等适老化设计，讨论科技怎样方便日常生活。正式内容需以原报道为准。'},
 {id:'old-street',title:'老街更新，留住熟悉的烟火气',text:'示例摘要：老街保护与便民设施改善如何兼顾，成为居民关心的话题。正式内容需核验具体地区和项目。'}
];
function posterMemoirSources(){
 const personal=memoirSources(true);if(personal.length)return personal;
 const seen=new Map();return memoirSources().filter(s=>{const key=s.chapterNo||s.chapterName||'other';if(!seen.has(key)&&seen.size>=3)return false;const count=seen.get(key)||0;seen.set(key,count+1);return count<2;}).map(s=>({...s,demo:true,sourceLabel:'样式参考 · 蒋老师示例，非你的经历'}));
}
function composeMemoir(d){
 if(d.category!=='怀旧往事')return '';
 const sources=posterMemoirSources().map(s=>window.YunyiMemoirCatalog.normalize(s)),chapters=[...new Set(sources.map(s=>s.chapterName))],chapter=d.memoryChapter||d.memory?.chapterName||(sources[0]?.chapterName||'');
 const value=d.memoirEdited?d.memoirText:(d.memoirText||d.memory?.text||'');
 return `<section class="dp-memoir-reference dp-news-reference"><div class="dp-news-heading"><h2><label for="dp-memoir-text">写一段往事</label></h2><button type="button" class="dp-memoir-entry" data-dp="show-memoir-sources">从回忆录选择 ›</button></div><textarea id="dp-memoir-text" rows="4" placeholder="可以直接写，也可以点击“从回忆录选择”带入。">${esc(value)}</textarea>${d.memory?.demo?'<small class="dp-field-help">当前带入的是示例往事，仅作样式参考。</small>':''}<div id="dp-memoir-sources" hidden>${sources.length?`${sources[0].demo?'<p class="dp-memoir-demo">样式参考 · 蒋老师示例<br>可试选并带入，不是你的个人经历。</p>':''}<p class="dp-field-help">选择章节，再选一段故事</p><div class="dp-memoir-columns"><div class="dp-memory-chapters dp-news-choices" aria-label="选择回忆录章节">${chapters.map(c=>`<button type="button" data-dp="memory-chapter" data-chapter="${esc(c)}" aria-pressed="${chapter===c}"><i aria-hidden="true">${chapter===c?'✓':''}</i><strong>${esc(c)}</strong></button>`).join('')}</div>${chapter?`<div class="dp-news-choices dp-memory-stories">${sources.filter(s=>s.chapterName===chapter).map(s=>`<button type="button" data-dp="select-story" data-memory="${esc(s.id)}" aria-pressed="${d.memory?.id===s.id}"><i aria-hidden="true">${d.memory?.id===s.id?'✓':''}</i><span><strong>${esc(s.title||'我的往事')}</strong><p>${esc(s.text.slice(0,60))}${s.text.length>60?'…':''}</p></span></button>`).join('')}</div>`:''}</div>`:'<p class="dp-memoir-empty">还没有可选的个人回忆录内容，可以先在上方写一段往事。</p>'}</div></section>`;
}
function composeSource(d){
 if(d.category!=='热点资讯')return '';
 const custom=d.newsInput==='custom'||!!d.sourceText||!!d.sourceUrl;
 return `<section class="dp-news-reference"><div class="dp-news-heading"><h2>参考资讯</h2><small>演示内容 · 非实时新闻</small></div><div class="dp-news-choices">${newsReferences.map(x=>`<button type="button" data-dp="select-news" data-reference="${x.id}" aria-pressed="${!custom&&d.topic?.id===x.id}"><i aria-hidden="true">${!custom&&d.topic?.id===x.id?'✓':''}</i><span><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></span></button>`).join('')}<button type="button" data-dp="select-news" data-reference="custom" aria-pressed="${custom}"><i aria-hidden="true">${custom?'✓':''}</i><strong>使用自己的资讯</strong></button></div>${custom?`<div class="dp-source-entry"><label for="dp-source-text">原文或摘要</label><textarea id="dp-source-text" rows="3" maxlength="4000" placeholder="粘贴资讯原文或摘要">${esc(d.sourceText||'')}</textarea><label for="dp-source-url">原文链接（选填）</label><input id="dp-source-url" type="url" value="${esc(d.sourceUrl||'')}" placeholder="https://…">${sourceLink(d.sourceUrl)}<small>暂不读取链接，请粘贴正文。</small></div>`:''}</section>`;
}
function renderStudio(body){
 const d=studio.draft;
 if(mode==='feed'){
  body.innerHTML=`<div class="dp-feed-top"><span>${Number(today().slice(5,7))}月${Number(today().slice(8))}日</span><nav>${button('subscriptions','订阅内容')}${button('identity','署名')}</nav></div><section class="dp-create-intro"><small>把日子，写成自己的作品</small><h1>今天，想分享点什么？</h1><p>一句话、一张照片，都是你的故事。</p><div class="dp-create-choices">${button('compose','我想分享','dp-primary')}</div></section><div class="dp-section-line"><h2>分享海报</h2></div><p class="dp-field-help">当前图片为原型样例，非每日新生成。</p>${renderTimeline()}`;body.scrollTop=gridScroll;return;
 }
 if(mode==='compose'){
  const category=d.category||'随心分享',hint={随心分享:'例如：退休以后，更想把日子过得从容些。',热点资讯:'你怎么看这件事？不写也可以。',每日健康:'可以说说自己的日常习惯或关心的问题。',怀旧往事:'这段往事或照片，让你想起了什么？',每日一卦:'这段卦意，让你想到了什么？',每日诗句:'这句诗为什么打动你？',节日关怀:'想对谁说些什么？比如：重阳节，祝父母平安顺遂。',每日祝福:'想给谁送上一句什么样的祝福？'}[category];
  body.innerHTML=`<button type="button" class="dp-type-trigger" data-dp="open-types" aria-haspopup="dialog"><span><small>类型</small><strong>${esc(category)}</strong></span><span>更换 ›</span></button>${composeSource(d)}${composeMemoir(d)}<label class="dp-input-label" for="dp-my-words">你的感受${category==='怀旧往事'?'（选填）':''}</label><textarea id="dp-my-words" maxlength="1000" rows="4" placeholder="${hint}">${esc(d.text)}</textarea><div class="dp-compose-tools">${button('add-photo','<span aria-hidden="true">＋</span><b>'+(d.photo?'换照片':'放照片')+'</b>')}</div>${d.photo?`<figure class="dp-input-photo"><img src="${esc(d.photo.url)}" alt="选中的照片"><figcaption>${esc(d.photo.name)} ${button('remove-photo','移除')}</figcaption></figure>`:''}${d.memory&&category!=='怀旧往事'?`<div class="dp-selected-memory"><small>${esc(d.memory.sourceLabel)}</small><strong>${esc(d.memory.title)}</strong><p>${esc(d.memory.text.slice(0,100))}…</p>${button('remove-memory','移除回忆')}</div>`:''}<div class="dp-compose-bottom">${button('submit-poster','生成我的海报','dp-primary')}</div>`;return;
 }
 if(mode==='memory'){body.innerHTML=`<div class="dp-settings-intro"><h1>选一段想分享的往事</h1><p>只带入你选中的这一段，不修改回忆原文。</p></div><label class="dp-input-label" for="dp-memory-search">查找回忆</label><input id="dp-memory-search" type="search" value="${esc(memoryQuery)}" placeholder="搜索标题或关键词"><div class="dp-memory-list">${memoryList()}</div>`;return;}
 if(mode==='job'){const job=studio.jobs.find(j=>j.id===activeJob);if(!job){mode='feed';render();return;}body.innerHTML=`<div class="dp-settings-intro"><small>制作记录</small><h1>创作要求已保存</h1><p>将依据你的感受创作文案和画面。当前服务未接入，尚未开始生成。</p></div><div class="dp-job-status">待接入生成服务</div>${job.input.copy?`<div class="dp-topic-context"><strong>${esc(job.input.copy.title)}</strong><p>${esc(job.input.copy.body)}</p></div>`:''}${inputSummary(job.input)}<p class="dp-field-help">落款：${esc(job.settings.penName)} · 文字或印章按画面择一<br>当前没有生成中的后台任务，也未对外发送。</p><div class="dp-compose-bottom">${button('edit-draft','再做一张','dp-primary')}${button('feed','返回分享海报')}</div>`;}
}
function mountComposerActions(){
 if(!['compose','review'].includes(mode))return;
 const actions=root.querySelector('.dp-compose-bottom');if(actions){actions.classList.add('dp-action-dock');root.append(actions);}
 if(mode==='review'){const back=root.querySelector('[data-dp="back"]');if(back)back.dataset.dp='edit-draft';}
}
function closeMemoirPicker(){const dialog=root.querySelector('.dp-memoir-sheet');if(dialog){dialog.close();dialog.remove();}root.querySelector('[data-dp="show-memoir-sources"]')?.focus({preventScroll:true});}
function openMemoirPicker(){
 if(!persistDraft())return;
 const dialog=document.createElement('dialog');dialog.className='ivq-body dp-memoir-sheet';dialog.setAttribute('aria-labelledby','dp-memoir-picker-title');
 dialog.innerHTML=`<div class="ivq-handle"></div><div class="ivq-h" id="dp-memoir-picker-title">选择回忆录内容</div>${root.querySelector('#dp-memoir-sources')?.innerHTML||''}<div class="ivq-actions">${button('close-memoir-picker','取消','cancel')}</div>`;
 const columns=dialog.querySelector('.dp-memoir-columns');if(columns)columns.className='ivq-list linked';
 const chapters=dialog.querySelector('.dp-memory-chapters');if(chapters)chapters.className='ivq-chapters';
 const stories=dialog.querySelector('.dp-memory-stories');if(stories)stories.className='ivq-questions';
 dialog.querySelectorAll('[data-dp="memory-chapter"]').forEach(el=>{el.className='ivq-tab'+(el.getAttribute('aria-pressed')==='true'?' on':'');el.querySelector('i')?.remove();});
 dialog.querySelectorAll('[data-dp="select-story"]').forEach(el=>{el.className='ivq-question'+(el.getAttribute('aria-pressed')==='true'?' on':'');el.querySelector('i')?.remove();el.querySelector('span').className='ivq-txt';});
 const note=dialog.querySelector('.dp-memoir-demo');if(note){note.className='ivq-s';note.textContent='蒋老师示例 · 仅作样式参考';}
 dialog.querySelector('.dp-field-help')?.remove();
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeMemoirPicker();});root.append(dialog);const rect=root.getBoundingClientRect(),height=Math.min(rect.height*.7,window.innerHeight*.8);Object.assign(dialog.style,{left:rect.left+'px',top:(Math.min(rect.bottom,window.innerHeight)-height)+'px',bottom:'auto',right:'auto',width:rect.width+'px',height:height+'px',maxHeight:height+'px',margin:'0'});dialog.showModal();
}
function closeTypePicker(){const dialog=root.querySelector('.dp-type-sheet');if(dialog){dialog.close();dialog.remove();}root.querySelector('[data-dp="open-types"]')?.focus({preventScroll:true});}
function openTypePicker(){
 stopVoice();if(!persistDraft())return;
 const dialog=document.createElement('dialog');dialog.className='dp-type-sheet';dialog.setAttribute('aria-labelledby','dp-type-title');
 const hints={'随心分享':'生活感受，想说就说','每日祝福':'送一句真心的问候','热点资讯':'聊聊关心的新鲜事','每日健康':'分享日常生活习惯','每日一卦':'读卦意，聊感悟','怀旧往事':'重温照片里的往事','节日关怀':'给牵挂的人送祝福','每日诗句':'借一句诗表达心意'};
 dialog.innerHTML=`<header><div><small>想换一种表达？</small><h2 id="dp-type-title">选择分享类型</h2></div>${button('close-types','关闭')}</header><div class="dp-type-options">${studioCore.CATEGORIES.map(c=>`<button type="button" data-dp="choose-type" data-category="${c}" aria-pressed="${studio.draft.category===c}"><strong>${c}</strong><small>${hints[c]}</small><i aria-hidden="true">${studio.draft.category===c?'✓':''}</i></button>`).join('')}</div>`;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeTypePicker();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom||e.clientX<r.left||e.clientX>r.right)closeTypePicker();}});root.append(dialog);dialog.showModal();
}
function startCompose(){if(studio.draft.topic?.referenceOnly)studio.draft.topic=null;mode='compose';render();}
const photoPicker=document.createElement('input');photoPicker.type='file';photoPicker.accept='image/jpeg,image/png,image/webp';photoPicker.id='dp-photo-picker';photoPicker.hidden=true;document.body.append(photoPicker);
photoPicker.addEventListener('change',async()=>{const file=photoPicker.files[0];if(!file)return;busy=true;try{if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('请选择 JPG、PNG 或 WebP 照片。');if(file.size>1024*1024)throw Error('本地原型请使用1MB以内的照片。');const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('照片读取失败，请重试。'));r.readAsDataURL(file);});const img=new Image();img.src=url;await img.decode();if(persistStudio({...studio,draft:{...studio.draft,photo:{name:file.name,url,width:img.naturalWidth,height:img.naturalHeight}}})){mode='compose';render();}}catch(e){notice(e.message||'照片读取失败，请重试。');}finally{busy=false;photoPicker.value='';}});
root.addEventListener('input',e=>{if(e.target.id==='dp-pen-name'){const note=root.querySelector('.dp-sign-preview-note');if(note)note.textContent=e.target.value.trim()==='云山'?'当前展示「云山」落款效果。':'以上为「云山」风格示例，你的笔名专属效果待接入生成。';}if(['dp-memoir-text','dp-source-text','dp-source-url','dp-my-words'].includes(e.target.id)){studio.draft[e.target.id==='dp-memoir-text'?'memoirText':e.target.id==='dp-source-text'?'sourceText':e.target.id==='dp-source-url'?'sourceUrl':'text']=e.target.value;if(e.target.id==='dp-memoir-text')studio.draft.memoirEdited=true;studio.draft.copy=null;persistStudio(studio);}if(e.target.id==='dp-memory-search'){memoryQuery=e.target.value;root.querySelector('.dp-memory-list').innerHTML=memoryList();}});
function recordSelected(){const id=previewIds()[index];if(!(studio.selected||[]).some(s=>s.id===id))persistStudio({...studio,selected:[...(studio.selected||[]),{id,day:today()}]});}
function stopVoice(){if(recognition){recognition.abort();recognition=null;}}
async function studioClick(e){
 const b=e.target.closest('[data-dp]');if(!b)return false;const a=b.dataset.dp;
 if(a==='back')stopVoice();
 if(a==='signature-style'){if(signatureStyles.some(x=>x.id===b.dataset.style)){signatureChoice=b.dataset.style;root.querySelectorAll('[data-dp="signature-style"]').forEach(el=>{const chosen=el.dataset.style===signatureChoice;el.setAttribute('aria-pressed',String(chosen));el.querySelector('i').textContent=chosen?'✓':'';});}return true;}
 if(a==='open-types'){openTypePicker();return true;}
 if(a==='close-types'){closeTypePicker();return true;}
 if(a==='choose-type'){if(!persistDraft())return true;const category=b.dataset.category;if(studioCore.CATEGORIES.includes(category)&&persistStudio({...studio,draft:{...studio.draft,category,copy:null,newsInput:category==='热点资讯'?studio.draft.newsInput:null,sourceText:category==='热点资讯'?studio.draft.sourceText:'',sourceUrl:category==='热点资讯'?studio.draft.sourceUrl:'',topic:studio.draft.topic?.category===category?studio.draft.topic:null}})){root.querySelector('.dp-type-sheet')?.close();mode='compose';render();root.querySelector('[data-dp="open-types"]')?.focus({preventScroll:true});}return true;}
 if(a==='show-memoir-sources'){openMemoirPicker();return true;}
 if(a==='close-memoir-picker'||a==='write-memoir'){closeMemoirPicker();if(a==='write-memoir')root.querySelector('#dp-memoir-text')?.focus();return true;}
 if(['memory-chapter','memory-manual','select-story'].includes(a)){
  const inPicker=!!b.closest('.dp-memoir-sheet');
  if(!persistDraft())return true;
  const draft={...studio.draft,copy:null};
  if(a==='memory-chapter'){draft.memoryChapter=b.dataset.chapter;}
  if(a==='memory-manual'){draft.memoryMode='manual';draft.memory=null;}
  if(a==='select-story'){const source=posterMemoirSources().find(s=>s.id===b.dataset.memory);if(!source)return true;const current=draft.memoirText||'';if(current.trim()&&current!==source.text&&current!==draft.memory?.text&&!window.confirm('用这段故事替换已写的往事？'))return true;draft.memoirText=source.text;draft.memoirEdited=true;draft.memory=window.YunyiMemoirCatalog.normalize(source);draft.memoryMode='selected';draft.memoryChapter=draft.memory.chapterName;}
  if(persistStudio({...studio,draft})){if(inPicker)closeMemoirPicker();mode='compose';render();if(inPicker&&a==='memory-chapter')openMemoirPicker();if(inPicker&&a==='select-story')root.querySelector('#dp-memoir-text')?.focus();}return true;
 }
 if(a==='select-news'){if(!persistDraft())return true;const ref=newsReferences.find(x=>x.id===b.dataset.reference),custom=b.dataset.reference==='custom';if(!custom&&!ref)return true;const draft={...studio.draft,copy:null,newsInput:custom?'custom':'selected',topic:custom?null:{...ref,category:'热点资讯',sourceLabel:'演示资讯 · 非实时新闻',demo:true},sourceText:custom?studio.draft.sourceText:'',sourceUrl:custom?studio.draft.sourceUrl:''};if(persistStudio({...studio,draft})){mode='compose';render();}return true;}
 if(a==='choose-example'){if(!persistDraft())return true;const example=composeExamples[studio.draft.category]?.[Number(b.dataset.example)];if(example&&persistStudio({...studio,draft:{...studio.draft,copy:null,topic:{...example,category:studio.draft.category}}})){mode='compose';render();}return true;}
 if(a==='samples'){mode='samples';gridScroll=0;render();return true;}
 if(a==='sample-thought'){if(hasDraft()){notice('先继续完成已有草稿，再选择新话题。');return true;}if(persistStudio({...studio,draft:{...studioCore.empty(),topic:{id:'bamboo',category:'每日祝福',title:'清风作伴',text:'愿你眉间舒展，心上无忧。'}}}))startCompose();return true;}
 if(['feed','archive'].includes(a)){stopVoice();if(mode==='compose'&&!persistDraft())return true;mode='feed';gridScroll=0;message='';render();return true;}
 if(['compose','resume','new-photo','new-memory'].includes(a)){startCompose();if(a==='new-photo')photoPicker.click();if(a==='new-memory'){mode='memory';memoryQuery='';render();}return true;}
 if(a==='add-photo'){if(persistDraft())photoPicker.click();return true;}
 if(a==='add-memory'){if(persistDraft()){stopVoice();mode='memory';memoryQuery='';render();}return true;}
 if(a==='pick-memory'){const source=memoirSources().find(s=>s.id===b.dataset.memory);if(source&&persistStudio({...studio,draft:{...studio.draft,copy:null,memory:{id:source.id,title:source.title,text:source.text,sourceLabel:source.sourceLabel,sourceHash:source.sourceHash||null}}}))startCompose();return true;}
 if(['remove-photo','remove-memory','remove-topic'].includes(a)){if(!persistDraft())return true;const key=a.slice(7);if(persistStudio({...studio,draft:{...studio.draft,copy:null,[key]:null}})){mode='compose';render();}return true;}
 if(a==='topic-direct'||a==='topic-thought'){const topic=studioCore.recommend(today(),settings()).find(t=>t.id===b.dataset.topic);if(!topic)return true;if(hasDraft()){notice('你还有一份草稿，先继续完成它，再选择新话题。');return true;}if(!persistStudio({...studio,draft:{...studioCore.empty(),category:topic.category,topic}}))return true;if(a==='topic-thought')startCompose();else if(topic.needsMemory){mode='memory';render();}else if(topic.needsText)startCompose();else{mode='review';render();}return true;}
 if(a==='review'){stopVoice();if(!persistDraft())return true;const error=studioCore.validate(studio.draft);if(error){notice(error);return true;}mode='review';message='';render();return true;}
 if(a==='discard-draft'){stopVoice();if(window.confirm('清空这份草稿？已提交的制作记录不受影响。')&&persistStudio({...studio,draft:studioCore.empty()})){mode='feed';render();}return true;}
 if(a==='edit-draft'){startCompose();return true;}
 if(a==='submit-poster'){stopVoice();if(!persistDraft())return true;const error=studioCore.validate(studio.draft);if(error){notice(error);return true;}try{const result=studioCore.submit(studio,settings(),Date.now());if(persistStudio(result.state)){activeJob=result.job.id;mode='job';render();}}catch(err){notice(err.message);}return true;}
 if(a==='job'){activeJob=b.dataset.job;mode='job';render();return true;}
 if(a==='voice'){
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Speech){notice('当前浏览器不支持语音识别，可用手机键盘的麦克风输入。');root.querySelector('#dp-my-words')?.focus();return true;}
  if(recognition){stopVoice();b.innerHTML='<span aria-hidden="true">◉</span><b>语音说</b>';return true;}
  recognition=new Speech();recognition.lang='zh-CN';recognition.interimResults=false;recognition.continuous=false;
  recognition.onresult=event=>{if(mode!=='compose')return;const text=[...event.results].filter(r=>r.isFinal).map(r=>r[0].transcript).join('');studio.draft.copy=null;studio.draft.text+=(studio.draft.text?'\n':'')+text;root.querySelector('#dp-my-words').value=studio.draft.text;persistStudio(studio);};
  recognition.onerror=()=>notice('语音识别未完成，可以重试或直接输入。');recognition.onend=()=>{recognition=null;const button=root.querySelector('[data-dp="voice"]');if(button){button.setAttribute('aria-pressed','false');button.innerHTML='<span aria-hidden="true">◉</span><b>语音说</b>';}};
  try{recognition.start();b.innerHTML='<span aria-hidden="true">■</span><b>结束录音</b>';b.setAttribute('aria-pressed','true');notice('请说出你的想法，识别后可再修改。');}catch{recognition=null;notice('语音暂时无法启动，请直接输入。');}return true;
 }
 return false;
}
function updateKeyboardInset(){const v=window.visualViewport;root.style.setProperty('--dp-keyboard',window.innerWidth<=600&&v?Math.max(0,window.innerHeight-v.height-v.offsetTop)+'px':'0px');}
window.visualViewport?.addEventListener('resize',updateKeyboardInset);window.visualViewport?.addEventListener('scroll',updateKeyboardInset);

window.addEventListener('storage',e=>{if(e.key===STUDIO_KEY&&e.newValue&&mode!=='compose'&&mode!=='review'){try{studio=studioCore.init(JSON.parse(e.newValue));if(root.classList.contains('on'))render();}catch{notice('制作记录同步失败，请稍后刷新。');}}});
let openerIndex=0,previewReturn='grid';
function canShareImage(){try{return !!navigator.share&&!!navigator.canShare?.({files:[new File([new Uint8Array([137,80,78,71])],'海报.png',{type:'image/png'})]});}catch{return false;}}

function closePreview(){if(busy)return;root.querySelector('.dp-preview')?.remove();mode=previewReturn;render();root.querySelector('.dp-card[data-day="'+previewGroup?.date+'"][data-index="'+openerIndex+'"]')?.focus({preventScroll:true});}
function renderPreview(){
 const p=find(previewIds()[index]);let dialog=root.querySelector('.dp-preview');
 if(!dialog){dialog=document.createElement('dialog');dialog.className='dp-preview';dialog.setAttribute('aria-label','海报预览');root.append(dialog);
 dialog.addEventListener('cancel',e=>{e.preventDefault();closePreview();});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePreview();}});
 }
 const action=document.activeElement?.dataset.dp;
 dialog.innerHTML=`<button class="dp-preview-close" type="button" data-dp="close" aria-label="关闭预览">×</button><div class="dp-preview-content"><div class="dp-image-area"><img class="dp-large" src="${src(p)}" alt="${esc(p.title+'。'+p.body)}"></div><div class="dp-preview-footer"><div class="dp-pagination"><button type="button" data-dp="prev" aria-label="上一张">‹</button><span aria-live="polite">${index+1} / ${previewIds().length}</span><button type="button" data-dp="next" aria-label="下一张">›</button></div><div class="dp-actions">${button('save','保存图片','dp-primary')}${canShareImage()?button('share','分享图片'):''}</div></div></div><div class="dp-notice" role="status" aria-live="polite"></div>`;
 if(!dialog.open)dialog.showModal();
 dialog.querySelector('[data-dp="'+(action==='prev'||action==='next'?action:'close')+'"]')?.focus({preventScroll:true});
}
async function png(i){const p=find(previewIds()[i]);const img=new Image();img.src=src(p);await img.decode();const c=document.createElement('canvas');c.width=720;c.height=1280;c.getContext('2d').drawImage(img,0,0,720,1280);return c.toDataURL('image/png');}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
root.addEventListener('click',async e=>{if(busy)return;if(await studioClick(e))return;const sub=e.target.closest('[data-subscription]');if(sub){const id=sub.dataset.subscription;const subscriptions=settings().subscriptions.includes(id)?settings().subscriptions.filter(x=>x!==id):[...settings().subscriptions,id];if(changeSettings({subscriptions})){const scroll=root.querySelector('.dp-body').scrollTop;render();root.querySelector('.dp-body').scrollTop=scroll;root.querySelector('[data-subscription="'+id+'"]')?.focus({preventScroll:true});notice(effectiveMessage());}return;}
const news=e.target.closest('[data-news]');if(news){const topic=news.dataset.news;if(changeSettings({newsTopics:settings().newsTopics.includes(topic)?settings().newsTopics.filter(x=>x!==topic):[...settings().newsTopics,topic]})){const scroll=root.querySelector('.dp-body').scrollTop;render();root.querySelector('.dp-body').scrollTop=scroll;root.querySelector('[data-news="'+topic+'"]')?.focus({preventScroll:true});notice(effectiveMessage());}return;}
const health=e.target.closest('[data-health]');if(health){const t=health.dataset.health;if(changeSettings({healthTopics:settings().healthTopics.includes(t)?settings().healthTopics.filter(x=>x!==t):[...settings().healthTopics,t]})){const scroll=root.querySelector('.dp-body').scrollTop;render();root.querySelector('.dp-body').scrollTop=scroll;root.querySelector('[data-health="'+t+'"]')?.focus({preventScroll:true});notice('关注方向已保存。');}return;}
const b=e.target.closest('[data-dp]');if(!b||busy)return;const a=b.dataset.dp;message='';
if(a==='close'){closePreview();return;}
if(a==='home'){go('session');return;}
if(a==='subscriptions'||a==='identity'){gridScroll=root.querySelector('.dp-body').scrollTop;if(a==='identity')signatureChoice=settings().signatureStyle||'zhuwen';mode=a;render();return;}
if(a==='save-identity'){const name=root.querySelector('#dp-pen-name').value.trim();if(!name||[...name].length>12||/[<>\n\r]/.test(name)){notice('请填写1—12个字的笔名。');root.querySelector('#dp-pen-name').focus();return;}if(changeSettings({penName:name,signatureStyle:signatureChoice})){mode='feed';render();notice('落款已保存，新海报将沿用这份个人印记。');}return;}
if(a==='back'){if(mode==='compose'){if(!persistDraft())return;mode='feed';}else if(mode==='memory'||mode==='review'){mode='compose';}else mode='feed';render();return;}
if(a==='open'){previewReturn=mode;previewGroup=JSON.parse(JSON.stringify(mode==='samples'?{date:today(),key:'samples',ids:items.map(p=>p.id)}:(mode==='feed'?timelineGroups():displayedGroups()).find(g=>(g.key||g.date)===b.dataset.group)||null));if(!previewGroup)return;gridScroll=root.querySelector('.body').scrollTop;index=Number(b.dataset.index);openerIndex=index;mode='detail';render();return;}
if(a==='prev'||a==='next'){index=(index+(a==='prev'?previewIds().length-1:1))%previewIds().length;render();return;}
if(['save','share'].includes(a)){busy=true;b.disabled=true;try{const list=[index];const files=[];for(const i of list){const data=await png(i),bytes=Uint8Array.from(atob(data.split(',')[1]),x=>x.charCodeAt(0));files.push({name:find(previewIds()[i]).title+'.png',data:bytes,cat:find(previewIds()[i]).cat});}
if(a==='share'){const f=new File([files[0].data],files[0].name,{type:'image/png'});if(navigator.canShare?.({files:[f]})&&navigator.share){await navigator.share({files:[f]});recordSelected();notice('已完成系统分享操作。');}else{notice('当前浏览器不支持图片分享，请保存图片后到微信发布。');}}else{download(new Blob([files[0].data],{type:'image/png'}),files[0].name);recordSelected();notice('已发起图片下载，请查看浏览器下载。');}
}catch(err){notice(err.name==='AbortError'?'已取消分享。':'图片暂未保存成功，请重试。');}finally{busy=false;b.disabled=false;}}
});
root.addEventListener('submit',e=>{e.preventDefault();root.querySelector('[data-dp="save-identity"]')?.click();});
// Horizontal swipes only; preserve vertical scrolling and long-press saving.
let touchStart=null;
root.addEventListener('touchstart',e=>{touchStart=mode==='detail'&&e.target.closest('.dp-large')&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
root.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
root.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(!busy&&mode==='detail'&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){index=(index+(dx<0?1:previewIds().length-1))%previewIds().length;render();}},{passive:true});
// Mouse dragging mirrors touch swipes in the desktop prototype.
let mouseStart=null;
root.addEventListener('dragstart',e=>{if(e.target.closest('.dp-large'))e.preventDefault();});
root.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&mode==='detail'&&e.target.closest('.dp-large')){mouseStart={x:e.clientX,y:e.clientY};e.target.setPointerCapture(e.pointerId);}});
root.addEventListener('pointercancel',()=>{mouseStart=null;});
root.addEventListener('pointerup',e=>{if(!mouseStart||e.pointerType!=='mouse')return;const dx=e.clientX-mouseStart.x,dy=e.clientY-mouseStart.y;mouseStart=null;if(!busy&&mode==='detail'&&Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){index=(index+(dx<0?1:previewIds().length-1))%previewIds().length;render();}});
const originalGo=window.go;window.go=function(id){if(id==='daily-posters'){mode='feed';gridScroll=0;previewGroup=null;ensureDay();commit({...state,lastUsed:today()});render();history.replaceState(null,'','#daily-posters');}else if(root.classList.contains('on'))history.replaceState(null,'','#'+id);return originalGo(id);};
window.addEventListener('focus',()=>{if(root.classList.contains('on')&&['feed','grid'].includes(mode))render();});
window.addEventListener('storage',e=>{if(e.key!==KEY||!e.newValue)return;try{state=core.init(JSON.parse(e.newValue),items,today());if(root.classList.contains('on')&&['feed','grid'].includes(mode))render();}catch{notice('其他窗口的设置暂未同步，请刷新重试。');}});
window.YunyiDailyPosters={exportPNG:png,getPlan:()=>studioCore.recommendationPlan(today(),settings()),getState:()=>JSON.parse(JSON.stringify(state)),getStudio:()=>JSON.parse(JSON.stringify(studio))};
})();
