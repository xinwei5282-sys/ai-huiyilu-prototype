const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const file=require('node:path').join(__dirname,'../microfilm-core.js');
const core=fs.existsSync(file)?require(file):{};
const sources=[{id:'memory-1',title:'第一次远行',text:'1978年，我坐火车去杭州工作。父亲在车站送我。',kind:'user'}];
function draft(){assert.equal(typeof core.createProject,'function','microfilm core must exist');return core.createProject(sources,{title:'第一次远行',duration:60});}

test('film starts from a snapshot of existing full-text memories',()=>{
  const p=draft();assert.equal(p.story,sources[0].text);assert.equal(p.stage,'story');
  assert.equal(p.approval,null);assert.equal(p.screenplay,null);assert.equal(p.board,null);
  const changed=[{...sources[0]}];const snapshot=core.createProject(changed,{duration:60});
  changed[0].text='不同的内容';assert.equal(snapshot.sources[0].text,sources[0].text);
});
test('empty or title-only memories cannot become a film',()=>{
  draft();assert.throws(()=>core.createProject([],{duration:60}),/正文/);
  assert.throws(()=>core.createProject([{id:'one',title:'只有标题',text:''}],{duration:60}),/正文/);
});
test('unconfirmed story cannot produce screenplay or storyboard',()=>{
  const p=draft();assert.throws(()=>core.buildScreenplay(p),/确认/);assert.throws(()=>core.buildBoard(p),/确认/);
});
test('human confirmation is explicit and tied to exact story version',()=>{
  const p=draft();assert.throws(()=>core.approve(p,false),/核对/);
  const approved=core.approve(p,true);assert.equal(approved.approval.revision,p.revision);
  assert.equal(core.isApproved(approved),true);assert.equal(core.isApproved({...approved,story:'偷偷替换'}),false);
});
test('story edit revokes approval and all downstream work',()=>{
  let p=core.approve(draft(),true);p=core.buildScreenplay(p);p=core.buildBoard(p);
  const edited=core.editStory(p,p.story+'后来，我又回到家乡。',p.title);
  assert.equal(edited.revision,p.revision+1);assert.equal(edited.approval,null);
  assert.equal(edited.screenplay,null);assert.equal(edited.board,null);assert.equal(edited.stage,'story');
});
test('returning to an unchanged story does not invalidate confirmation',()=>{
  const p=core.approve(draft(),true);const same=core.editStory(p,p.story,p.title);
  assert.equal(same.revision,p.revision);assert.equal(core.isApproved(same),true);
});
test('updating source text or title invalidates the current downstream version',()=>{
  const p=core.approve(draft(),true);
  assert.equal(core.sourcesChanged(p,sources),false);
  assert.equal(core.sourcesChanged(p,[{...sources[0],text:'原始记录更新'}]),true);
  assert.equal(core.sourcesChanged(p,[{...sources[0],title:'新标题'}]),true);
  assert.equal(core.sourcesChanged(p,[]),true);
});
test('storyboard covers all approved narration and totals the target duration',()=>{
  let p=core.approve(draft(),true);p=core.buildScreenplay(p);p=core.buildBoard(p);
  assert.equal(p.board.shots.reduce((sum,s)=>sum+s.duration,0),60);
  assert.equal(p.board.shots.map(s=>s.narration).join(''),p.story.replace(/\s/g,''));
  assert.ok(p.board.shots.every(s=>s.duration>=s.narration.replace(/\s/g,'').length/4));
  assert.equal(p.board.revision,p.revision);assert.equal(p.stage,'board');
});
test('short duration cannot silently truncate a long confirmed story',()=>{
  let p=core.createProject([{...sources[0],text:'这一段是完整的真实回忆。'.repeat(70)}],{duration:60});
  p=core.approve(p,true);p=core.buildScreenplay(p);
  assert.throws(()=>core.buildBoard(p),/时长/);assert.equal(p.board,null);
});
test('example sources retain example provenance in exported materials',()=>{
  let p=core.createProject([{...sources[0],kind:'example'}],{duration:60});
  p=core.buildBoard(core.buildScreenplay(core.approve(p,true)));
  const pack=core.exportPackage(p);assert.equal(pack.sources[0].kind,'example');
  assert.equal(pack.productionStatus,'not_connected');assert.equal(pack.storyConfirmed,true);
  assert.equal(pack.video,null);assert.equal(pack.skill,'memoir-film');
});
test('a manipulated stale screenplay cannot become a valid storyboard',()=>{
  let p=core.buildScreenplay(core.approve(draft(),true));p.screenplay.revision=0;
  assert.throws(()=>core.buildBoard(p),/剧本/);
});
test('one human confirmation prepares screenplay and storyboard without more user steps',()=>{
  assert.equal(typeof core.prepareProduction,'function');
  const p=core.prepareProduction(core.approve(draft(),true));
  assert.equal(p.stage,'production');assert.ok(p.screenplay.scenes.length);assert.ok(p.board.shots.length);
  assert.equal(p.board.revision,p.approval.revision);
});
test('automatic production preparation still refuses an unconfirmed story',()=>{
  assert.equal(typeof core.prepareProduction,'function');assert.throws(()=>core.prepareProduction(draft()),/确认/);
});
test('automatic duration fits long memories without truncating their narration',()=>{
  assert.equal(typeof core.recommendDuration,'function');
  const long=[{...sources[0],text:'这一段是完整的真实回忆。'.repeat(70)}];
  const duration=core.recommendDuration(long);assert.ok(duration>60);
  const p=core.prepareProduction(core.approve(core.createProject(long,{duration}),true));
  assert.equal(p.board.shots.map(s=>s.narration).join(''),long[0].text);
});
test('revision feedback is retained and blocks confirming an unchanged story',()=>{
  assert.equal(typeof core.requestRevision,'function');
  const p=core.requestRevision(core.approve(draft(),true),'保留父亲送行的细节。');
  assert.equal(p.approval,null);assert.equal(p.revisionRequest.text,'保留父亲送行的细节。');
  assert.throws(()=>core.approve(p,true),/修改/);
  const updated=core.editStory(p,p.story+'这一幕我一直记得。',p.title);
  assert.equal(core.approve(updated,true).revisionRequest.status,'resolved_by_user');
});
const collection=[
  {id:'sample',title:'示例',text:'示例内容。',kind:'example',chapterName:'童年时光'},
  {id:'child',title:'老屋',text:'小时候我住在老屋。',kind:'user',chapterName:'童年时光'},
  {id:'school',title:'上学',text:'上学时我每天走路去学校。',kind:'user',chapterName:'求学的日子'},
  {id:'other',title:'未分章',text:'和家人去了一次海边。',kind:'user'},
  {id:'empty',title:'只有标题',text:'',kind:'user',chapterName:'成家立业'},
];
test('life scope includes all recorded full texts and excludes examples when user content exists',()=>{
  assert.equal(typeof core.selectSources,'function');
  assert.deepEqual(core.selectSources(collection,{scope:'life'}).map(s=>s.id),['child','school','other']);
});
test('fragment scope only includes selected sources from the chosen chapter or stage',()=>{
  assert.equal(typeof core.groupSources,'function');
  const group=core.groupSources(collection,'chapter').find(g=>g.name==='童年时光');
  assert.deepEqual(group.sourceIds,['child']);
  assert.deepEqual(core.selectSources(collection,{scope:'fragment',selectedIds:group.sourceIds}).map(s=>s.id),['child']);
  const stage=core.groupSources(collection,'stage').find(g=>g.name==='童年');
  assert.deepEqual(stage.sourceIds,['child']);
});
test('unassigned memories remain selectable and are never silently omitted from life scope',()=>{
  assert.equal(typeof core.groupSources,'function');
  assert.deepEqual(core.groupSources(collection,'chapter').find(g=>g.name==='未分章回忆').sourceIds,['other']);
  assert.deepEqual(core.groupSources(collection,'stage').find(g=>g.name==='未分阶段').sourceIds,['other']);
});
test('empty fragment selection cannot fall back to all contents',()=>{
  assert.equal(typeof core.selectSources,'function');
  assert.deepEqual(core.selectSources(collection,{scope:'fragment',selectedIds:[]}),[]);
  assert.throws(()=>core.createProject(core.selectSources(collection,{scope:'fragment',selectedIds:[]}),{duration:60}),/正文/);
});
test('example-only preview is labelled by provenance and scope is retained in project snapshots',()=>{
  assert.equal(typeof core.selectSources,'function');
  const demo=core.selectSources([collection[0]],{scope:'life'});
  assert.equal(demo[0].kind,'example');
  const p=core.createProject(core.selectSources(collection,{scope:'life'}),{duration:60,scope:'life',title:'我的人生纪事'});
  assert.equal(p.scope,'life');assert.equal(p.scopeName,'人生纪事');
  const fragment=core.createProject([collection[1]],{duration:60,scope:'fragment',selectionBasis:'stage',groupNames:['童年']});
  assert.equal(fragment.scopeName,'岁月片段');assert.deepEqual(fragment.groupNames,['童年']);
});
test('selected memories are adapted into an unconfirmed film screenplay before storyboard generation',()=>{
  assert.equal(typeof core.draftScreenplay,'function');
  const p=core.draftScreenplay(draft());
  assert.equal(p.reviewTarget,'screenplay');assert.equal(p.approval,null);assert.equal(p.board,null);
  assert.ok(p.story.includes('场景：')&&p.story.includes('画面：')&&p.story.includes('旁白：'));
  assert.throws(()=>core.prepareProduction(p),/确认/);
});
test('screenplay approval binds the script and storyboard uses narration rather than screenplay labels',()=>{
  assert.equal(typeof core.draftScreenplay,'function');
  const source={...sources[0],kind:'example',filmDraft:{heading:'远行',setting:'车站，时间未详',visual:'父亲送行。',narration:'那年，父亲送我去杭州工作。'}};
  const draft=core.draftScreenplay(core.createProject([source],{duration:60}));
  const p=core.prepareProduction(core.approve(draft,true));
  assert.equal(p.approval.artifact,'screenplay');
  assert.equal(p.board.shots.map(s=>s.narration).join(''),'那年，父亲送我去杭州工作。');
  assert.ok(p.board.shots[0].visual.includes('父亲送行'));
});
test('editing an approved screenplay revokes its approval and old storyboard',()=>{
  assert.equal(typeof core.draftScreenplay,'function');
  let p=core.prepareProduction(core.approve(core.draftScreenplay(draft()),true));
  p=core.editStory(p,p.story.replace('父亲在车站送我。','父亲送我。'),p.title);
  assert.equal(p.approval,null);assert.equal(p.board,null);
  assert.throws(()=>core.prepareProduction(p),/确认/);
});
test('a malformed screenplay cannot be confirmed as complete',()=>{
  assert.equal(typeof core.draftScreenplay,'function');
  const p=core.draftScreenplay(draft());p.story='【第1场｜远行】\n场景：车站\n画面：父亲送行。';
  assert.throws(()=>core.approve(p,true),/旁白/);
});

test('readable story editing changes narration without requiring screenplay syntax',()=>{
  const p=core.draftScreenplay(draft());
  const scenes=core.reviewScenes(p);
  assert.equal(scenes[0].narration,sources[0].text);
  const edited=core.editNarration(p,0,'父亲送我去工作。');
  assert.equal(core.reviewScenes(edited)[0].narration,'父亲送我去工作。');
  assert.match(edited.story,/场景：/);
  assert.equal(edited.approval,null);
  const produced=core.prepareProduction(core.approve(edited,true));
  assert.equal(produced.board.shots.map(s=>s.narration).join(''),'父亲送我去工作。');
});

test('photo planning keeps source attribution and only schedules reviewed usable photos',()=>{
 const photoSources=[{...sources[0],photos:[{id:'yes',url:'data:image/png;base64,AA',width:1200,height:900,review:{relevant:true,usable:true}},{id:'tiny',url:'data:image/png;base64,AA',width:60,height:60},{id:'unknown',url:'data:image/png;base64,AA',width:1200,height:900}]}];
 const p=core.draftScreenplay(core.createProject(photoSources,{duration:60}));
 assert.equal(p.photoPlan.find(x=>x.id==='yes').status,'ready');
 assert.equal(p.photoPlan.find(x=>x.id==='tiny').status,'unsuitable');
 assert.equal(p.photoPlan.find(x=>x.id==='unknown').status,'pending_review');
 const produced=core.prepareProduction(core.approve(p,true));
 assert.deepEqual(produced.board.shots[0].photoIds,['yes']);
 assert.equal(core.sourcesChanged(p,[{...photoSources[0],photos:[]}]),true);
});

test('story preview confirms exactly the readable narration and batch editing revokes downstream',()=>{
 const p=core.storyPreview(core.draftScreenplay(draft()));
 assert.equal(p.reviewTarget,'story');assert.equal(p.story,sources[0].text);
 const approved=core.prepareProduction(core.approve(p,true));assert.equal(approved.approval.artifact,'story');
 const edited=core.editPreview(approved,'回家',['父亲送我去工作。']);
 assert.equal(edited.revision,approved.revision+1);assert.equal(edited.board,null);assert.deepEqual(edited.changedIndices,[0]);
 assert.throws(()=>core.editPreview(p,'回家',['']),/正文/);
});

test('paragraph breaks inside one edited passage do not create extra film scenes',()=>{
 const p=core.storyPreview(core.draftScreenplay(draft()));
 const edited=core.editPreview(p,p.title,['第一段回忆。\n\n这仍是同一段故事。']);
 assert.equal(core.reviewScenes(edited).length,1);
 const produced=core.prepareProduction(core.approve(edited,true));
 assert.equal(produced.screenplay.scenes.length,1);
});

test('preview segments preserve all text and avoid blank and isolated short tails',()=>{
  const paragraph='我在河边长大。'.repeat(18)+'晚饭后我们一起回家。';
  const text=paragraph+'\n\n\n'+'后来我们搬去了新家。';
  const scenes={id:'scene-1',narration:text,sourceIds:['memory-1']};
  const shots=core.previewShots(scenes,[{text:paragraph,source_ids:['memory-1']}]);
  assert.equal(shots.map(x=>x.narration).join(''),text);
  assert.ok(shots.every(x=>x.narration.trim()));
  assert.ok(shots.filter(x=>x.sourceMapped).every(x=>x.sourceIds.includes('memory-1')));
  assert.ok(shots.length<core.previewShots(scenes,[],{legacy:true}).length);
});
