/* Local prototype rules. No network requests, medical advice or generated facts. */
(function(scope){
'use strict';
const TYPES=['news','health','folk','memory','festival','poetry'];
const NAMES={news:'热点资讯',health:'每日健康',folk:'每日一卦',memory:'怀旧往事',festival:'节日关怀',poetry:'每日诗句'};
const NEWS_TOPICS=['民生政策','社会新闻','科技新知','文化文史','体育赛事','旅游见闻','乡村农业','国际动态'];
const TOPICS=['饮食营养','睡眠','日常运动','关节养护','心情调适','居家防跌倒'];
const clone=x=>JSON.parse(JSON.stringify(x));
const shift=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
const clean=x=>({subscriptions:TYPES.filter(t=>Array.isArray(x?.subscriptions)&&x.subscriptions.includes(t)),healthTopics:TOPICS.filter(t=>Array.isArray(x?.healthTopics)&&x.healthTopics.includes(t)),newsTopics:NEWS_TOPICS.filter(t=>Array.isArray(x?.newsTopics)&&x.newsTopics.includes(t)),signatureStyle:['script','zhuwen','baiwen'].includes(x?.signatureStyle)?x.signatureStyle:'zhuwen',penName:typeof x?.penName==='string'&&x.penName.trim()?x.penName.trim().slice(0,12):'云山',identityVersion:Number.isInteger(x?.identityVersion)&&x.identityVersion>0?x.identityVersion:1});
function init(raw,catalog,day){
 const base={version:3,active:clean({}),pending:null,groups:[],lastUsed:''};
 if(raw?.version===3){base.active=clean(raw.active);if(validDay(raw.pending?.effectiveDate))base.pending={settings:clean(raw.pending.settings),effectiveDate:raw.pending.effectiveDate};base.lastUsed=validDay(raw.lastUsed)?raw.lastUsed:'';
 base.groups=(Array.isArray(raw.groups)?raw.groups:[]).filter(g=>g&&validDay(g.date)&&['ready','preparing'].includes(g.status)&&Array.isArray(g.ids)&&(g.status!=='ready'||(g.ids.length===9&&new Set(g.ids).size===9&&g.ids.every(id=>catalog.some(a=>a.id===id))))).map(g=>({...g,settings:clean(g.settings),plan:Array.isArray(g.plan)?g.plan:[]}));
 base.groups=base.groups.filter((g,i,a)=>a.findIndex(x=>x.date===g.date)===i);
 }else if(raw?.version===2){const settings=clean(raw);if(validDay(raw.effectiveDate)&&raw.effectiveDate>day)base.pending={settings,effectiveDate:raw.effectiveDate};else base.active=settings;
 if(validDay(raw.day)&&raw.ids?.length===9&&new Set(raw.ids).size===9&&raw.ids.every(id=>catalog.some(a=>a.id===id)))base.groups=[{date:raw.day,status:'ready',ids:raw.ids,settings:clean({}),plan:raw.dayPlan||[],sample:true}];
 }
 return advance(base,day);
}
function advance(input,day){const s=clone(input);if(s.pending&&s.pending.effectiveDate<=day){s.active=s.pending.settings;s.pending=null;}s.groups=s.groups.filter(g=>g.date>=shift(day,-6)&&g.date<=day).sort((a,b)=>b.date.localeCompare(a.date));return s;}
const desired=s=>s.pending?s.pending.settings:s.active;
function update(input,patch,day,immediate=false){const s=advance(input,day),previous=desired(s),next=clean({...previous,...patch});if(next.penName!==previous.penName||next.signatureStyle!==previous.signatureStyle)next.identityVersion=previous.identityVersion+1;
 if(JSON.stringify(previous)===JSON.stringify(next))return s;
 if(immediate){s.active=next;s.pending=null;return s;}
 const published=s.groups.some(g=>g.date===day&&g.status==='ready');
 if(published)s.pending={settings:next,effectiveDate:shift(day,1)};
 else{s.active=next;s.pending=null;s.groups=s.groups.filter(g=>g.date!==day);}
 return s;
}
function prepare(input,day,catalog,context={}){
 const s=advance(input,day);if(s.groups.some(g=>g.date===day&&g.status==='ready'))return s;
 s.groups=s.groups.filter(g=>g.date!==day);
 const settings=clone(s.active),requested=TYPES.filter(t=>settings.subscriptions.includes(t)&&(t!=='festival'||context.verifiedFestival===true));
 const categories=[...Array(9-requested.length).fill('每日祝福'),...requested.map(t=>NAMES[t])];
 const count=s.groups.flatMap(g=>g.plan).filter(p=>p.shown==='每日健康').length;
 const healthTopic=settings.healthTopics.length?settings.healthTopics[count%settings.healthTopics.length]:'通用健康';
 const offset=[...day].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7)%Math.max(1,catalog.length);
 const available=[...catalog.slice(offset),...catalog.slice(0,offset)].filter(a=>(a.identityName||'云山')===settings.penName&&a.reviewed!==false);
 const used=new Set(),plan=categories.map(requested=>{
  const asset=available.find(a=>a.cat===requested&&!used.has(a.id)&&(requested!=='热点资讯'||!settings.newsTopics.length||settings.newsTopics.some(t=>a.newsTopic===t||a.newsTopics?.includes(t))))||available.find(a=>a.cat==='每日祝福'&&!used.has(a.id));
  if(asset)used.add(asset.id);
  return {requested,shown:asset?.cat||null,assetId:asset?.id||null,fallback:!!asset&&asset.cat!==requested,healthTopic:requested==='每日健康'?healthTopic:null,newsTopics:requested==='热点资讯'?(settings.newsTopics.length?[...settings.newsTopics]:['综合资讯']):[],reason:asset?(asset.cat===requested?'':'暂无合格同类内容，使用祝福样例'):'暂无署名匹配的合格图片'};
 });
 const ready=plan.every(p=>p.assetId);
 s.groups.unshift({date:day,status:ready?'ready':'preparing',settings,ids:ready?plan.map(p=>p.assetId):[],plan,sample:true,reason:ready?'':'当前署名的图片尚未准备好；原型未接入自动生图。'});
 return s;
}
const api={init,advance,update,prepare,desired,shift,TYPES,NAMES,NEWS_TOPICS};
if(typeof module==='object'&&module.exports)module.exports=api;else scope.YunyiDailyPosterCore=api;
})(typeof window!=='undefined'?window:globalThis);
