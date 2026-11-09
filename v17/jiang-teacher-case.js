(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./jiang-teacher-data.js'),require('./memoir-catalog.js'),require('./jiang-teacher-generated-story.js'));
  else root.YunyiJiangPreview=factory(root.YunyiJiangCase,root.YunyiMemoirCatalog,root.YunyiJiangGeneratedStory);
})(typeof globalThis!=='undefined'?globalThis:this,function(data,catalog,generated){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const visualNotes={
    'jiang-002':['浣纱河边的旧居','沿河的老式民居，承接出生地的回忆。'],
    'jiang-011':['家中的回忆','由“崭新”这个名字引出父亲取名的故事；不补写出生现场。'],
    'jiang-128':['浣纱河与弄堂','河边洗衣、淘米；夏夜竹躺椅、蒲扇和井水里泡凉的西瓜，依原文依次展开。'],
    'jiang-127':['家中客厅','六灯收音机的绿色猫眼亮起，全家围坐听广播。'],
    'jiang-039':['家中','父亲按线路图组装电视，我和妹妹递工具；测试卡出现，全家围坐看电视。'],
    'jiang-064':['母亲的旧日生活','母亲参照杂志编织毛衣；以原卡合影承接回忆，不虚构照片中的具体人物身份。'],
    'jiang-037':['新华电影院','八分钱与电影票衔接童年观影；不补写奶奶交钱时的对白。'],
    'jiang-022':['夜校与上课路上','白天工作之后，骑车去夜校，接入课堂和书本。'],
    'jiang-001':['西湖边的食品商店','柜台里称糖果，师傅帮着捆扎商品，孩子随家人来买糖。'],
    'jiang-044':['玻璃加工岗位','煤气火头旁练习接玻璃管，动作从生疏到熟练；不渲染受伤细节。'],
    'jiang-045':['工艺组办公室','图纸与零件一一对照，师傅指导读图与检验。'],
    'jiang-103':['电子管产品资料','展示故事卡附带的产品图，承接对职业的回望；不将其指认为本人制作的具体一只。'],
    'jiang-076':['采荷新村的新居','从旧弄堂过渡到新居，独立卫生间和自己的房间承接生活变化。'],
    'jiang-040':['家中阳台','风雨中，我和妹妹顶住阳台门，父亲用胶带封住；风停后的倒树承接次日。'],
    'jiang-008':['第一次见面的家中','小芬与母亲聊天，我留意她自然的笑容。'],
    'jiang-068':['庆春东路夜市','两个人手牵手逛夜市，衣服、耳机等小物件承接日常相处。'],
    'jiang-149':['电影院赴约的雨夜','湿透的鞋、迟到的身影，我抱住发抖的小芬；不虚构汽车碰撞画面。'],
    'jiang-069':['婚姻登记处','登记承接两个人攒够结婚钱的叙述，不补拍未发生的求婚。'],
    'jiang-107':['大运河游船与苏州、无锡','游船和旅行中的见闻承接新婚回忆，不添加未记载的对白。'],
    'jiang-052':['吴山广场','两个孩子戴着旅游帽，手牵手，拿着小国旗。'],
    'jiang-050':['青岛、威海、大连','海边和旅途对应全家出游的回忆，优先使用这次旅行的真实照片。'],
    'jiang-071':['回望中的留白','鲜花只作为未实现愿望的意象，不表现成已经发生的求婚仪式。'],
    'jiang-135':['家人的回忆','以旧照片或留白承接失去亲人的讲述，不补写病床、遗言或葬礼。'],
    'jiang-077':['离开时的厂区','收拾办公室、交接工作，在厂区走一遍并拍照，然后与同事告别。'],
    'jiang-151':['退休职工聚会','准备音响和播放视频，承接老同事相聚。'],
    'jiang-089':['西湖','以原卡中的西湖照片和四季景色，承接退休后的摄影生活。'],
    'jiang-098':['雨天的客厅','泡一杯茶，听窗外的雨声，让叙述稍作停留。']
  };
  function direction(sourceIds,narration){
    const notes=sourceIds.filter(id=>visualNotes[id]).map(id=>visualNotes[id]);
    return {setting:[...new Set(notes.map(n=>n[0]))].slice(0,3).join(' / ')||'依本场故事选择对应原照或实物，地点待核对',
      characters:['我','父亲','母亲','小芬','妹妹','女儿','儿子','奶奶','师傅'].filter(name=>narration.includes(name)),
      action:notes.length?notes.map(n=>n[1]).join('\n'):'以本场所选故事卡中的照片、文书和物件承接旁白；缺少资料的部分留白，不虚构人物动作。'};
  }
  function applies(p){return !!data&&p.sources.length>0&&p.sources.every(s=>s.caseId===data.id);}
  function authoredDraft(p,core){
    if(!generated||generated.sourceVersion!==data.version||p.sources.some(s=>data.sources.find(original=>original.id===s.id)?.text!==s.text))return null;
    const selected=new Set(p.sources.map(s=>s.id)),used=new Set();
    const scenes=generated.chapters.map(ch=>{
      // A paragraph is retained only when ALL supporting cards are in scope.
      const paragraphs=ch.paragraphs.filter(par=>par.source_ids.every(id=>selected.has(id)));
      if(!paragraphs.length)return null;
      const sourceIds=[...new Set(paragraphs.flatMap(par=>par.source_ids))];sourceIds.forEach(id=>used.add(id));
      const narration=paragraphs.map(par=>par.text).join('\n\n');
      return {title:ch.title,narration,sourceIds,...direction(sourceIds,narration)};
    }).filter(Boolean);
    if(!scenes.length)return null;
    const base=core.draftScreenplay(p);
    return {...base,title:p.scope==='life'?generated.title:(p.groupNames||[]).join('、')+' · 蒋老师的岁月片段',caseId:data.id,caseVersion:data.version,storyEdition:generated.version,literaryFormat:1,
      selectionPool:copy(p.selectionPool||p.sources),storyPage:0,reviewTarget:'story',story:scenes.map(sc=>sc.narration).join('\n\n'),previewNarrations:scenes.map(sc=>sc.narration),
      screenplayDraft:{mode:'codex_authored_story',scenes,directorNote:'正文由本地 Codex 按提示词生成并核对来源；当前选材仅保留来源齐全的段落。画面仍为待生成构想。'},
      caseReview:{notes:copy(generated.review_questions),selectedCount:p.sources.length,usedSourceIds:[...used],omittedSourceIds:p.sources.filter(s=>!used.has(s.id)).map(s=>s.id),omissionReason:'缺乏具体经历或当前选材不足以独立支持改写段落；原卡保留。',generationVersion:generated.version},
      approval:null,screenplay:null,board:null,stage:'story'};
  }
  function draft(p,core){
    if(!applies(p))return core.storyPreview(core.draftScreenplay(p));
    const authored=authoredDraft(p,core);if(authored)return authored;
    const sourceMap=new Map(p.sources.map(s=>[s.id,s]));
    const seen=new Set(),used=new Set(),deferred=new Set((data.deferredSources||[]).map(s=>s.sourceId));
    const scenes=[];
    for(const chapter of data.chapters){
      const parts=[],sourceIds=[];
      for(const id of chapter.sourceIds){
        const source=sourceMap.get(id);if(!source||deferred.has(id))continue;
        // Remove duplicated paragraphs only. Keep qualifiers, opinions and original facts intact.
        const paras=source.text.split(/\n+/).map(s=>s.trim()).filter(Boolean).filter(s=>{
          const key=s.replace(/\s/g,'');if(seen.has(key))return false;seen.add(key);return true;
        });
        if(paras.length){parts.push(paras.join('\n'));sourceIds.push(id);used.add(id);}
      }
      if(!parts.length)continue;
      const narration=chapter.transition+'\n\n'+parts.join('\n\n');
      scenes.push({title:chapter.title,narration,sourceIds,...direction(sourceIds.filter(id=>sourceMap.get(id).text===data.sources.find(s=>s.id===id)?.text),narration)});
    }
    if(!scenes.length)throw Error('所选故事卡没有足够的经历正文，请至少保留一张有具体故事的卡片。');
    const base=core.draftScreenplay(p);
    const title=p.scope==='life'?'蒋老师的人生故事':(p.groupNames||[]).join('、')+' · 蒋老师的岁月片段';
    return {...base,title,caseId:data.id,caseVersion:data.version,storyEdition:generated?.version,literaryFormat:1,selectionPool:copy(p.selectionPool||p.sources),storyPage:0,
      reviewTarget:'story',story:scenes.map(s=>s.narration).join('\n\n'),previewNarrations:scenes.map(s=>s.narration),
      screenplayDraft:{mode:'literary_screenplay_preview',scenes,directorNote:'电影文学剧本预览：每场含场景、人物、画面与旁白。旁白当前保留原文重组，未实时调用AI改写；场景构想仅取自所选卡。'},
      caseReview:{notes:copy(data.notes),selectedCount:p.sources.length,usedSourceIds:[...used],omittedSourceIds:p.sources.filter(s=>!used.has(s.id)).map(s=>s.id),omissionReason:'只有重复段落或没有具体经历的简短回答未扩写，原卡仍可查。'},
      approval:null,screenplay:null,board:null,stage:'story'};
  }
  function groupSources(sources,basis,core){
    const groups=core.groupSources(sources,basis);
    const order=(basis==='stage'?catalog.stages:catalog.chapters).map(item=>item.name);
    const rank=name=>{const i=order.indexOf(name);return i<0?order.length:i;};
    return groups.sort((a,b)=>rank(a.name)-rank(b.name));
  }
  return {draft,applies,groupSources,direction,storyEdition:generated?.version};
});
