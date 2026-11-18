const assert=require('node:assert/strict'),s=require('../daily-poster-studio.js'),rules=require('../daily-posters-core.js');
const prefs={subscriptions:[],healthTopics:[],newsTopics:[],penName:'云山',identityVersion:1};
assert.equal(s.recommend('2026-11-17',prefs).length,1);assert.deepEqual(s.recommend('2026-11-17',prefs),s.recommend('2026-11-17',prefs));
const withNews={...prefs,subscriptions:['news'],newsTopics:['科技新知']};assert.ok(s.recommend('2026-11-17',withNews).find(t=>t.category==='热点资讯').title.includes('科技新知'));
assert.ok(s.recommend('2026-11-17',{...prefs,subscriptions:['festival']}).every(t=>t.category!=='节日关怀'));
let db=s.init(null);assert.throws(()=>s.submit(db,prefs,1));db.draft.text='我带徒弟时，愿意把手艺教给大家。';const result=s.submit(db,prefs,1);assert.equal(result.job.status,'not_connected');assert.equal(result.state.draft.text,'');assert.equal(result.job.input.text,db.draft.text);const next=s.submit({...result.state,draft:db.draft},prefs,2);assert.equal(next.state.jobs.length,1);assert.ok(next.reused);prefs.penName='青山';assert.equal(result.job.settings.penName,'云山');
const old=rules.init({version:3,active:{penName:'云山'},groups:[]},[],'2026-11-17');const changed=rules.update(old,{subscriptions:['poetry']},'2026-11-17',true);assert.deepEqual(changed.active.subscriptions,['poetry']);assert.equal(changed.pending,null);
assert.ok(s.validate({...s.empty(),topic:{requiresSource:true}}));assert.ok(s.validate({...s.empty(),topic:{needsMemory:true},text:'过去'}));
console.log('PASS studio: subscription-sized recommendations, preferences, no fake festival, validation, explicit-submit-only, immutable input, deduplication');

assert.equal(s.validate({...s.empty(),photo:{name:'photo.jpg',url:'data:image/jpeg;base64,x'}}),'');
const typed={...s.init(null),draft:{...s.empty(),category:'每日一卦',text:'不露锋芒，自有分量。'}};assert.equal(s.submit(typed,prefs,3).job.input.category,'每日一卦');
console.log('PASS chosen category and photo-only input');

assert.equal(s.empty().category,'随心分享');const brief=s.prepareBrief({...s.empty(),text:'我的原话'});assert.equal(brief.feelings,'我的原话');assert.ok(!('body' in brief));assert.ok(brief.instructions.includes('不将感受原文直接当作海报正文'));assert.equal(result.job.input.copy,null);assert.equal(result.job.creationBrief.feelings,db.draft.text);console.log('PASS feelings become creative brief, not poster copy');

const styled=rules.update(old,{signatureStyle:'baiwen'},'2026-11-17',true);assert.equal(styled.active.signatureStyle,'baiwen');assert.equal(styled.active.identityVersion,old.active.identityVersion+1);const custom=s.submit({...s.init(null),draft:{...s.empty(),text:'感受'}},{...prefs,penName:'青山',signatureStyle:'script'},8);assert.equal(custom.job.creationBrief.identity.referenceAsset,null);assert.equal(custom.job.creationBrief.identity.style,'script');console.log('PASS identity version and custom-name reference boundary');

assert.ok(s.validate({...s.empty(),topic:{text:'虚构经历',referenceOnly:true}}));assert.equal(s.validate({...s.empty(),text:'自己的感受',topic:{text:'案例',referenceOnly:true}}),'');console.log('PASS reference case is not a personal experience');

assert.ok(s.validate({...s.empty(),category:'热点资讯',text:'我的看法'}));assert.equal(s.validate({...s.empty(),category:'热点资讯',sourceText:'已有资讯'}),'');

assert.ok(s.validate({...s.empty(),category:'怀旧往事',photo:{url:'x'},text:'感慨'}));assert.equal(s.validate({...s.empty(),category:'怀旧往事',memoirText:'童年和奶奶一起做饭'}),'');assert.equal(s.validate({...s.empty(),category:'怀旧往事',memory:{text:'一段真实往事'}}),'');assert.equal(s.validate({...s.empty(),category:'怀旧往事',memoirText:'自己写的往事'}),'');assert.ok(s.validate({...s.empty(),category:'怀旧往事',memoirEdited:true,memoirText:'',memory:{text:'原文'}}));

// All 64 subscription combinations: one blessing + one per subscribed type.
const types=['news','health','folk','memory','festival','poetry'];
for(let mask=0;mask<64;mask++){
 const subscriptions=types.filter((_,i)=>mask&(1<<i)),settings={...prefs,subscriptions};
 const plan=s.recommendationPlan('2026-11-18',settings);
 assert.equal(plan.length,1+subscriptions.length);
 assert.deepEqual(plan.map(x=>x.type),['blessing',...subscriptions]);
 assert.ok(plan.every(x=>x.count===1&&x.status==='planned'));
 assert.equal(s.recommend('2026-11-18',settings,{verifiedFestival:true}).length,plan.length);
 assert.equal(s.recommend('2026-11-18',settings).length,plan.length-(subscriptions.includes('festival')?1:0));
}
assert.equal(s.recommendationPlan('2026-11-18',{subscriptions:['news','news','unknown']}).length,2);
assert.deepEqual(s.recommendationPlan('2026-11-18',{...withNews,healthTopics:['睡眠','日常运动']}).map(x=>x.type),['blessing','news']);
console.log('PASS all subscription combinations, deduplication, no unsubscribed replacement or unverified festival');

// Type changes may retain drafts in the UI, but never leak unrelated source material into a request.
const stale={...s.empty(),category:'每日健康',memory:{id:'private',text:'私人往事',demo:true},memoirText:'旧稿'};
assert.ok(s.validate(stale));
const cleanBrief=s.prepareBrief({...stale,text:'今天心情不错'});
assert.equal(cleanBrief.memory,null);assert.equal(cleanBrief.memoirText,'');assert.equal(cleanBrief.demo,false);
const cleanJob=s.submit({...s.init(null),draft:{...stale,text:'今天心情不错'}},prefs,20).job;
assert.equal(cleanJob.input.memory,null);
const demoNews=s.prepareBrief({...s.empty(),category:'热点资讯',topic:{category:'热点资讯',text:'样例',demo:true}});
assert.equal(demoNews.demo,true);
const mismatched=s.prepareBrief({...s.empty(),category:'每日诗句',text:'闲适',topic:{category:'热点资讯',text:'旧新闻',demo:true},sourceText:'旧来源',sourceUrl:'https://example.com'});
assert.equal(mismatched.topic,null);assert.equal(mismatched.sourceText,'');assert.equal(mismatched.sourceUrl,'');
for(const category of s.CATEGORIES){const b=s.prepareBrief({...s.empty(),category,text:'感受'},withNews);assert.ok(b.typeInstructions);assert.equal(b.promptVersion,s.PROMPT_VERSION);assert.ok(b.imageInstructions.includes('720×1280'));assert.equal(b.sourceStatus,'pending_verification');}
assert.equal(Object.keys(s.SIGNATURE_PROMPTS).length,3);
assert.equal(cleanJob.creationBrief.identity.identityVersion,prefs.identityVersion);
console.log('PASS cross-type isolation, demo propagation, eight prompt templates and identity snapshot');
