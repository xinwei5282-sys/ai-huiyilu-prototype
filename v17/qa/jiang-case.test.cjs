const test=require('node:test'),assert=require('node:assert/strict');
const catalog=require('../memoir-catalog.js');
const generated=require('../jiang-teacher-generated-story.js');
const data=require('../jiang-teacher-data.js'),casePreview=require('../jiang-teacher-case.js'),core=require('../microfilm-core.js');
const create=(sources,scope='life')=>casePreview.draft(core.createProject(sources,{scope,duration:3600,groupNames:['选定内容']}),core);
test('151 cards, two different groupings, and all selected narrative sources accounted for',()=>{
 assert.equal(data.sources.length,151);assert.equal(new Set(data.sources.map(s=>s.id)).size,151);
 assert.notDeepEqual(core.groupSources(data.sources,'chapter').map(g=>g.sourceIds),core.groupSources(data.sources,'stage').map(g=>g.sourceIds));
 const p=create(data.sources);assert.equal(core.reviewScenes(p).length,generated.chapters.length);assert.equal(p.storyEdition,generated.version);assert.equal(p.story,generated.chapters.map(c=>c.paragraphs.map(p=>p.text).join('\n\n')).join('\n\n'));assert.ok(p.story.length>10000);
 assert.equal(p.caseReview.usedSourceIds.length+p.caseReview.omittedSourceIds.length,151);assert.equal(p.approval,null);
});
test('removing a source removes its unique narration and unsupported empty stages',()=>{
 const without=create(data.sources.filter(s=>s.id!=='jiang-149'));
 assert.ok(!without.story.includes('她的鞋都湿透了'));assert.ok(!without.caseReview.usedSourceIds.includes('jiang-149'));
 const only=create(data.sources.filter(s=>s.id==='jiang-149'),'fragment');assert.equal(core.reviewScenes(only).length,1);assert.match(only.story,/鞋.*湿透/);assert.ok(!only.story.includes('烧破三条裤子'));
 assert.deepEqual(only.caseReview.usedSourceIds,['jiang-149']);
});
test('regeneration consumes the selected current text and keeps all referenced sources within scope',()=>{
 const changed={...data.sources.find(s=>s.id==='jiang-149'),text:'经本人修改：那天没有下雨。'};
 const p=create([changed],'fragment');assert.ok(p.story.includes(changed.text));assert.ok(!p.story.includes('下大雨'));
 for(const chapter of core.reviewScenes(p))assert.deepEqual(chapter.sourceIds,[changed.id]);
 const approved=core.approve(p,true);const edited=create([changed],'fragment');assert.ok(core.isApproved(approved));assert.ok(!core.isApproved(edited));
});

test('stage order starts at birth and never follows shuffled source file order',()=>{
 const grouped=casePreview.groupSources([...data.sources].reverse(),'stage',core);assert.deepEqual(grouped.map(g=>g.name),catalog.stages.map(s=>s.name));
 const remaining=casePreview.groupSources(data.sources.filter(s=>s.stageName!=='出生与家庭'),'stage',core);assert.equal(remaining[0].name,'童年与少年');
});

test('generated paragraphs retain only selected references and old raw collage is not the full story',()=>{
 const full=create(data.sources),without=create(data.sources.filter(s=>s.id!=='jiang-149'));
 assert.ok(!full.story.includes(data.sources.find(s=>s.id==='jiang-002').text));
 assert.ok(!without.story.includes('小芬迟到了半个小时'));
 for(const sc of core.reviewScenes(without))assert.ok(!sc.sourceIds.includes('jiang-149'));
 assert.equal(full.caseReview.usedSourceIds.length,150);assert.deepEqual(full.caseReview.omittedSourceIds,['jiang-096']);
});

test('preview shots preserve complete narration and associate only exact paragraph sources',()=>{
 const p=core.buildScreenplay(core.approve(create(data.sources),true));
 const refs=generated.chapters.flatMap(ch=>ch.paragraphs);
 for(const scene of p.screenplay.scenes){const shots=core.previewShots(scene,refs);assert.equal(shots.map(s=>s.narration).join(''),scene.narration);assert.equal(new Set(shots.map(s=>s.id)).size,shots.length);for(const shot of shots)for(const id of shot.sourceIds)assert.ok(scene.sourceIds.includes(id));}
 const sc=p.screenplay.scenes[0],original=core.previewShots(sc,refs);assert.ok(original.length>1);
 const changed=core.previewShots({...sc,narration:'新的讲述。'},refs);assert.deepEqual(changed[0].sourceIds,[]);assert.ok(!original.some(s=>s.id===changed[0].id));
});
