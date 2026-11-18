/* Topic-first local prototype. Generating a poster requires a connected service. */
(function(scope){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const CATEGORIES=['随心分享','每日祝福','热点资讯','每日健康','每日一卦','怀旧往事','节日关怀','每日诗句'];
const empty=()=>({category:'随心分享',text:'',photo:null,memory:null,topic:null,copy:null,sourceText:'',sourceUrl:'',memoirText:'',memoryMode:null,memoryChapter:''});
function init(raw){return {version:1,selected:Array.isArray(raw?.selected)?raw.selected.filter(x=>x&&typeof x.id==='string'&&typeof x.day==='string'):[],draft:raw?.version===1&&raw.draft?{...empty(),...raw.draft}:empty(),jobs:raw?.version===1&&Array.isArray(raw.jobs)?raw.jobs.filter(j=>j&&typeof j.id==='string'&&j.input&&j.status==='not_connected'):[]};}
const seed=s=>[...s].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
const SUBSCRIPTIONS={news:'热点资讯',health:'每日健康',folk:'每日一卦',memory:'怀旧往事',festival:'节日关怀',poetry:'每日诗句'};
function recommendationPlan(day,settings){
 const types=['blessing',...Object.keys(SUBSCRIPTIONS).filter(id=>(settings.subscriptions||[]).includes(id))];
 return types.map(type=>({date:day,type,category:SUBSCRIPTIONS[type]||'每日祝福',count:1,status:'planned',requiresVerifiedFestival:type==='festival'}));
}
function recommend(day,settings,context={}){
 const blessings=[
 {id:'small-joy',category:'每日祝福',title:'今天，有什么小欢喜？',prompt:'一顿合口的饭、一朵刚开的花，都值得留下一张。',text:'心有闲处，日有小欢。'},
 {id:'greeting',category:'每日祝福',title:'给惦记的人，一句问候',prompt:'把今天的好心情，送给心里惦记的人。',text:'愿你眉间舒展，心上无忧。'},
 {id:'confidence',category:'每日祝福',title:'一路走来，你最珍惜什么？',prompt:'把自己的坚持，写成一句有分量的话。',text:'不露锋芒，自有分量。'}
 ];
 const news=settings.newsTopics?.length?settings.newsTopics.join('、'):'综合资讯',health=settings.healthTopics?.length?settings.healthTopics.join('、'):'日常健康';
 const optional={
  news:{id:'news',category:'热点资讯',title:'聊聊你关注的'+news,prompt:'资讯来源尚未接入。可以先说说自己的见闻，不把个人看法当作新闻事实。',text:'',requiresSource:true},
  health:{id:'health',category:'每日健康',title:'最近，你怎样照顾自己？',prompt:'关注'+health+'。健康知识待审核来源接入，可以先记录自己的生活习惯。',text:'',requiresSource:true},
  folk:{id:'folk-qian',category:'每日一卦',title:'有本事，需要处处证明吗？',prompt:'地山谦：地中有山，谦。想起一段自己的经历，也可以说一说。',text:'不露锋芒，自有分量。\n地中有山，谦。\n有本领而不自满，有成绩而不居功。\n谦和待人，笃定做事。',sourceLabel:'谦卦主题样例 · 非个人起卦'},
  memory:{id:'memory',category:'怀旧往事',title:'哪段往事，让你至今难忘？',prompt:'从回忆录选一段，再加上今天回头看的感受。',text:'',needsMemory:true},
  festival:{id:'festival',category:'节日关怀',title:'送一份节日关怀',text:'',requiresSource:true},
  poetry:{id:'poetry',category:'每日诗句',title:'哪句诗，陪你走过一段日子？',prompt:'写下记得的诗句，也说说它为什么打动你。引用原文在制作时核对出处。',text:'',needsText:true}
 };
 const choices=recommendationPlan(day,settings).filter(p=>p.type!=='blessing'&&(p.type!=='festival'||context.verifiedFestival===true)).map(p=>optional[p.type]);
 return clone([blessings[seed(day)%3],...choices].map(t=>({...t,date:day})));

}
const PROMPT_VERSION='daily-share-v2.2';
const TYPE_PROMPTS={
 '随心分享':'抓住感受或照片中的一个具体细节，表达用户真实情绪；不强行转为祝福。不识别照片人物身份、地点或关系，信息不足用中性描述。标题6—16字，正文20—60字。',
 '每日祝福':'围绕一个明确的祝愿或问候，语言温暖有精神，避免万能鸡汤和保证好运。有真实对象则贴合对象，无对象写普适祝愿，不编造家庭关系。标题6—16字，正文20—50字。',
 '热点资讯':'仅依据可核验素材提取一个事实重点，保留报道日期、来源与适用地区。用户有感受才写其观点；无感受采用中性摘要，不冒称用户赞同。事实与观点分区，不煽情夸大，不用示意画面冒充新闻现场。标题8—20字，事实摘要30—70字，个人观点可选且不超过30字。',
 '每日健康':'一次只讲一个经审核的实用知识点，写清适用人群与必要限制，提供1—3个简短可执行要点，不做诊断、不推荐药量、不许诺疗效。若只有个人感受，明确作为生活表达，不升级为健康知识。标题6—16字，正文40—90字，保留来源。',
 '每日一卦':'从核验卦象库选取匹配主题的一卦，以准确六爻为视觉重点，卦名、上下卦、爻序一致。结构为有气度的标题、短原典、现代读卦；肯定用户态度，不虚构成就。原典与解读分开，底部呈现卦象及“卦名 · 今日读卦”。不以八卦罗盘代替六爻，不称命运预测。标题6—16字，原典不超过20字，解读30—60字。',
 '怀旧往事':'以memoirText当前编辑稿为准，memory仅作来源追溯。选一个真实细节，写出今天回望的情绪，不照搬整章，不添加人物、年代、对白、成就。没有感受时温和回望，不强加悲喜；示例只能作为演示。标题6—16字，正文30—80字。',
 '节日关怀':'使用已核验节日、适用地区与目标日期；祝福对象来自用户明确资料，没有对象用泛称。主动提前制作可表达节日祝愿，不把未到的节日说成今天。标题6—16字，正文20—60字，不虚构亲属关系。',
 '每日诗句':'优先核对用户指定诗句，否则从核验诗库按情绪选一句。保留准确原句、作者与作品名，个人感悟单独表达，不改写原诗冒充引用。引用1—2句、原则上不超过28字；感悟20—50字。未核验引用不得输出伪造出处。'
};
const SIGNATURE_PROMPTS={
 script:'仅书写输入笔名，行书，墨色，笔势自然，字形可辨；不得增字、署他人名或添加印章。透明背景，完整保留笔画。',
 zhuwen:'仅刻输入笔名，朱文印章，红字透明底，章法疏密均衡，印边克制；不得增添吉语、姓名、符号。不能为美观改变字义或缺笔。',
 baiwen:'仅刻输入笔名，白文印章，朱红印面与透明镂空字，印面外透明；章法均衡，笔画完整，不加吉语或其他署名。'
};
const IMAGE_PROMPT='生成720×1280、9:16完整中文海报，标题正文来源及落款全部在图内。逐字使用已通过核验的文案，不自行新增改写。按layoutId设计，正文不遮人物面部、手和照片重点；四边至少48像素安全区，正文建议32—40像素，来源不小于24像素，标题48—72像素；容纳不下先精简文案，不缩成小字。匹配当前身份资产，每张仅一种签名或印章，字形保持，按构图安排；卦象底部信息区清楚可读。不把生成景色或示意图冒充实拍，不改变原照片人物身份。不要水印、按钮、营销二维码或额外口号。';
function scopedDraft(d){
 const category=d.category||'随心分享';
 return {...d,category,memory:category==='怀旧往事'?d.memory:null,memoirText:category==='怀旧往事'?d.memoirText:'',memoirEdited:category==='怀旧往事'?!!d.memoirEdited:false,memoryMode:category==='怀旧往事'?d.memoryMode:null,memoryChapter:category==='怀旧往事'?d.memoryChapter:'',sourceText:category==='热点资讯'?d.sourceText:'',sourceUrl:category==='热点资讯'?d.sourceUrl:'',newsInput:category==='热点资讯'?d.newsInput:null,topic:d.topic&&(!d.topic.category||d.topic.category===category)?d.topic:null};
}
function validate(d){d=scopedDraft(d);if(d.category==='怀旧往事'&&!(d.memoirEdited?d.memoirText?.trim():(d.memoirText?.trim()||d.memory?.text?.trim())))return '先选择一段故事，或写一段想起的往事。';if(d.category==='热点资讯'&&!d.topic?.text&&!d.sourceText?.trim())return '先选择一条参考资讯，或粘贴自己的资讯内容。';if(d.topic?.referenceOnly&&!(d.text?.trim()||d.photo||d.memory||d.sourceText?.trim()))return '请写下自己的感受或放张照片，案例只作为表达参考。';if(!(d.text?.trim()||d.memoirText?.trim()||d.photo||d.memory||d.topic?.text||d.sourceText?.trim()))return '先写一句话、放张照片，或选一段回忆。';if((d.text||'').length>1000)return '自己的话请控制在1000字以内。';if(d.topic?.needsMemory&&!d.memory)return '先选一段想分享的回忆。';if(d.topic?.needsText&&!d.text.trim())return '先写下想分享的诗句或感受。';if(d.topic?.requiresSource&&!d.text.trim()&&!d.photo&&!d.memory)return '推荐内容还未接入，可以先补充自己的见闻或感受。';return '';}
function prepareBrief(d,settings={},context={}){d=scopedDraft(d);return {promptVersion:PROMPT_VERSION,trigger:context.trigger||'manual',date:context.date||null,region:context.region||null,preferences:{healthTopics:clone(settings.healthTopics||[]),newsTopics:clone(settings.newsTopics||[])},sourceStatus:'pending_verification',typeInstructions:TYPE_PROMPTS[d.category],imageInstructions:IMAGE_PROMPT,layoutId:null,recentHistory:[],category:d.category||'随心分享',demo:!!(d.memory?.demo||d.topic?.demo),feelings:d.text||'',photo:d.photo||null,memory:d.memory||null,memoirText:d.category==='怀旧往事'?(d.memoirEdited?d.memoirText||'':d.memoirText||d.memory?.text||''):'',topic:d.topic||null,sourceText:d.sourceText||'',sourceUrl:d.sourceUrl||'',instructions:'怀旧往事以memoirText中的当前编辑稿为准，memory仅为原始来源，不覆盖用户修改；从当前往事中提炼一个具体细节，感受可为空；不得扩写其他章节的经历，不照搬整章。案例只参考表达方式，不得把案例人物和情节视为用户真实经历；以用户实际输入和照片为准。将用户感受作为创作依据，结合类型和素材重新创作标题、正文及画面；保留情绪和立场，不将感受原文直接当作海报正文，不编造经历与事实。文案有文学素养、具体得体，标题与正文递进。资讯事实与个人观点区分，署名与构图匹配。',steps:['理解感受与核验素材','创作标题和正文','设计画面与排版','生成完整海报']};}

function submit(input,settings,now){const error=validate(input.draft);if(error)throw Error(error);const s=clone(input),snapshot={...scopedDraft(clone(s.draft)),copy:null},brief={...prepareBrief(snapshot,settings),identity:{identityVersion:settings.identityVersion||1,penName:settings.penName,assetStatus:settings.penName==='云山'?'demo':'not_connected',prompt:SIGNATURE_PROMPTS[settings.signatureStyle||'zhuwen'],style:settings.signatureStyle||'zhuwen',referenceAsset:settings.penName==='云山'?'v17/assets/signatures/yunshan-'+(settings.signatureStyle||'zhuwen')+'.png':null,rule:'保持选定落款的字形和章法，按画面调整位置与大小；每张只使用一种落款，其他笔名不得使用云山样例字样。'}},signature=JSON.stringify({snapshot,settings});const old=s.jobs.find(j=>j.signature===signature);if(old)return {state:{...s,draft:empty()},job:old,reused:true};const job={id:'poster-'+now+'-'+Math.random().toString(36).slice(2,8),createdAt:now,status:'not_connected',input:snapshot,creationBrief:brief,settings:clone(settings),signature};s.jobs.unshift(job);s.draft=empty();return {state:s,job,reused:false};}
const api={init,empty,recommendationPlan,recommend,validate,submit,prepareBrief,CATEGORIES,PROMPT_VERSION,TYPE_PROMPTS,SIGNATURE_PROMPTS,IMAGE_PROMPT};if(typeof module==='object'&&module.exports)module.exports=api;else scope.YunyiPosterStudio=api;
})(typeof window!=='undefined'?window:globalThis);
