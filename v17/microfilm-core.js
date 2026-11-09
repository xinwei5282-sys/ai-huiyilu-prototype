(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.YunyiFilmCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const clean=value=>String(value||'').trim();
  const size=text=>Array.from(text.replace(/\s/g,'')).length;
  function availableSources(sources){
    const valid=sources.filter(s=>s&&clean(s.id)&&clean(s.text)).filter((s,i,all)=>all.findLastIndex(x=>x.id===s.id)===i);
    const recorded=valid.filter(s=>s.kind!=='example');
    return recorded.length?recorded:valid;
  }
  function selectSources(sources,{scope='life',selectedIds=[]}={}){
    const available=availableSources(sources);
    if(scope==='life')return available;
    if(scope!=='fragment')throw Error('请选择人生纪事或岁月片段。');
    const selected=new Set(selectedIds);
    return available.filter(s=>selected.has(s.id));
  }
  function groupSources(sources,basis='chapter'){
    if(!['chapter','stage'].includes(basis))throw Error('请选择按章节或人生阶段选取。');
    const stages={'出生与家族':'生命起点','童年时光':'童年','求学的日子':'求学','参军岁月':'青春与军旅','成家立业':'工作与成家','儿女绕膝':'家庭与儿女'};
    const groups=new Map();
    for(const source of availableSources(sources)){
      const name=basis==='chapter'?(clean(source.chapterName)||'未分章回忆'):(clean(source.stageName)||stages[clean(source.chapterName)]||'未分阶段');
      const id=basis+':'+name;
      if(!groups.has(id))groups.set(id,{id,name,sourceIds:[],sources:[]});
      groups.get(id).sourceIds.push(source.id);groups.get(id).sources.push(source);
    }
    return [...groups.values()];
  }
  function createProject(sources,options={}){
    if(!Array.isArray(sources)||!sources.length||sources.some(s=>!clean(s.text)))throw Error('请先选择有完整正文的回忆。');
    if(!Number.isFinite(+options.duration)||+options.duration<15)throw Error('请选择有效的影片时长。');
    const now=Date.now();
    return {id:'film-'+now+'-'+Math.random().toString(36).slice(2,7),createdAt:now,updatedAt:now,
      title:clean(options.title)||sources[0].title,duration:+options.duration,tone:options.tone||'温暖回望',
      scope:options.scope||'fragment',scopeName:options.scope==='life'?'人生纪事':'岁月片段',selectionBasis:options.selectionBasis||'chapter',groupNames:copy(options.groupNames||[]),
      sources:copy(sources),story:sources.map(s=>clean(s.text)).join('\n\n'),revision:1,
      approval:null,screenplay:null,board:null,stage:'story'};
  }
  function planPhotos(sources){
    return sources.flatMap(source=>(source.photos||[]).map(photo=>{
      const safe=/^(data:image\/(?:png|jpeg|webp);base64,|https?:\/\/|(?:\.\/)?(?:proto-assets|v17)\/)/i.test(photo.url||'');
      const small=photo.width&&photo.height&&Math.min(photo.width,photo.height)<240;
      const unsuitable=!safe||small||photo.review?.relevant===false||photo.review?.usable===false;
      const ready=!unsuitable&&photo.review?.relevant===true&&photo.review?.usable===true;
      return {...copy(photo),sourceId:source.id,status:unsuitable?'unsuitable':ready?'ready':'pending_review',
        reason:!safe?'图片地址不可持久读取':small?'尺寸过小，暂不安排入片':unsuitable?'内容或画质不适合此段':ready?'已核对关联与画质，安排到对应故事':'随故事带入；人物、年代、内容与画质待核对'};
    }));
  }
  function draftScreenplay(p){
    const photoPlan=planPhotos(p.sources);
    const scenes=p.sources.map((source,i)=>{
      const draft=source.kind==='example'&&source.filmDraft;
      return {id:'scene-'+(i+1),title:draft?.heading||source.title,setting:draft?.setting||'地点与时间待本人补充',
        action:draft?.visual||'选用这段回忆对应的旧照片；人物与场景重建待本人确认。',
        narration:draft?.narration||clean(source.text),sourceIds:[source.id]};
    });
    const story=scenes.map((s,i)=>'【第'+(i+1)+'场｜'+s.title+'】\n场景：'+s.setting+'\n画面：'+s.action+'\n旁白：'+s.narration).join('\n\n');
    return {...copy(p),reviewTarget:'screenplay',photoPlan,screenplayDraft:{mode:p.sources.every(s=>s.kind==='example')?'authored_example':'structure_preview',
      directorNote:p.scope==='life'?'以日常生活为线索，按人生顺序串联回忆，用家人与物件的变化连接各场。':'围绕所选岁月展开，只使用当前选中的回忆。',scenes},
      story,approval:null,screenplay:null,board:null,stage:'story'};
  }
  function parseScreenplay(p){
    const blocks=p.story.split(/(?=【第\d+场｜)/).map(clean).filter(Boolean);
    return blocks.map((block,i)=>{
      const heading=block.match(/^【第\d+场｜([^】]+)】/);
      const field=name=>block.match(new RegExp('(?:^|\\n)'+name+'：([\\s\\S]*?)(?=\\n(?:场景|画面|旁白)：|$)'))?.[1]?.trim();
      const narration=field('旁白');
      if(!heading||!field('场景')||!field('画面')||!narration)throw Error('每场剧本须保留场景、画面和旁白，请补全后再确认。');
      return {id:'scene-'+(i+1),title:heading[1],setting:field('场景'),action:field('画面'),narration,
        sourceIds:p.screenplayDraft?.scenes[i]?.sourceIds||p.sources.map(s=>s.id)};
    });
  }
  function reviewScenes(p){
    return p.reviewTarget==='screenplay'?parseScreenplay(p):(p.previewNarrations?.join('\n\n')===p.story?p.previewNarrations:p.story.split(/\n\n+/)).map(clean).filter(Boolean).map((n,i)=>({title:p.screenplayDraft?.scenes[i]?.title||'回忆 '+(i+1),sourceIds:p.screenplayDraft?.scenes[i]?.sourceIds||p.sources.map(s=>s.id),narration:n}));
  }
  function storyPreview(p){
    return {...copy(p),reviewTarget:'story',previewNarrations:reviewScenes(p).map(s=>s.narration),story:reviewScenes(p).map(s=>s.narration).join('\n\n')};
  }
  function editPreview(p,title,narrations){
    const scenes=reviewScenes(p);
    if(narrations.length!==scenes.length||narrations.some(n=>!clean(n)))throw Error('请保留每段故事的正文。');
    const text=p.reviewTarget==='screenplay'?scenes.map((s,i)=>'【第'+(i+1)+'场｜'+s.title+'】\n场景：'+s.setting+'\n画面：'+s.action+'\n旁白：'+clean(narrations[i])).join('\n\n'):narrations.map(clean).join('\n\n');
    return {...editStory(p,text,clean(title)),previewNarrations:p.reviewTarget==='story'?narrations.map(clean):p.previewNarrations,changedIndices:scenes.map((s,i)=>s.narration!==clean(narrations[i])?i:-1).filter(i=>i>=0)};
  }
  function editNarration(p,index,text){
    if(!clean(text))throw Error('这段故事不能为空。');
    const scenes=reviewScenes(p);
    if(!scenes[index])throw Error('这段故事已更新，请重新打开。');
    scenes[index].narration=clean(text);
    const story=p.reviewTarget==='screenplay'?scenes.map((s,i)=>'【第'+(i+1)+'场｜'+s.title+'】\n场景：'+s.setting+'\n画面：'+s.action+'\n旁白：'+s.narration).join('\n\n'):scenes.map(s=>s.narration).join('\n\n');
    return editStory(p,story,p.title);
  }
  function isApproved(p){
    return !!(p&&p.approval&&p.approval.revision===p.revision&&p.approval.story===p.story&&p.approval.title===p.title);
  }
  function editStory(p,text,title){
    if(text===p.story&&title===p.title)return copy(p);
    return {...copy(p),story:text,title,photoPlan:(p.photoPlan||[]).map(photo=>photo.status==='ready'?{...photo,status:'pending_review',reason:'故事有修改，需重新核对照片与内容的关联'}:photo),revision:p.revision+1,approval:null,screenplay:null,board:null,stage:'story',updatedAt:Date.now()};
  }
  function approve(p,checked){
    if(p.reviewTarget==='screenplay')parseScreenplay(p);
    if(!checked)throw Error('请先核对故事，再勾选确认。');
    if(!clean(p.story)||!clean(p.title))throw Error('请填写电影片名和故事正文。');
    if(p.revisionRequest?.status==='pending'&&p.story===p.revisionRequest.story)throw Error('修改意见已保存。请先修改故事正文，再确认当前稿。');
    return {...copy(p),revisionRequest:p.revisionRequest?{...p.revisionRequest,status:'resolved_by_user'}:null,
      approval:{artifact:p.reviewTarget==='screenplay'?'screenplay':'story',revision:p.revision,story:p.story,title:p.title,confirmedAt:Date.now(),by:'本人确认（本地原型）'},updatedAt:Date.now()};
  }
  function sourcesChanged(p,sources){
    return p.sources.some(snapshot=>{
      const live=sources.find(s=>s.id===snapshot.id);
      return !live||live.text!==snapshot.text||live.title!==snapshot.title||JSON.stringify(live.photos||[])!==JSON.stringify(snapshot.photos||[]);
    });
  }
  function buildScreenplay(p){
    if(!isApproved(p))throw Error('请先确认当前版本的故事，再写剧本。');
    const paragraphs=p.reviewTarget==='story'?reviewScenes(p).map(s=>s.narration):p.story.split(/\n+/).map(clean).filter(Boolean);
    return {...copy(p),stage:'script',board:null,screenplay:{revision:p.revision,story:p.story,
      scenes:p.reviewTarget==='screenplay'?parseScreenplay(p):paragraphs.map((text,i)=>({id:'scene-'+(i+1),title:p.screenplayDraft?.scenes[i]?.title||'场景 '+String(i+1).padStart(2,'0'),
        narration:text,setting:p.screenplayDraft?.scenes[i]?.setting||'依据故事原文核对地点与年代',action:p.screenplayDraft?.scenes[i]?.action||'以对应回忆的旧照片或经本人确认的场景重建承载旁白，不新增经历。',
        sourceIds:p.screenplayDraft?.scenes[i]?.sourceIds||p.sources.map(s=>s.id)}))},updatedAt:Date.now()};
  }
  // Lossless reading units, not a claim of AI-authored cinematic shots.
  function previewShots(scene,references=[],options={}){
    const result=[],occurrences=new Map();
    const hash=text=>{let value=2166136261;for(const c of text){value^=c.charCodeAt(0);value=Math.imul(value,16777619);}return (value>>>0).toString(36);};
    let prefix='';
    for(const paragraph of (scene.narration.match(/[^\n]+(?:\n+|$)|\n+/g)||[])){
      if(!paragraph.trim()){if(result.length)result[result.length-1].narration+=paragraph;else prefix+=paragraph;continue;}
      const ref=references.find(p=>p.text.trim()===paragraph.trim());
      const sourceIds=(ref?.source_ids||[]).filter(id=>(scene.sourceIds||[]).includes(id));
      const sentences=paragraph.match(/[^。！？!?]+[。！？!?]?|[。！？!?]/g)||[paragraph];
      const chunks=[];let chunk='';const limit=options.legacy?100:180;
      for(const sentence of sentences){if(chunk&&chunk.length+sentence.length>limit){chunks.push(chunk);chunk='';}chunk+=sentence;}if(chunk)chunks.push(chunk);
      if(!options.legacy&&chunks.length>1&&chunks[chunks.length-1].trim().length<45&&chunks[chunks.length-2].length+chunks[chunks.length-1].length<=240){chunks[chunks.length-2]+=chunks.pop();}
      for(let text of chunks){if(prefix){text=prefix+text;prefix='';}const key=hash(text),repeat=occurrences.get(key)||0;occurrences.set(key,repeat+1);result.push({id:scene.id+'-'+key+'-'+repeat,sceneId:scene.id,narration:text,sourceIds,sourceMapped:!!ref});}
    }
    return result;
  }
  function splitNarration(text){
    const chunks=[];
    const sentences=text.replace(/\s/g,'').match(/[^。！？!?；;]+[。！？!?；;]?/g)||[];
    for(const sentence of sentences){
      const chars=Array.from(sentence);
      while(chars.length)chunks.push(chars.splice(0,28).join(''));
    }
    return chunks;
  }
  function buildBoard(p){
    if(!isApproved(p))throw Error('请先确认当前版本的故事，再写分镜。');
    if(!p.screenplay||p.screenplay.revision!==p.revision||p.screenplay.story!==p.story)throw Error('剧本版本已失效，请重新写剧本。');
    const rows=p.screenplay.scenes.flatMap(scene=>splitNarration(scene.narration).map(narration=>({sceneId:scene.id,narration,action:scene.action,sourceIds:scene.sourceIds,photoIds:(p.photoPlan||[]).filter(photo=>photo.status==='ready'&&scene.sourceIds.includes(photo.sourceId)).map(photo=>photo.id)})));
    const minimums=rows.map(row=>Math.max(3,Math.ceil(size(row.narration)/4)));
    const required=minimums.reduce((a,b)=>a+b,0);
    if(required>p.duration)throw Error('当前故事至少需要约 '+required+' 秒，请展开“更多设置”延长影片时长，或精简故事后重新确认。');
    const spare=p.duration-required,each=Math.floor(spare/rows.length),rest=spare%rows.length;
    const shots=rows.map((row,i)=>({...row,id:'shot-'+(i+1),duration:minimums[i]+each+(i<rest?1:0),
      purpose:i===0?'开场':i===rows.length-1?'回望':'记忆片段',
      camera:i===0?'全景 · 缓慢推近':i===rows.length-1?'中景 · 缓慢拉远':'细节特写 · 静镜',
      visual:row.action||'围绕这段回忆选用相关旧照片；缺少照片时，先确认场景与人物，再进行画面重建。',
      sound:'原文旁白，轻柔配乐；环境音待素材确认。',sourceIds:row.sourceIds,assetStatus:row.photoIds.length?'已安排关联原照片':'待补充照片或场景参考'}));
    return {...copy(p),stage:'board',board:{revision:p.revision,story:p.story,shots},updatedAt:Date.now()};
  }
  function exportPackage(p){
    if(!isApproved(p)||!p.board||p.board.revision!==p.revision||p.board.story!==p.story)throw Error('请先确认故事并完成当前版本的分镜。');
    return {schemaVersion:1,skill:'memoir-film',origin:'yunyi-v17-local-prototype',project:copy(p),sources:copy(p.sources),
      storyConfirmed:true,productionStatus:'not_connected',video:null,
      note:'这是本地原型的制作资料，不是服务端审批凭证；真实服务须重新鉴权、审查和绑定版本。'};
  }
  function recommendDuration(sources){
    const required=splitNarration(sources.map(s=>clean(s.text)).join('\n')).reduce((sum,line)=>sum+Math.max(3,Math.ceil(size(line)/4)),0);
    return Math.max(60,Math.ceil(required/60)*60);
  }
  function prepareProduction(p){
    if(!isApproved(p))throw Error('请先确认当前版本的故事，再准备制作。');
    let next=p.screenplay&&p.screenplay.revision===p.revision&&p.screenplay.story===p.story?copy(p):buildScreenplay(p);
    if(!next.board||next.board.revision!==p.revision||next.board.story!==p.story)next=buildBoard(next);
    return {...next,stage:'production'};
  }
  function requestRevision(p,text){
    if(!clean(text))throw Error('请先填写希望怎么修改。');
    return {...copy(p),revisionRequest:{text:clean(text),story:p.story,revision:p.revision,status:'pending',createdAt:Date.now()},
      approval:null,screenplay:null,board:null,stage:'story',updatedAt:Date.now()};
  }
  return {previewShots,storyPreview,editPreview,reviewScenes,editNarration,draftScreenplay,createProject,isApproved,editStory,approve,sourcesChanged,buildScreenplay,buildBoard,exportPackage,recommendDuration,prepareProduction,requestRevision,availableSources,selectSources,groupSources};
});
