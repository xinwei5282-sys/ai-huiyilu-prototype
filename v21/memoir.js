// Generated from canonical V17. Product adaptations are in memoir-bridge.js.

var AvatarStore={
  key:'yunyi.v21.avatar',
  get:function(){try{return localStorage.getItem(this.key)||''}catch(e){return''}},
  set:function(value){try{localStorage.setItem(this.key,value)}catch(e){} syncAvatarViews(value)}
};
var PersonaStore={
  sourceKey:'yunyi.v21.persona.source',generatedKey:'yunyi.v21.persona.generated',
  get:function(key){try{return localStorage.getItem(key)||''}catch(e){return''}},
  set:function(key,value){try{localStorage.setItem(key,value)}catch(e){}}
};
function syncAvatarViews(value){
  var src=typeof value==='string'?value:AvatarStore.get();
  document.querySelectorAll('[data-avatar-view]').forEach(function(el){
    el.classList.toggle('has-avatar',!!src);
    el.innerHTML=src?'<img src="'+src+'" alt="用户头像">':'兰';
  });
}
var avatarCropSource=null, avatarCropScale=1, avatarCropPurpose='avatar';
function handleAvatarUpload(event){
  var file=event&&event.target&&event.target.files&&event.target.files[0];
  if(!file)return;
  if(!/^image\//.test(file.type)){toast('请选择图片文件');return;}
  avatarCropPurpose=event.target&&event.target.dataset.avatarPurpose==='persona'?'persona':'avatar';
  var reader=new FileReader();
  reader.onload=function(){
    if(avatarCropPurpose==='persona'){
      var source=new Image();
      source.onload=function(){
        var maxSide=1200,ratio=Math.min(1,maxSide/Math.max(source.naturalWidth,source.naturalHeight));
        var canvas=document.createElement('canvas');canvas.width=Math.round(source.naturalWidth*ratio);canvas.height=Math.round(source.naturalHeight*ratio);
        canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
        PersonaStore.set(PersonaStore.sourceKey,canvas.toDataURL('image/jpeg',.82));personaRender('source');toast('半身照已上传，请选择风格');
      };
      source.onerror=function(){toast('这张半身照暂时无法读取')};source.src=reader.result;return;
    }
    var img=new Image();
    img.onload=function(){
      avatarCropSource=img; avatarCropScale=1;
      var preview=document.getElementById('avatarCropImage'), cropper=document.getElementById('avatarCropper');
      if(preview){preview.src=reader.result;preview.style.transform='scale(1)'}
      var label=document.getElementById('avatarZoomText');if(label)label.textContent='100%';
      if(cropper)cropper.classList.add('show');
    };
    img.onerror=function(){toast('这张图片暂时无法读取')}; img.src=reader.result;
  };
  reader.onerror=function(){toast('头像读取失败，请重试')}; reader.readAsDataURL(file);
}
function adjustAvatarZoom(delta){
  avatarCropScale=Math.max(1,Math.min(2,avatarCropScale+delta));
  var preview=document.getElementById('avatarCropImage'), label=document.getElementById('avatarZoomText');
  if(preview)preview.style.transform='scale('+avatarCropScale+')'; if(label)label.textContent=Math.round(avatarCropScale*100)+'%';
}
function cancelAvatarCrop(){
  var cropper=document.getElementById('avatarCropper');if(cropper)cropper.classList.remove('show');
  avatarCropSource=null;document.querySelectorAll('#profileAvatarInput,#personaPhotoInput').forEach(function(i){i.value=''});
}
function confirmAvatarCrop(){
  if(!avatarCropSource)return;
  var base=Math.min(avatarCropSource.naturalWidth,avatarCropSource.naturalHeight), size=base/avatarCropScale;
  var sx=(avatarCropSource.naturalWidth-size)/2, sy=(avatarCropSource.naturalHeight-size)/2;
  var canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  canvas.getContext('2d').drawImage(avatarCropSource,sx,sy,size,size,0,0,512,512);
  var cropped=canvas.toDataURL('image/jpeg',.82);
  AvatarStore.set(cropped);toast('照片已保存，会同步到金句卡');
  var cropper=document.getElementById('avatarCropper');if(cropper)cropper.classList.remove('show');
  avatarCropSource=null;
}
var personaTimer=0;
function personaPickStyle(button){document.querySelectorAll('.persona-style').forEach(function(x){var selected=x===button;x.classList.toggle('on',selected);x.setAttribute('aria-pressed',selected?'true':'false')})}
function personaSetSteps(state){
  var order={idle:0,source:1,generating:1,ready:2},active=order[state]===undefined?0:order[state];
  document.querySelectorAll('[data-persona-step]').forEach(function(step,index){step.classList.toggle('done',index<active);step.classList.toggle('on',index===active);var icon=step.querySelector('i');if(icon)icon.textContent=index<active?'✓':String(index+1)});
}
function personaRender(state){
  var upload=document.getElementById('personaUploadStep'),create=document.getElementById('personaCreateStep'),intro=document.getElementById('personaIntro'),preview=document.getElementById('personaPreview'),sourceImage=document.getElementById('personaSourceImage'),overlay=document.getElementById('personaOverlay'),actions=document.getElementById('personaActions'),styleZone=document.getElementById('personaStyleZone');if(!upload||!create||!preview||!overlay||!actions)return;
  personaSetSteps(state);
  if(state==='idle'){
    upload.style.display='flex';create.style.display='none';
    if(intro)intro.innerHTML='<b>先上传一张清晰半身照</b><br>建议选择正面、光线自然、上半身完整的照片。';
    return;
  }
  upload.style.display='none';create.style.display='block';
  if(intro)intro.innerHTML=state==='ready'?'<b>您的专属人物形象已做好</b><br>可以设为头像，也可以制作品牌人物海报。':(state==='generating'?'<b>正在制作人物形象</b><br>大约需要一点时间，请稍候。':'<b>半身照已上传</b><br>选择一种喜欢的风格，再制作人物形象。');
  if(sourceImage)sourceImage.src=PersonaStore.get(PersonaStore.sourceKey)||'proto-assets/ob-hero.png';
  if(styleZone){styleZone.style.display=state==='ready'?'none':'block';styleZone.classList.toggle('disabled',state==='generating')}
  preview.dataset.state=state;
  if(state==='generating'){
    overlay.innerHTML='<div><div class="persona-spinner"></div>正在制作您的专属形象…</div>';
    actions.innerHTML='<button class="ghost wide" disabled>生成中，请稍候</button>';
  }else if(state==='ready'){
    overlay.innerHTML='';
    actions.innerHTML='<button class="primary wide" onclick="personaShare()">分享人物形象</button><button class="ghost wide" onclick="personaSetAvatar()">设为头像</button><button class="reset-link" onclick="personaReset()">更换半身照</button>';
  }else{
    overlay.innerHTML='';
    actions.innerHTML='<button class="ghost" onclick="document.getElementById(\'personaPhotoInput\').click()">重新上传</button><button class="primary" onclick="personaGenerate()">制作我的形象</button>';
  }
}
function personaGenerate(){
  clearTimeout(personaTimer);personaRender('generating');
  personaTimer=setTimeout(function(){PersonaStore.set(PersonaStore.generatedKey,'proto-assets/home-bg.png');personaRender('ready');toast('您的专属人物形象已做好')},1000);
}
function personaSetAvatar(){
  var generated=PersonaStore.get(PersonaStore.generatedKey)||'proto-assets/home-bg.png';
  AvatarStore.set(generated);toast('已设为头像');
}
function personaShare(){go('personaposter')}
function personaReset(){
  clearTimeout(personaTimer);PersonaStore.set(PersonaStore.sourceKey,'');PersonaStore.set(PersonaStore.generatedKey,'');
  var input=document.getElementById('personaPhotoInput');if(input)input.value='';
  personaRender('idle');toast('可以重新上传半身照');
}
function personaDemo(state){go('persona');clearTimeout(personaTimer);personaRender(state||'idle')}
var quoteBgTimer=0, quoteBgStyle='warm-study';
function quoteBackgroundRender(state,style){
  var card=document.getElementById('quoteCard'), status=document.getElementById('quoteBgStatus');
  if(!card||!status)return;
  quoteBgStyle=style||quoteBgStyle; card.dataset.quoteBg=quoteBgStyle; card.dataset.quoteState=state;
  document.querySelectorAll('.quote-bg-style').forEach(function(btn){btn.classList.toggle('on',btn.dataset.quoteBg===quoteBgStyle)});
  status.classList.toggle('failed',state==='failed');
  if(state==='generating')status.innerHTML='AI 正在生成回忆背景… <button onclick="quoteBackgroundDemo(\'failed\')">演示失败</button>';
  else if(state==='failed')status.innerHTML='生成失败，已保留当前背景 <button onclick="quoteBackgroundGenerate()">重试</button>';
  else status.innerHTML='背景已生成，可直接保存或分享 <button onclick="quoteBackgroundGenerate()">换一张</button>';
}
function quoteBackgroundGenerate(style,button){
  clearTimeout(quoteBgTimer); quoteBackgroundRender('generating',style||(button&&button.dataset.quoteBg)||quoteBgStyle);
  quoteBgTimer=setTimeout(function(){quoteBackgroundRender('ready',quoteBgStyle)},900);
}
function quoteBackgroundDemo(state){
  go('quotecard'); clearTimeout(quoteBgTimer); quoteBackgroundRender(state||'ready',quoteBgStyle);
}
function setupShow(step){
  var s1=document.getElementById('setupStep1');
  if(s1) s1.classList.add('on');
}
function setupNext(){setupShow(2)}
function setupPrev(){setupShow(1)}
function setupPick(el,multi){
  if(!el)return;
  if(multi){el.classList.toggle('on');return;}
  var box=el.parentNode; if(box) box.querySelectorAll('.setup-chip').forEach(function(c){c.classList.remove('on')});
  el.classList.add('on');
}
function setupCloseSelects(except){
  document.querySelectorAll('.setup-select.open').forEach(function(s){ if(s!==except)s.classList.remove('open'); });
}
function setupToggleSelect(el){
  if(!el)return;
  var willOpen=!el.classList.contains('open');
  setupCloseSelects(el);
  el.classList.toggle('open',willOpen);
}
function setupChoose(ev,btn){
  if(ev){ev.stopPropagation();ev.preventDefault();}
  var box=btn&&btn.closest?btn.closest('.setup-select'):null;
  if(!box)return;
  var menu=box.querySelector('.setup-menu');
  box.childNodes[0].nodeValue=(btn.textContent||'').trim();
  box.classList.remove('open');
  if(menu)box.appendChild(menu);
}
document.addEventListener('click',function(e){
  if(!e.target.closest||!e.target.closest('.setup-select'))setupCloseSelects();
});
var addressPickerTargetId='';
function openAddressPicker(opts){
  setupCloseSelects();
  opts=opts||{};
  addressPickerTargetId=opts.targetId||'';
  var p=document.getElementById('addrPicker'), t=document.getElementById('addrPickerTitle');
  if(t)t.textContent=opts.title||'选择地址';
  if(p)p.classList.add('show');
}
function closeAddressPicker(){
  var p=document.getElementById('addrPicker');
  if(p)p.classList.remove('show');
}
function confirmAddressPicker(){
  var text='浙江省 杭州市 上城区';
  var target=document.getElementById(addressPickerTargetId);
  if(target)target.textContent=text;
  closeAddressPicker();
}
var PRD_CONTENT={
  userpath:{title:'项目路径图 PRD',stage:'客户介绍 · 主流程总览',problem:'用一张路径图说明云忆从认识对象、开始讲述、AI 追问、故事成稿到进入书房的完整价值链。',requirements:['项目路径图在屏幕地图中排第一位。','隐藏首页引导页面在主路径中的权重，避免客户先看到说明页。','路径顺序固定为：认识对象、开口讲述、AI 追问、故事成稿、进入书房。','每个阶段要能对应到真实页面，不用抽象流程替代产品界面。'],metrics:['路径页访问率','客户讲解完成率','关键步骤理解度']},
  setup:{title:'新用户信息收集 PRD',stage:'首次使用 · 建立采访上下文',problem:'用户需要先告诉系统被记录人的基本信息，系统才能生成更贴近个人经历的采访题目。',requirements:['页面不能内容平铺，要做成交互式步骤。','采集被记录人的身份、关系、年代、故事方向等基础信息。','允许跳过，直接进入讲述，避免首次使用门槛过高。','完成后进入推荐题目或采访页。'],metrics:['信息收集开始率','信息收集完成率','跳过率']},
  session:{title:'采访录入页 PRD',stage:'讲述 · 语音/键盘输入',problem:'长辈不一定会写完整文章，需要通过自然采访完成内容采集，同时让已录入内容可见、可滚动、可保存。',requirements:['首页“写一段”直接进入录入页，默认键盘输入，录音为暂停态。','内容展示区域要足够大，长文本可滚动查看。','支持语音与键盘切换，按钮状态要清楚。','点击“录完了”后必须进入追问页。','切换已有话题时，如果当前已有内容，提示是否保存当前内容。','被拦截或网络异常时，提示“先存着，网络恢复后自动补上”。'],metrics:['采访页进入率','开始录入率','采访完成率','切题保存确认率','录音失败率']},
  summary:{title:'回忆小结 / 故事卡 PRD',stage:'成稿 · 从原话到故事',problem:'采访内容需要被整理成用户能读懂、能修改、能收进书房的故事小结。',requirements:['追问后可直接查看回忆小结，不强制补完所有追问。','故事卡内容支持手动编辑。','采用失焦自动保存，删除右上保存和底部确认按钮。','保留分享、重新讲、收进书房等后续动作。'],metrics:['小结查看率','故事卡生成成功率','故事卡编辑率','自动保存成功率']},
  shelf:{title:'书房页 PRD',stage:'沉淀 · 整本生命故事入口',problem:'用户需要看到自己的讲述正在变成一本书，书房要强化成果感，不只是故事列表。',requirements:['书房大方向保持书架/书房感。','突出“生命故事整本书”入口。','减少“已整理好的故事”展示量，避免信息过重。','书架玻璃层、木板、书本尺寸要稳定，三本一行。','点击章节书本进入章节详情。'],metrics:['书房访问率','整本书点击率','章节点击率']},
  book:{title:'书详情聚合页 PRD',stage:'聚合 · 整本书管理',problem:'书详情页承接阅读、目录、素材、协作、分享和纸质成书入口，需要比普通列表更有真实书本感。',requirements:['书本封面使用真实书本样式。','章节目录收口到卡片右上角，整体高度更紧凑。','删除不必要章节展示，保留核心信息。','右侧内容简化，放阅读进度、故事数、协作状态等高价值信息。','提供纸质成书 / 下载打印入口。'],metrics:['书详情访问率','目录打开率','纸质书入口点击率','分享点击率']},
  printbook:{title:'纸质成书 PRD',stage:'转化 · 下载打印',problem:'用户已经有数字书后，需要看到可打印、可装订的纸质成品效果，提升成品价值和付费转化。',requirements:['从书详情页和分享页进入纸质成书。','展示 A5、页数、PDF 等打印规格。','支持横屏式纸质成品预览。','预览包含封面、目录、正文、照片页、封底。','支持翻页、生成打印版、下载样张。','排版能力需生成封面、目录、章节、页码和照片说明。'],metrics:['纸质书入口点击率','预览打开率','翻页次数','PDF 生成成功率','下载率']},
  story:{title:'故事卡 PRD',stage:'单卡 · 图文分享',problem:'用户需要把单段故事以图文卡方式保存和分享，同时能继续补充照片。',requirements:['故事标题、分类、正文可编辑。','失焦自动保存，减少确认操作。','照片上传状态要清楚，失败可重试。','底部只保留分享和重新讲等明确动作。'],metrics:['故事卡分享率','图片上传成功率','重新讲点击率']},
  invite:{title:'邀请家人 PRD',stage:'协作 · 邀请补充',problem:'生命故事常常需要家人补充细节，邀请页要说明协作价值并降低转发门槛。',requirements:['支持邀请家人一起记录。','展示家人打开后看到的预览。','说明家人补充内容会进入书内待确认。','入口与书详情、协作者列表打通。'],metrics:['邀请点击率','邀请发送率','落地页打开率']},
  collaborators:{title:'一起记录的人 PRD',stage:'协作 · 人员列表',problem:'用户需要知道谁在一起记录，以及每个人贡献了什么内容。',requirements:['展示传主、子女、亲友等协作者身份。','点击某个一起记录的人，进入他给我写的内容列表。','提供继续邀请家人的入口。'],metrics:['协作者页访问率','贡献列表点击率','邀请家人点击率']},
  share:{title:'当前章节分享 PRD',stage:'传播 · 小程序分享',problem:'用户需要把当前章节直接发给微信好友，不应经过额外落地页。',requirements:['分享方式保留金句卡、分享章节和保存长图。','点击分享章节直接调起微信小程序分享。','小程序卡片携带当前章节标识。','取消或失败后停留原页面。'],metrics:['分享弹窗打开率','章节分享点击率','章节分享完成率']},
  quotecard:{title:'金句卡 PRD',stage:'传播 · 单句分享',problem:'用户需要把有情绪价值的原话变成适合社交传播的图片卡。',requirements:['突出一句话和人物身份。','支持从分享页进入。','适合朋友圈/家族群传播。'],metrics:['金句卡生成率','金句卡分享率']},
  contribute:{title:'亲友视角录入 PRD',stage:'协作 · 我来补充',problem:'亲友需要用自己的身份补充回忆，内容最终由传主或家人确认后进入书中。',requirements:['先选择与传主关系，再进入补充问题。','支持语音或文字补充。','明确隐私范围：仅你和家人可见。','提交后进入待确认状态。'],metrics:['协作开始率','补充提交率','协作完成率']},
  contriblist:{title:'我补录的人 PRD',stage:'协作 · 补录对象列表',problem:'贡献者可能给多个人补录，需要先看清自己帮谁写过。',requirements:['按被补录的人聚合展示。','点击某个人进入 TA 的补录明细。','显示已补录数量、已进书数量和待查看状态。'],metrics:['补录对象列表访问率','补录对象点击率']},
  contribperson:{title:'某个人的补录明细 PRD',stage:'协作 · 单人补录明细',problem:'贡献者点开某个人后，需要查看自己给 TA 补过的内容，并能继续补录。',requirements:['展示当前被补录人和贡献者身份。','列表展示每段内容状态。','点击单条进入贡献详情。','提供继续给这个人补录的入口。'],metrics:['单人补录明细访问率','贡献详情点击率','继续补录率']},
  contribdetail:{title:'贡献详情 PRD',stage:'协作 · 内容确认',problem:'贡献者需要查看某段补充内容的详情，并在需要时继续补充。',requirements:['展示贡献内容、提交身份和当前状态。','支持补充这段内容。','说明是否已进入书中或等待确认。'],metrics:['贡献详情访问率','补充点击率']},
  upload:{title:'上传素材 PRD',stage:'素材 · 照片与资料补充',problem:'仅靠口述不够完整，用户需要上传照片、证件、老物件等素材补充故事。',requirements:['上传入口视觉清晰，区分照片、文字和其他资料。','展示上传进度和失败重试。','素材可与章节或故事关联。'],metrics:['素材上传点击率','上传成功率','素材关联率']},
  review:{title:'家人帮写审核 PRD',stage:'协作 · 审核入书',problem:'家人补充的内容不能直接进入书，需要传主或主账号审核采纳。',requirements:['展示家人帮写的内容列表。','支持采纳、修改、暂不收录。','采纳后更新到对应章节或故事卡。'],metrics:['待审核内容查看率','采纳率','修改率']},
  reviewdetail:{title:'家人补充详情 PRD',stage:'协作 · 单条审核',problem:'列表页不适合承载完整内容和采纳动作，需要单独详情页完成阅读和决策。',requirements:['展示单条家人补充的完整内容。','待确认内容在详情页采纳。','已采纳内容只读查看。'],metrics:['补充详情访问率','详情采纳率']},
  mine:{title:'我的页 PRD',stage:'账户 · 个人中心',problem:'用户需要统一查看账户、套餐、消息和个人资料，承接付费与管理动作。',requirements:['展示用户身份、故事进度、套餐状态。','入口包括账户资料、我的套餐、消息通知。','保留底部 Tab，可回到讲述和书房。'],metrics:['我的页访问率','套餐入口点击率','资料页点击率']},
  profile:{title:'账户资料 PRD',stage:'账户 · 基础资料',problem:'用户需要管理自己的账户资料，并查看当前套餐和身份信息。',requirements:['展示头像、昵称、手机号等基础资料。','手机号等敏感信息需脱敏。','提供我的套餐入口。'],metrics:['资料页访问率','套餐入口点击率']},
  plans:{title:'我的套餐 PRD',stage:'商业化 · 生命故事版本',problem:'云忆需要把访谈题量转译成“书的厚度”和成品价值，同时避免把题库变成老人端任务压力。',requirements:['展示人生初卷 15 题、人生长卷 100 题、家族典藏 303 题三档。','说明三档为同一题库的递进版本，升级后继续补充，不重复作答。','题量只在套餐页作为成书厚度说明，不进入讲述流程。','说明 AI 会后台调度题库，不适用或敏感问题可以跳过。'],packageTiers:[['人生初卷','15 题','内置题目 ID：1、3、5、13、16、32、36、47、63、78、111、145、173、236、288。覆盖来处、家庭、童年、求学、事业、婚姻、子女、苦难、成就和传承。'],['人生长卷','100 题','从完整题库按 10 章配额抽取：家族 10、童年 12、求学 10、事业/创业 14、婚姻 10、子女 10、苦难 8、时代/关系 10、价值/晚年 8、传承/感官 8。优先抽取已有人生经历的章节。'],['家族典藏','303 题','开放当前完整 303 题访谈库。不是强制答完，AI 按年龄、婚育、职业、创业、退休等上下文自动跳过不适用问题，并允许敏感问题仅保存不入书。']],metrics:['套餐页访问率','升级点击率','付费转化率']},
  msgs:{title:'消息通知 PRD',stage:'召回 · 协作动态',problem:'用户需要知道家人的回应、采纳、提问和待处理内容。',requirements:['展示未读消息和历史消息。','点击消息进入对应页面。','区分采纳、回应、提问、待审核等类型。'],metrics:['消息打开率','消息点击率','未读处理率']},
  landing:{title:'被邀请落地页 PRD',stage:'外部 · 家人进入',problem:'亲友通过分享链接进入时，需要快速理解自己要做什么，并开始帮她写。',requirements:['说明被邀请对象和协作目的。','选择身份后进入补充回忆。','提供“也给我父母做一本”的转化入口。'],metrics:['落地页打开率','身份选择率','帮写开始率','二次转化率']},
  onboarding:{title:'首页引导 PRD',stage:'新手 · 可隐藏',problem:'新用户可能需要快速理解云忆，但主路径不应依赖长引导。',requirements:['引导页可跳过。','当前主流程中弱化或隐藏，不放在屏幕地图第一位。','文案控制在三句话以内。'],metrics:['引导页完成率','跳过率']},
  permfail:{title:'麦克风权限 PRD',stage:'异常 · 权限被拦截',problem:'用户说话无反应时，需要明确知道如何开启麦克风，并能回到采访继续。',requirements:['解释当前无法录音的原因。','提供开启麦克风的指引。','允许先回去使用键盘输入。'],metrics:['权限页访问率','权限恢复率','返回输入率']},
  chapter:{title:'章节详情 PRD',stage:'书房 · 章节管理',problem:'用户从书架进入某章后，需要看到这一章包含的故事，并可继续讲这一章。',requirements:['展示章节名、成稿状态和故事数量。','列出本章故事。','支持继续讲这一章和阅读本章。'],metrics:['章节访问率','继续讲点击率','阅读章节点击率']},
  chapterread:{title:'读这章 PRD',stage:'阅读 · 章节正文',problem:'用户需要像读书一样阅读某一章，而不是只看卡片列表。',requirements:['展示章节正文流。','保留返回章节和继续讲入口。','正文排版要适合连续阅读。'],metrics:['章节阅读率','阅读停留时长']},
  default:{title:'云忆项目 PRD',stage:'全局 · 当前原型',problem:'云忆通过采访、AI 追问、故事成稿、书房和分享，帮助家庭沉淀生命故事。',requirements:['每个页面都要服务主链路。','页面切换时展示对应 PRD 内容。','关键功能需要可验证、可埋点。'],metrics:['主链路完成率','故事成稿率','分享/纸质书转化率']}
};
Object.assign(PRD_CONTENT,{
  userpath:{title:'项目路径图 PRD',stage:'客户介绍 · 主流程总览',problem:'客户需要快速理解云忆不是单点录音工具，而是一条从认识被记录人到成书、分享和纸质打印的完整产品路径。',goal:'用真实页面串起主流程，作为客户沟通、方案汇报和内部评审的统一入口。',users:['客户/合作方：判断产品链路是否完整。','产品/设计：核对页面顺序和功能覆盖。','研发/测试：确认每个路径节点都有对应页面和跳转。'],flow:['进入项目路径图。','按顺序查看：认识对象 -> 开口讲述 -> AI 追问 -> 故事成稿 -> 进入书房。','从路径说明回到具体页面验证细节。'],requirements:['屏幕地图中项目路径图排第一。','不把首页引导作为主路径第一步，避免客户误以为产品从说明页开始。','每个路径节点必须能对应到一个真实原型页面。','路径文案强调“可讲、可补、可成书、可分享、可打印”。'],edgeCases:['如果某个节点还没有页面，需在 PRD 中标注“待实现”，不能混在已完成节点里。','路径顺序调整时，同步更新屏幕地图、客户说明和 PRD 面板。'],events:[['userpath_viewed','进入项目路径图时触发；属性：entry_source, current_version。'],['userpath_step_clicked','点击某个路径步骤时触发；属性：step_name, target_page。']],acceptance:['打开原型后屏幕地图第一项为项目路径图。','路径顺序与当前产品主链路一致。','页面说明中能看出纸质成书属于后续价值，不是独立功能。'],metrics:['路径页访问率','路径步骤点击率','客户讲解完成率']},
  setup:{title:'新用户信息收集 PRD',stage:'首次使用 · 建立采访上下文',problem:'AI 采访需要知道被记录人的基础背景，否则推荐问题会泛化，但首次采集不能变成复杂档案表。',goal:'用两步以内的轻量交互完成最小必要资料采集，并基于基础信息给出开场题。',users:['子女/发起人：帮父母建档。','长辈/被记录者：自己开始记录。'],flow:['进入新用户信息收集页。','选择写谁、称呼、年龄/年代、老家/现居地等基础信息。','系统展示推荐开场题，用户选择后进入采访；或跳过直接讲。'],requirements:['页面必须是分步交互，不做长表单平铺。','只保留关系、称呼、年龄/年代、地点等基础字段。','不在首次信息页采集兴趣、重要关系等额外画像。','第二步展示基于基础信息生成的推荐开场题，不继续加字段负担。','跳过后进入采访页，但标记上下文不完整。','缺失的时间、地点、人物由 AI 在追问页补齐。'],edgeCases:['用户未填写称呼时，用“您”或“家人”兜底。','用户跳过时不弹强阻断，只在采访页使用通用问题。','重复进入时保留已选基础信息。'],events:[['profile_collection_started','进入资料采集页；属性：source_page。'],['profile_field_selected','选择字段时触发；属性：field_name, option_type。'],['profile_question_selected','选择推荐开场题；属性：question_id。'],['profile_collection_completed','点击生成推荐题目；属性：fields_completed_count, selected_question_id。'],['profile_collection_skipped','点击跳过；属性：step_index。']],acceptance:['2 步内可以完成资料采集。','页面不出现兴趣偏好/重要关系采集。','跳过也能进入采访页。','完成后进入带推荐题的采访页。'],metrics:['信息收集完成率','跳过率','推荐题目生成率']},
  session:{title:'采访录入页 PRD',stage:'讲述 · 语音/键盘输入',problem:'长辈讲述时容易停顿、跑题或担心说错；页面需要像采访员一样接住内容，同时保证录入内容可见、可保存、可继续。',goal:'完成一次可成稿的讲述采集，并把用户稳定送入 AI 追问页。',users:['长辈/被记录者：语音讲述或键盘输入。','子女/服务人员：代录、补录、整理素材。'],flow:['从首页三入口选择记录方式：选个问题慢慢讲、想到什么就讲什么、看着照片讲讲当时。','结构化记录进入预设问题采访；自由记录无前置问题；照片记录先选择照片。','用户输入或切换为语音继续说。','内容区实时展示已记录文本，支持滚动。','点击现有话题切换时，如有内容，先提示保存。','点击录完了，进入追问页。'],requirements:['首页保留三种口语化主入口，文案分别对应结构化、自由和照片讲述。','三个入口统一使用低压力的邀请语气。','输入区和内容展示区要大于辅助控件，优先保证长文本阅读。','录音默认暂停；键盘输入时提示“录音已暂停”。','语音/键盘切换必须同步按钮文案和输入状态。','已有内容时切换话题必须弹保存确认：保存并切换、放弃并切换、继续编辑。','录完了必须进入追问页，不能直接进入小结或首页。','网络慢/被拦截时，显示本地暂存提示，不打断讲述。'],edgeCases:['麦克风无权限时引导到权限页，并保留键盘输入路径。','用户无输入点击录完了，提示先讲一点或返回首页。','保存失败时保留本地草稿并允许重试。'],events:[['interview_page_viewed','进入采访页；属性：topic_id, input_mode, has_profile_context。'],['interview_input_started','首次输入/开始说话；属性：input_mode。'],['interview_input_mode_changed','语音/键盘切换；属性：from_mode, to_mode。'],['interview_completed','点击录完了；属性：duration_seconds, text_length, topic_id。']],acceptance:['首页首屏展示三个记录入口。','三个文案分别为“选个问题，慢慢讲”“想到什么，就讲什么”“看着照片，讲讲当时”。','三个入口分别进入结构化、自由和照片讲述路径。','录完了必进追问页。'],metrics:['三个入口点击率','采访开始率','采访完成率','录音失败率']},
  summary:{title:'回忆小结 / 故事卡 PRD',stage:'成稿 · 从原话到故事',problem:'用户讲完后需要看到“我刚说的话真的变成故事了”，同时要能修改，不被 AI 成稿结果绑死。',goal:'把采访内容生成可读、可编辑、可收进书房的故事卡。',users:['被记录者：确认故事是否像自己。','子女/整理者：编辑标题、正文和照片。'],flow:['从追问页点击查看回忆小结。','系统生成故事标题、分类、正文和可选照片位。','用户直接编辑文字，失焦自动保存。','用户邀请家人帮写、分享、重新讲或收进书房。'],requirements:['允许跳过追问直接查看小结。','故事卡字段支持手动编辑：标题、分类、金句、正文。','删除右上保存和底部确认按钮，采用失焦自动保存。','自动保存成功可弱提示，不抢主操作。','保留邀请帮写、分享、收进书房、接着聊。'],edgeCases:['生成失败时允许重试并保留原始输入。','自动保存失败时保留编辑态并显示重试。','用户快速离开页面时，先触发保存队列。'],events:[['memory_summary_viewed','点击查看小结；属性：answered_question_count, question_count。'],['story_card_generated','小结生成成功；属性：word_count, has_image。'],['story_card_edit_started','开始编辑；属性：field_name。'],['story_card_saved','失焦保存成功；属性：field_name, word_count。'],['story_card_invite_clicked','点击邀请帮写；属性：story_id, source_page。'],['story_card_save_failed','自动保存失败；属性：field_name, retry_count。']],acceptance:['不回答追问也能进入小结。','所有文本字段可编辑。','失焦后保存状态变化可被验证。','邀请帮写可以进入邀请页。','页面没有重复确认按钮。'],metrics:['小结查看率','故事卡编辑率','邀请帮写点击率','自动保存成功率','收进书房点击率']},
  shelf:{title:'书房页 PRD',stage:'沉淀 · 整本生命故事入口',problem:'用户需要看到故事正在逐步变成一本书，而不是散落的录音或卡片。',goal:'建立“我的生命故事书正在形成”的成果感，并承接阅读、继续讲和分享。',users:['被记录者：查看自己的故事成果。','子女：判断记录进度，继续帮父母补充。'],flow:['从底部 Tab 或小结页进入书房。','优先看到整本生命故事入口。','在书架中查看已成稿章节。','点击书本进入章节详情或整本书详情。'],requirements:['保留真实书房/书架视觉。','整本书入口优先级高于单故事卡。','故事列表减少展示量，避免把书房做成信息流。','书架三本一行，书本宽度和玻璃层尺寸稳定。','每排书下有木板，玻璃层保持在墙体内。','点击章节书本进入章节详情。'],edgeCases:['无故事时显示空态和开始讲述入口。','书本数量超过当前玻璃层时支持上下滚动。','章节状态区分已成稿、待补充。'],events:[['shelf_viewed','进入书房；属性：story_count, chapter_count, book_count。'],['shelf_book_clicked','点击整本书；属性：book_id。'],['shelf_chapter_clicked','点击章节书；属性：chapter_id, chapter_status。'],['shelf_empty_cta_clicked','空态开始讲述；属性：source_page。']],acceptance:['整本书入口明显。','玻璃层和书架视觉不溢出墙体。','一行三本书。','已成稿章节支持滚动查看。'],metrics:['书房访问率','整本书点击率','章节点击率','继续讲述率']},
  book:{title:'书详情聚合页 PRD',stage:'聚合 · 整本书管理',problem:'用户进入书详情后，需要同时理解这本书的完成度、阅读方式、可补充动作和成品输出，不应被冗余章节卡片淹没。',goal:'让书详情成为整本书的管理和转化枢纽。',users:['被记录者：阅读和分享自己的书。','子女/发起人：补内容、邀家人、导出纸质书。'],flow:['从书房点击整本书进入书详情。','查看真实书本样式和核心状态。','打开目录或阅读整本。','进入上传素材、邀请家人、分享、纸质成书。'],requirements:['封面必须是类似真实书本的视觉，不是普通卡片。','章节目录收口到右上角，卡片高度紧凑。','删除“生命起点”行和第二/第三章冗余展示。','右侧/旁侧信息只保留阅读进度、故事数、协作状态、纸质成书。','提供纸质成书/下载打印入口。','进入详情先显示轻量骨架，避免突兀。'],edgeCases:['章节为空时显示“待补充”而不是空白。','阅读预览打开后返回仍停留书详情。','纸质书入口不可用时说明需先生成至少一章。'],events:[['book_detail_viewed','进入书详情；属性：book_id, chapter_count, story_count。'],['book_read_clicked','点击阅读整本；属性：book_id。'],['book_toc_opened','打开目录；属性：chapter_count。'],['book_action_clicked','点击素材/邀请/分享/纸质书；属性：action_name, source_page。']],acceptance:['书本视觉真实。','目录入口在卡片右上角。','纸质成书入口可见。','页面高度比旧版更紧凑。'],metrics:['书详情访问率','阅读点击率','目录打开率','纸质书入口点击率']},
  printbook:{title:'纸质成书 PRD',stage:'转化 · 下载打印',problem:'数字书完成后，用户需要提前看到纸质版的真实效果，才会愿意生成 PDF、下载打印或后续付费装订。',goal:'把“下载打印”做成可预览、可理解、可信任的纸质成品流程。',users:['子女/发起人：下载给家人打印或下单装订。','长辈：确认书本成品是否满意。'],flow:['从书详情或分享页点击纸质成书。','查看纸质书规格和内页样张。','点击预览整本纸质书，横屏翻页查看。','生成打印版或下载样张。'],requirements:['入口文案统一为“纸质成书 / 下载打印”。','展示 A5、预估页数、PDF、装订说明。','预览是纸质版，不是数字阅读页。','横屏预览包含封面、目录、正文跨页、照片页、封底。','支持上一页/下一页，显示当前页类型。','生成打印版需调用排版能力：封面、目录、章节、页码、照片说明、留白。','下载前提示文件用途：可打印 PDF/样张。'],edgeCases:['页数不足时展示样张，但提示“需更多故事生成完整书”。','图片分辨率不足时提示可能影响打印。','生成失败可重试，不丢失书籍内容。','横屏预览在手机框内不能过小到无法辨认。'],events:[['paperbook_entry_clicked','点击纸质书入口；属性：source_page, book_id。'],['paperbook_preview_opened','进入纸质书页；属性：format, estimated_page_count。'],['paperbook_full_preview_opened','打开整本预览；属性：page_count。'],['paperbook_preview_page_changed','预览翻页；属性：page_index, page_type。'],['paperbook_pdf_generate_clicked','点击生成打印版；属性：book_id, page_count。'],['paperbook_pdf_downloaded','下载成功；属性：file_type, page_count。'],['paperbook_pdf_generate_failed','生成失败；属性：error_code, retry_count。']],acceptance:['书详情和分享页都能进入。','能预览封面/目录/正文/照片页/封底。','翻页按钮可用。','生成/下载动作有明确反馈。'],metrics:['纸质书入口点击率','预览打开率','平均翻页数','PDF生成成功率','下载率']},
  story:{title:'故事卡 PRD',stage:'单卡 · 图文分享',problem:'单段故事需要既能沉淀为书的一部分，也能作为可分享的图文卡传播。',goal:'让用户对单段故事完成编辑、配图和分享。',users:['子女/发起人：补图和分享。','被记录者：确认故事表达。'],flow:['从书详情或小结进入故事卡。','编辑标题、分类、金句、正文。','上传/更换照片。','分享或重新讲。'],requirements:['文字字段全部可编辑并自动保存。','照片上传有上传中、失败、重试状态。','不保留“确认这张”按钮。','分享和重新讲按钮保持底部清晰。'],edgeCases:['图片上传失败不影响文字保存。','用户修改多字段时合并保存，避免频繁提示。'],events:[['story_card_viewed','打开故事卡；属性：story_id, source_page。'],['story_photo_upload_started','开始上传照片；属性：story_id。'],['story_photo_upload_failed','照片失败；属性：error_code。'],['story_share_clicked','点击分享；属性：story_id。']],acceptance:['字段可编辑。','失焦保存。','照片失败可重试。'],metrics:['故事卡打开率','编辑保存率','照片上传成功率','分享率']},
  invite:{title:'邀请家人 PRD',stage:'协作 · 邀请补充',problem:'生命故事需要多人视角补齐，邀请页要让发起人愿意转发，也让家人知道自己能帮什么。',goal:'完成一次家人协作邀请，并把外部访问导向补充回忆。',users:['发起人/子女：邀请其他家人。','亲友：通过链接补充故事。'],flow:['从书详情进入邀请页。','查看邀请说明和落地页预览。','点击分享/复制链接。','家人打开落地页并选择身份。'],requirements:['说明“家人补充内容会进入书内待确认”。','提供预览家人看到的样子。','邀请对象与一起记录的人列表打通。','邀请行为不暴露私密内容全文。'],edgeCases:['未生成书时也可邀请，但落地页应以“帮 TA 补充第一段”为主。','链接过期或无权限时提示重新邀请。'],events:[['invite_page_viewed','进入邀请页；属性：book_id。'],['invite_preview_clicked','查看落地页预览；属性：book_id。'],['invite_sent','发送邀请；属性：channel, book_id。']],acceptance:['邀请页能跳落地页预览。','文案说明审核机制。'],metrics:['邀请页访问率','邀请发送率','落地页打开率']},
  collaborators:{title:'一起记录的人 PRD',stage:'协作 · 人员列表',problem:'发起人需要知道谁参与了记录、贡献了多少内容，以及能否查看某个人的贡献。',goal:'把协作者从“头像列表”变成可进入的贡献索引。',users:['发起人：查看家人贡献。','协作者：确认自己的参与状态。'],flow:['从书详情或邀请页进入一起记录的人。','查看传主、女儿、儿子、孙辈等角色。','点击某个人进入他给我写的内容列表。','继续邀请新人。'],requirements:['每个协作者展示角色、贡献数量、最近状态。','点击协作者跳转到贡献列表，不停留在静态详情。','提供邀请家人入口。'],edgeCases:['无协作者时展示空态和邀请按钮。','被移除协作者的贡献仍保留审核记录。'],events:[['collaborators_viewed','进入协作者页；属性：collaborator_count。'],['collaborator_clicked','点击协作者；属性：collaborator_role, contribution_count。'],['collaborator_invite_clicked','继续邀请；属性：source_page。']],acceptance:['点击一起记录的人能进入内容列表。','角色和贡献数量可见。'],metrics:['协作者页访问率','协作者点击率','继续邀请率']},
  share:{title:'当前章节分享 PRD',stage:'传播 · 小程序分享',problem:'用户需要把一章完整回忆快速发给微信好友，同时避免跳转中间页。',goal:'从分享弹窗直接调起当前章节的小程序卡片。',users:['发起人：分享当前章节。','亲友：从卡片打开小程序对应章节。'],flow:['从章节或回忆小结点击分享。','打开底部分享弹窗。','选择分享章节。','调起微信小程序分享并发送章节卡片。'],requirements:['章节分享不进入 landing。','卡片参数包含 chapter_id。','接收方打开后直达小程序对应章节。','取消或失败不离开当前页。'],edgeCases:['章节尚未生成时禁用并说明。','分享能力调起失败时提示重试。'],events:[['share_sheet_opened','属性：chapter_id, source_page。'],['chapter_miniprogram_share_clicked','属性：chapter_id。'],['chapter_miniprogram_share_completed','属性：chapter_id, channel。']],acceptance:['点击分享章节直接出现小程序分享反馈。','页面不跳转 landing。'],metrics:['章节分享点击率','章节分享完成率','分享失败率']},
  contribute:{title:'亲友视角录入 PRD',stage:'协作 · 我来补充',problem:'亲友被邀请后往往不知道写什么，系统要根据身份给出具体问题，并让补充过程足够轻。',goal:'让亲友完成一段可审核的补充回忆。',users:['亲友/同事/孙辈：补充自己的视角。','发起人：审核并收录。'],flow:['打开落地页后选择身份。','进入补充问题。','语音或文字录入。','提交后进入待确认状态。'],requirements:['身份选择影响后续问题。','补充页说明隐私范围。','支持语音和文字。','提交后写入贡献列表，状态为待确认或待查看。'],edgeCases:['身份未选时不能进入第二步。','网络失败时保留草稿。','贡献者再次打开可看到自己提交过的内容。'],events:[['contribute_started','进入补充流程；属性：source, invite_id。'],['contribute_role_selected','选择身份；属性：role。'],['contribution_submitted','提交补充；属性：input_mode, content_length。'],['contribution_save_failed','保存失败；属性：error_code。']],acceptance:['选择身份后问题文案变化。','提交后能在贡献列表看到记录。'],metrics:['身份选择率','补充提交率','保存成功率']},
  upload:{title:'上传素材 PRD',stage:'素材 · 照片与资料补充',problem:'照片、证件、老物件能增强生命故事可信度，但素材上传需要清楚告诉用户上传什么、会进入哪里。',goal:'完成素材上传并关联到书、章节或故事。',users:['子女/发起人：上传老照片和资料。','被记录者：补充实物记忆。'],flow:['从书详情进入上传素材。','选择照片/文字/其他资料类型。','上传并填写说明。','关联到章节或待整理素材库。'],requirements:['入口区分照片、文字、老物件/证件等类型。','上传进度、成功、失败重试状态完整。','允许先上传后归类。','素材进入待整理列表，后续可被 AI 用于故事补充。'],edgeCases:['大图压缩或上传慢时显示进度。','失败后保留待上传队列。','敏感证件提示仅家人可见。'],events:[['material_upload_page_viewed','进入素材页；属性：book_id。'],['material_type_selected','选择素材类型；属性：material_type。'],['material_upload_completed','上传成功；属性：material_type, file_count。'],['material_upload_failed','上传失败；属性：error_code, file_count。']],acceptance:['至少三类素材入口。','上传失败可重试。','能看到素材用途说明。'],metrics:['素材上传率','上传成功率','素材关联率']},
  review:{title:'家人帮写审核 PRD',stage:'协作 · 审核入书',problem:'家人补充内容需要主账号审核，否则会破坏被记录者对故事真实性和隐私的控制。',goal:'让主账号高效查看、采纳、修改或暂不收录家人贡献。',users:['主账号/传主：审核内容。','家人贡献者：等待反馈。'],flow:['从消息、书详情或协作者进入审核页。','查看家人贡献内容。','选择采纳、修改、暂不收录。','采纳后进入对应章节。'],requirements:['每条贡献展示贡献者、身份、时间、内容摘要。','支持采纳、修改、暂不收录。','采纳时可选择章节或自动归类。','审核结果同步通知贡献者。'],edgeCases:['内容重复时提示可能重复。','贡献内容敏感时支持仅保存不入书。'],events:[['family_review_viewed','进入审核页；属性：pending_count。'],['family_contribution_action','审核操作；属性：action, contributor_role。'],['family_contribution_accepted','采纳成功；属性：chapter_id。']],acceptance:['待审核内容有明确状态。','采纳后章节故事数更新。'],metrics:['审核查看率','采纳率','修改率','暂不收录率']},
  reviewdetail:{title:'家人补充详情 PRD',stage:'协作 · 单条审核',problem:'审核列表如果直接放正文和按钮会显得拥挤，用户也难以聚焦判断一条内容。',goal:'列表只负责定位内容，详情页负责完整阅读和采纳决策。',users:['主账号/传主：逐条查看家人补充。'],flow:['从家人帮你写的列表点击某条。','进入补充详情查看完整内容。','待确认内容可采纳进书或先放着。','已采纳内容只读返回。'],requirements:['列表页不放全文和采纳按钮。','详情页展示贡献者、时间、状态和完整内容。','待确认详情页显示采纳进书按钮。','已采纳详情页隐藏采纳按钮。'],edgeCases:['从已采纳列表进入时，详情页为只读。','返回后保留审核列表默认或当前状态。'],events:[['family_review_detail_viewed','进入补充详情；属性：status, contributor_role。'],['family_review_detail_accepted','详情页采纳；属性：contribution_id。']],acceptance:['列表点击可进入详情。','详情页能完成采纳。','已采纳详情不出现重复采纳按钮。'],metrics:['补充详情访问率','详情采纳率']},
  mine:{title:'我的页 PRD',stage:'账户 · 个人中心',problem:'用户需要一个稳定入口查看账户状态、记录进度和可选的 AI 人物形象能力。',goal:'承接账户管理、套餐、协作消息和人物形象生成。',users:['所有登录用户。'],flow:['底部 Tab 进入我的。','查看头像、昵称和故事进度。','按需进入 AI 人物形象、账户资料或套餐。'],requirements:['新增 AI 人物形象入口，明确为可选增强能力。','未生成人物形象不影响记录和分享。','顶部继续展示当前头像，不把普通头像与 AI 半身主图混为一体。'],edgeCases:['未生成时展示去生成。','已生成时入口展示查看/重新生成。'],events:[['mine_viewed','进入我的；属性：has_persona。'],['persona_entry_clicked','点击人物形象入口；属性：has_persona。']],acceptance:['AI 人物形象入口可点击。','未生成也不出现阻断弹窗。'],metrics:['人物形象入口点击率','人物形象生成率','我的页访问率']},
  persona:{title:'AI 人物形象 PRD',stage:'我的 · 可选形象增强',problem:'普通头像只能完成账号识别，用户还需要更有品牌感的人物素材用于展示和分享。',goal:'以用户照片锁定本人身份，再按所选风格生成 3:4 半身人物形象。',promptDocs:[['查看半身人物形象完整提示词','docs/ai/persona-image-prompts.md']],users:['希望制作人物海报或品牌形象的用户。'],flow:['从我的页进入人物形象。','第一步上传一张清晰半身照，无需裁剪。','上传成功后展示原图和风格选项。','选择风格并制作人物形象。','预览后可设为头像、进入品牌海报或更换半身照。'],requirements:['未上传半身照时不展示风格和生成按钮。','半身照上传后直接进入风格选择，不进入裁剪页。','原始照片是唯一身份依据，必须保持同一人的脸型、五官比例、年龄感、肤色和主要发型。','AI 主图为头部至腰部的 3:4 半身形象。','风格只改变服装、姿态、背景和光影，不得换脸、明显年轻化或生成通用网红脸。','点击分享人物形象进入品牌海报，不分享裸图。','生成完成后支持更换半身照并返回初始上传页。','设为头像必须由用户主动确认。'],edgeCases:['上传失败时停留第一步并允许重试。','人脸过小、遮挡、多人或模糊时提示重新上传。','身份一致性不合格时不得进入可设为头像状态。','生成失败时保留来源照片和所选风格。'],events:[['persona_photo_uploaded','上传半身照；属性：file_type。'],['persona_style_selected','选择风格。'],['persona_generated','生成完成。'],['persona_photo_reset','清除当前形象并返回上传页。'],['persona_set_as_avatar','设为头像。'],['persona_poster_opened','进入人物品牌海报。']],acceptance:['初始页只显示半身照上传。','上传后才显示风格与制作按钮。','上传半身照不出现裁剪页。','生成结果与参考照片为同一人，年龄、脸型和主要五官无明显漂移。','只有用户主动确认后才能设为头像。','成功后可进入品牌海报或更换半身照。'],metrics:['半身照上传率','人物形象生成率','身份一致性通过率','设为头像率','人物海报打开率']},
  personaposter:{title:'人物形象品牌海报 PRD',stage:'传播 · 品牌拉新',problem:'直接分享人物裸图缺少品牌识别和转化入口，无法承接产品拉新。',goal:'把半身人物形象合成为带品牌、Slogan 和二维码的传播海报。',users:['已生成人物形象并希望分享的用户。'],flow:['从人物形象成功页点击分享。','预览品牌人物海报。','保存图片或分享到微信。','接收方扫码进入云忆新用户流程。'],requirements:['海报包含半身人物形象、云忆品牌、主 Slogan、价值说明和二维码。','主 Slogan 为“把一生，讲成一本书”。','二维码文案引导“也为父母留下一本”。','不得在海报公开完整故事正文。'],edgeCases:['保存失败时保留预览并允许重试。','微信分享取消后停留海报页。'],events:[['persona_poster_viewed','进入海报预览；属性：persona_id。'],['persona_poster_saved','保存海报。'],['persona_poster_shared','微信分享海报。'],['persona_poster_qr_opened','扫码进入新用户流程。']],acceptance:['海报包含品牌、Slogan、二维码和拉新文案。','支持保存和微信分享。'],metrics:['人物海报保存率','人物海报分享率','二维码扫码转化率']},
  profile:{title:'账户资料 PRD',stage:'账户 · 基础资料',problem:'用户需要确认当前账号是谁，以及手机号等敏感资料是否正确。',goal:'展示和管理账号基础资料，同时保护隐私。',users:['登录用户。'],flow:['从我的页进入账户资料。','查看头像、昵称、手机号。','进入套餐页或返回。'],requirements:['手机号脱敏展示。','昵称和头像展示当前账号。','不在原型中暴露真实个人信息。','提供套餐入口。'],edgeCases:['手机号未绑定时展示绑定提示。','资料加载失败时显示重试。'],events:[['profile_viewed','进入资料页；属性：has_phone, plan_type。'],['profile_plan_clicked','点击套餐入口；属性：source_page。']],acceptance:['手机号脱敏。','套餐入口可用。'],metrics:['资料页访问率','套餐入口点击率']},
  plans:{title:'我的套餐 PRD',stage:'商业化 · 生命故事版本',problem:'用户需要理解三档生命故事套餐的差异，但讲述者不能感到自己被 15/100/303 个问题追着完成。',goal:'用“题量=书的厚度”解释套餐价值，并把三档包装成初卷、长卷、典藏的成品升级。',users:['发起人/付费决策者。'],flow:['从我的或资料页进入套餐。','查看当前人生长卷和可升级的家族典藏。','理解 15 题、100 题和 303 题是同一题库递进权益。','点击了解或升级。'],requirements:['明确人生初卷 15 题、人生长卷 100 题、家族典藏 303 题。','展示升级后可获得更多人生章节、家人补充和纸质/典藏能力。','说明 AI 后台调度题库，不适用问题自动跳过。','不得在讲述流程展示题目总数、进度分母或剩余题量。','权益文案与生命故事成品相关，而不是问卷任务清单。'],packageTiers:[['人生初卷','15 题','内置题目 ID：1、3、5、13、16、32、36、47、63、78、111、145、173、236、288。覆盖来处、家庭、童年、求学、事业、婚姻、子女、苦难、成就和传承。'],['人生长卷','100 题','按章节配额取题：家族与出生 10、童年 12、求学青春 10、事业/创业 14、婚姻爱情 10、子女家庭 10、苦难转折 8、时代/关系 10、价值/晚年 8、传承/感官 8。每章优先取基础事实、关键场景、转折事件、感悟传承四类问题。'],['家族典藏','303 题','开放当前完整 303 题访谈库。不是强制答完，AI 按年龄、婚育、职业、创业、退休等上下文自动跳过不适用问题；敏感问题支持跳过、仅私密保存或交给家人后续补充。']],edgeCases:['已是最高套餐时展示续费/增购。','支付不可用时可留下咨询。','用户跳过敏感问题时不扣除体验路径，不产生失败态。'],events:[['plans_viewed','进入套餐页；属性：plan_type, question_bank_scope。'],['plan_upgrade_clicked','点击升级；属性：from_plan, target_plan。']],acceptance:['能看懂三档套餐分别对应简版人生、完整人生和典藏人生。','PRD 面板能看到每档题目内置规则或取题逻辑。','套餐页可展示题量，但讲述流不展示总题数。','升级按钮明显但不干扰主流程。'],metrics:['套餐页访问率','升级点击率','付费转化率']},
  msgs:{title:'消息通知 PRD',stage:'召回 · 协作动态',problem:'家人回应、采纳、提问等动态如果没有通知，用户很难持续回到产品。',goal:'把协作事件转化为可点击的任务和召回入口。',users:['发起人、被记录者、贡献者。'],flow:['从我的页进入消息。','查看未读和已读消息。','点击消息进入对应页面。'],requirements:['消息类型包括采纳、回应、提问、待审核。','未读消息有明显标识。','点击后跳到具体任务页面。'],edgeCases:['无消息时展示空态和开始讲述入口。','已处理消息不重复强提醒。'],events:[['messages_viewed','进入消息页；属性：unread_count。'],['message_clicked','点击消息；属性：message_type, target_page。'],['message_marked_read','消息已读；属性：message_type。']],acceptance:['未读状态可见。','点击消息能跳转。'],metrics:['消息打开率','消息点击率','未读处理率']},
  landing:{title:'被邀请落地页 PRD',stage:'外部 · 家人进入',problem:'家人从分享链接进入时，不一定了解云忆，需要在一屏内知道“我是谁、帮谁写、写完去哪”。',goal:'让外部访客完成身份选择并开始补充。',users:['被邀请的家人、亲友、同事。'],flow:['打开邀请链接。','查看被记录人和邀请说明。','选择身份。','点击我来帮她写进入补充流程。'],requirements:['明确被邀请对象和协作目的。','身份选项覆盖女儿、儿子、孙辈、亲友/同事。','说明补充内容会收进她的书里并需确认。','提供“也给我父母做一本”二次转化入口。'],edgeCases:['链接失效时提示联系邀请人。','未选择身份时给默认亲友身份但允许修改。'],events:[['invite_landing_viewed','打开落地页；属性：invite_id, source_channel。'],['landing_role_selected','选择身份；属性：role。'],['landing_contribute_clicked','点击帮她写；属性：role。'],['landing_create_own_clicked','点击给我父母做一本；属性：source_invite_id。']],acceptance:['身份选择后说明文案变化。','能进入补充页。'],metrics:['落地页打开率','身份选择率','帮写开始率','二次转化率']},
  permfail:{title:'麦克风权限 PRD',stage:'异常 · 权限被拦截',problem:'用户说了半天没反应会快速失去信任，权限异常页要解释原因并提供替代路径。',goal:'恢复录音能力，或引导用户继续使用键盘输入。',users:['采访录入用户。'],flow:['采访页点击麦克风异常入口。','查看开启麦克风说明。','返回采访页继续输入。'],requirements:['说明当前无法录音的原因。','提供开启麦克风步骤。','保留“先回去看看/键盘输入”退路。','不让用户以为内容已丢失。'],edgeCases:['权限恢复后回到采访页自动更新按钮状态。','无法恢复时继续键盘输入。'],events:[['mic_permission_page_viewed','进入权限页；属性：permission_status。'],['mic_permission_recover_clicked','点击开启指引；属性：platform。'],['mic_permission_back_clicked','返回采访；属性：fallback_mode。']],acceptance:['异常页不阻断键盘输入。','用户知道下一步怎么做。'],metrics:['权限恢复率','返回输入率','录音失败流失率']},
  chapter:{title:'章节详情 PRD',stage:'书房 · 章节管理',problem:'章节是书架和完整书之间的中间层，用户需要知道本章已有故事和待补内容。',goal:'展示章节状态，并引导继续讲这一章或阅读本章。',users:['被记录者、子女。'],flow:['从书架点击章节书本。','查看章节名、状态、故事列表。','点击读这章或接着讲这一章。'],requirements:['展示章节编号、标题、成稿状态、故事数量。','故事列表可点击进入详情或阅读。','继续讲这一章时带入 chapter_id。'],edgeCases:['章节无故事时显示待讲问题。','未成稿章节显示待补充标签。'],events:[['chapter_detail_viewed','进入章节；属性：chapter_id, story_count, status。'],['chapter_continue_clicked','接着讲这一章；属性：chapter_id。'],['chapter_read_clicked','读这章；属性：chapter_id。']],acceptance:['章节状态和故事数清楚。','继续讲能回到采访页。'],metrics:['章节访问率','继续讲点击率','阅读点击率']},
  chapterread:{title:'读这章 PRD',stage:'阅读 · 章节正文',problem:'用户需要按书的方式连续阅读某一章，而不是被卡片切碎。',goal:'提供章节级沉浸阅读体验，并保留继续补充入口。',users:['被记录者、家人读者。'],flow:['从章节详情进入读这章。','阅读正文流。','返回章节或继续讲。'],requirements:['正文排版适合连续阅读。','显示章节编号、标题和简介。','保留回到章节和继续讲。'],edgeCases:['正文较长时支持滚动。','章节内容不足时提示继续补充。'],events:[['chapter_read_viewed','进入章节阅读；属性：chapter_id, word_count。'],['chapter_read_continue_clicked','继续讲；属性：chapter_id。']],acceptance:['能滚动阅读完整章节。','继续讲入口可用。'],metrics:['章节阅读率','阅读停留时长','继续补充率']}
});
Object.assign(PRD_CONTENT,{
  quotecard:{title:'金句卡 PRD',stage:'传播 · 单句分享',problem:'很多故事中最容易传播的是一句话，用户需要把原话及其故事语境变成适合家族群或朋友圈的图片卡。',goal:'生成一张有真实头像、有句子、且画面呼应原文内容的分享卡。',promptDocs:[['查看金句卡背景完整提示词','docs/ai/quote-card-background-prompts.md']],users:['发起人：分享一句长辈原话。','亲友：被金句吸引后阅读故事或参与补充。'],flow:['从分享页进入金句卡。','读取金句及其所在文章。','AI 提炼时代、地点、事件、人物、物件和情绪。','选择背景风格并生成无字背景。','应用端叠加头像、金句、署名和二维码。','确认后保存或分享。'],requirements:['金句必须来自故事内容或用户确认的摘要。','背景必须结合金句内容与所在文章语境，不能只套固定怀旧模板。','文章相关人物可以出现在背景中，但不得冒充用户本人、复制用户头像或遮挡排版区域。','头像仅轻度居中裁切，AI 不处理用户头像。','提供温暖纪实、旧时光胶片、东方水墨三种背景。','背景生成中、成功、失败状态清晰；失败不阻断保存和分享。','完整文章先由文本模型提炼，图片模型不接收头像、姓名、手机号或完整文章。'],edgeCases:['文章语境不足时只使用已确认的地点、季节和物件，不虚构具体历史场景。','没有头像时展示姓名首字兜底。','生成失败时保留当前默认背景并允许重试。','公开分享不得暴露隐私敏感信息。'],events:[['quote_card_viewed','进入金句卡；属性：story_id, source_page。'],['quote_context_extracted','语境提炼完成；属性：story_id, has_people。'],['quote_background_generated','背景生成完成；属性：style, result。'],['quote_card_shared','分享金句卡；属性：channel, story_id。']],acceptance:['卡片包含金句、人物信息和头像区域。','背景能看出与文章语境的关联。','背景人物符合文章关系和年代，不冒充用户本人。','三种背景可切换并展示生成状态。','生成失败仍可保存或分享。'],metrics:['金句卡打开率','语境提炼成功率','背景生成率','金句卡分享率']},
  contriblist:{title:'我补录的人 PRD',stage:'协作 · 补录对象列表',problem:'贡献者可能给多个人补录，原页面只展示单个人内容时，用户看不出来自己给谁写过。',goal:'先按被补录的人聚合，让用户点进某个人后再看具体内容。',users:['家人/亲友贡献者。'],flow:['从书房或我的进入我补录的人。','查看老周、兰秀英、小姨等被补录对象。','点击某个人进入 TA 的补录明细。'],requirements:['列表按人聚合，不直接混排所有内容。','每个人展示已补录数量、已进书数量和待查看/待确认状态。','点击人卡进入 contribperson。','本页不放继续补录一段按钮，避免不知道补给谁。'],edgeCases:['只有一个补录对象时仍展示人卡，保持层级一致。','没有补录对象时展示邀请/开始补录入口。'],events:[['contribution_people_viewed','进入我补录的人；属性：people_count。'],['contribution_person_clicked','点击被补录人；属性：target_user_id, relation。']],acceptance:['能一眼看出给多个人补录过。','点击老周后进入老周补录明细。'],metrics:['补录对象列表访问率','补录对象点击率','继续补录率']},
  contribperson:{title:'某个人的补录明细 PRD',stage:'协作 · 单人补录明细',problem:'贡献者点开某个人后，需要查看自己给 TA 补过的每段内容，并能继续给这个人补录。',goal:'承接“我补录的人”列表，展示单个被补录人的内容明细和继续补录入口。',users:['家人/亲友贡献者。'],flow:['从我补录的人点击老周。','查看给老周补过的内容和状态。','点击某条内容进入贡献详情。','点击继续给老周补录，直接进入亲友录入第二步。'],requirements:['顶部说明当前被补录人和贡献者身份。','展示总补录数、已进书数、待查看数。','每条内容展示标题、状态和章节/下一步说明。','点击条目进入 contribdetail。','底部按钮继续给当前人补录，不再选择身份。'],edgeCases:['状态为待查看时显示对方尚未查看。','状态为待确认时提示确认后更新到书里。','被补录人切换后，继续补录按钮必须同步姓名和身份。'],events:[['contribution_person_viewed','进入某个人补录明细；属性：target_user_id, relation, contribution_count。'],['contribution_item_clicked','点击贡献；属性：status, contribution_id。'],['contribution_person_continue_clicked','继续给当前人补录；属性：target_user_id, relation。']],acceptance:['点击给老周内容后看到老周的内容列表。','点击单条内容进入贡献详情。','继续补录直接进入亲友录入第二步。'],metrics:['单人补录明细访问率','贡献详情点击率','继续补录率']},
  contribdetail:{title:'贡献详情 PRD',stage:'协作 · 内容确认',problem:'贡献者需要看到某段内容的完整文本、状态和下一步动作，避免不知道是否还需要补充。',goal:'让贡献者能查看、继续补充或等待主账号采纳。',users:['家人/亲友贡献者。'],flow:['从贡献列表点击某条内容。','查看完整贡献、状态和收录位置。','需要时点击补充这段。'],requirements:['展示贡献标题、正文、提交身份、状态。','已收录内容显示章节位置。','待确认内容说明“老周确认后更新到书里”。','提供补充入口。'],edgeCases:['已收录内容再次补充需重新进入审核。','被拒绝内容显示原因和重新提交入口。'],events:[['contribution_detail_viewed','进入贡献详情；属性：contribution_id, status。'],['contribution_supplement_clicked','点击补充；属性：contribution_id, status。']],acceptance:['状态和下一步动作明确。','补充按钮可进入补充页第二步。'],metrics:['贡献详情访问率','补充点击率','重新提交率']},
  onboarding:{title:'首页引导 PRD',stage:'新手 · 可隐藏',problem:'新用户可能需要知道云忆怎么用，但过长引导会阻碍直接开始讲述。',goal:'提供可跳过的三句话引导，并在当前主路径中弱化。',users:['首次打开的发起人或被记录者。'],flow:['从我的页重看新手引导，或首次进入时出现。','阅读三句说明。','点击开始认识一下或先随便看看。'],requirements:['主流程不把引导放第一屏。','文案控制在三句话以内。','必须可跳过。','开始按钮进入新用户信息收集。'],edgeCases:['用户跳过后不反复弹出。','重看新手引导不影响已有资料。'],events:[['onboarding_viewed','进入引导页；属性：source_page, is_first_time。'],['onboarding_started','点击开始；属性：target_page。'],['onboarding_skipped','点击跳过；属性：target_page。']],acceptance:['可跳过。','开始进入 setup。'],metrics:['引导完成率','跳过率','setup 转化率']},
  default:{title:'云忆项目 PRD',stage:'全局 · 当前原型',problem:'云忆要把分散的人生讲述、家庭补充、故事整理和成书输出串成一个闭环，而不是一组独立页面。',goal:'所有页面都围绕“讲述 -> 追问 -> 成稿 -> 书房 -> 分享/纸质书”的主链路服务。',users:['被记录者、子女发起人、家人贡献者、运营/服务人员。'],flow:['新用户信息收集。','首页/采访页开始讲述。','AI 追问补齐细节。','生成回忆小结和故事卡。','收进书房并形成整本书。','邀请家人补充、分享或下载打印。'],requirements:['每页 PRD 必须包含目标、动作、规则、异常、埋点、验收。','屏幕地图与真实页面一致。','P0 主链路不能断。','不在原型中暴露真实敏感信息。'],edgeCases:['用户跳过任何非必要步骤时，仍可继续主链路。','保存失败、权限失败、生成失败都要有恢复路径。'],events:[['app_opened','打开原型；属性：entry_source。'],['screen_viewed','切换页面；属性：screen_id, source_page。']],acceptance:['主要页面都有对应详细 PRD。','PRD 面板随页面切换更新。'],metrics:['主链路完成率','故事成稿率','书房进入率','分享/纸质书转化率']}
});
Object.assign(PRD_CONTENT,{
  devhandoff:{title:'开发交付设计稿 PRD',stage:'交付 · 高保真原型转开发设计稿',problem:'当前原型已经能演示产品体验，但开发落地还需要明确页面真源、视觉规则、状态覆盖、字段交互和验收边界。',goal:'把 prototype-v17.html 升级为开发可用设计稿入口，让开发按页面、组件、状态和验收标准实现，而不是只照截图还原。',status:['已具备高保真页面、PRD 面板、UI 设计规范和主要异常状态。','本页作为开发交付总入口，串联原型、PRD、UI 规范和文档。'],inScope:['主链路页面清单和 screen id。','页面状态覆盖清单。','组件复用规则。','开发验收尺寸和交互边界。','与 docs/开发交付设计稿.md 对齐。'],deferred:['不在本仓库实现正式小程序组件。','不在原型里定义后端接口完整字段，只给出页面交互字段和埋点。','不替代后续 Figma 组件库，但可作为 Figma 重建依据。'],users:['前端开发：按页面和组件实现。','测试/验收：按状态和验收清单覆盖。','产品/设计：用同一入口确认开发边界。'],flow:['从左侧屏幕地图进入开发交付模式。','查看页面真源、视觉真源、交互真源、状态真源。','按 docs/开发交付设计稿.md 拆实现任务。','开发完成后用原型截图和验收清单逐页对照。'],requirements:['开发不得只按静态截图实现，必须覆盖 PRD 面板里的字段、异常、埋点和验收。','所有新增页面先补 screen id、地图入口和 PRD_CONTENT。','所有新增颜色、字号、按钮样式先落到 docs/UI设计规范.md 或复用现有 token。','讲述、书房、故事卡、协作、我的页必须组件化拆分。'],edgeCases:['如果原型视觉和 UI 规范冲突，先以 UI 规范为准，再回修原型。','如果演示态和真实开发态冲突，优先真实业务状态，不保留纯演示假交互。','如果某状态无法在原型中点击触达，必须在开发交付文档中列为待补。'],events:[['design_handoff_viewed','进入开发交付模式；属性：source_page。'],['handoff_section_checked','查看交付模块；属性：section_name。'],['handoff_acceptance_completed','开发验收完成；属性：screen_id, result。']],acceptance:['左侧屏幕地图有开发交付入口。','本页能说明页面、视觉、交互、状态四类真源。','右侧 PRD 面板能展示开发交付说明。','docs/开发交付设计稿.md 与本页内容一致。'],metrics:['交付入口访问率','开发返工率','状态漏实现数','逐页验收通过率']}
});
Object.assign(PRD_CONTENT,{
  setup:{title:'新用户信息收集 PRD',stage:'首次使用 · 建立采访上下文',problem:'AI 采访需要知道被记录人的基础背景，但首次采集不能让长辈感觉像在填复杂档案。',goal:'保留原有采访资料，只移除头像收集，让用户尽快开始讲述。',users:['长辈/被记录者。','子女/发起人。'],flow:['进入资料收集页。','选择这本书写谁。','填写称呼、年龄/年代和地点。','选择平时喜好和想重点留下的内容。','开启人生回忆或跳过。'],requirements:['首次资料页只删除头像上传，不删除其他原有信息。','保留关系、称呼、年龄、年代、地点、兴趣和重点内容。','首次页不生成人物形象。','整页允许跳过。'],edgeCases:['未填写称呼时使用“您”或“家人”。','跳过后使用通用采访问题。'],events:[['profile_collection_started','进入资料采集页。'],['profile_field_selected','选择资料字段；属性：field_name。'],['profile_collection_completed','完成资料；属性：fields_completed_count。'],['profile_collection_skipped','跳过资料。']],acceptance:['页面不出现头像上传。','原有其他资料字段全部保留。','跳过也能进入采访。'],metrics:['信息收集完成率','兴趣选择率','重点内容选择率','跳过率']},
  share:{title:'分享底部弹窗 PRD',stage:'传播 · 当前章节轻分享',problem:'用户需要把当前章节直接分享给微信好友，不应再经过中间落地页。',goal:'用底部弹窗承接分享，让用户快速选择金句卡、章节小程序卡片或保存长图。',users:['发起人：把当前章节发给家人或朋友圈。','亲友：从小程序章节卡片打开并阅读。'],flow:['从故事卡或回忆小结点击分享。','底部弹窗展示当前章节摘要。','选择分享章节。','直接调起微信小程序分享能力并发送当前章节卡片。'],requirements:['分享以底部弹窗呈现。','分享章节不跳转落地页。','章节卡片携带当前章节标识并直接打开小程序对应章节。','分享方式为金句卡、分享章节、保存长图。','不显示复制链接。'],edgeCases:['用户取消微信分享后停留原页面。','分享能力调起失败时提示重试。','章节含敏感内容时后续正式版应提示先编辑。'],events:[['share_sheet_opened','打开分享弹窗；属性：chapter_id, source_page。'],['chapter_miniprogram_share_clicked','点击分享章节；属性：chapter_id。'],['chapter_miniprogram_share_completed','章节小程序卡片发送完成；属性：chapter_id, channel。']],acceptance:['弹窗内显示金句卡、分享章节、保存长图。','点击分享章节不进入 landing。','点击后直接出现小程序分享反馈。'],metrics:['分享弹窗打开率','章节分享点击率','章节分享完成率','保存长图成功率']},
  contribute:{title:'亲友视角录入 PRD',stage:'协作 · 我来补充',problem:'亲友被邀请后往往不知道写什么，系统要根据身份给出具体问题，并让补充过程和采访录音页一样轻。',goal:'让亲友用语音、文字和图片视频完成一段可审核的补充回忆。',users:['亲友/同事/孙辈：补充自己的视角。','发起人：审核并收录。'],flow:['从邀请落地页进入时先选择身份。','从某个人补录明细或贡献详情补充时，直接进入第二步并沿用已知身份。','在补充页查看身份条和问题卡。','上传照片/视频，或用语音/文字补充。','提交后写入贡献列表，状态为待确认或待查看。'],requirements:['补充回忆的录入逻辑与采访录音页一致。','第一步只在身份未知时出现。','已知身份补录时不再要求选择身份。','补充页支持多张照片和视频上传、横向展示和拖拽排序。','图片/视频上传后再展示素材条。','提交失败时保留草稿。'],edgeCases:['身份未选且不是已知身份进入时，停留第一步。','重新补充已收录内容时，新增内容进入审核。','上传失败的素材可保留失败态并重试。'],events:[['contribute_started','进入补充流程；属性：source, invite_id, has_known_role。'],['contribute_role_selected','选择身份；属性：role。'],['contribute_media_uploaded','上传素材；属性：media_type, media_count。'],['contribution_submitted','提交补充；属性：input_mode, content_length, media_count。'],['contribution_save_failed','保存失败；属性：error_code。']],acceptance:['已知身份进入时直接显示第二步。','补充页可上传多张图片/视频并排序。','问题卡、身份条、录入区层级清楚。','提交后能在贡献列表看到记录。'],metrics:['身份选择率','补充提交率','素材上传率','保存成功率']},
  contribperson:{title:'某个人的补录明细 PRD',stage:'协作 · 单人补录明细',problem:'贡献者点开某个人后，需要查看自己给 TA 补过的每段内容，并能继续给这个人补录。',goal:'承接“我补录的人”列表，展示单个被补录人的内容明细和继续补录入口。',users:['家人/亲友贡献者。'],flow:['从我补录的人点击老周。','查看给老周补过的内容、数量和状态。','点击某条内容进入贡献详情。','点击继续给老周补录，直接进入亲友录入第二步。'],requirements:['顶部说明当前被补录人和贡献者身份。','展示总补录数、已进书数、待查看数。','每条内容展示标题、状态和章节/下一步说明。','点击条目进入 contribdetail。','底部按钮继续给当前人补录，不再选择身份。'],edgeCases:['状态为待查看时显示对方尚未查看。','状态为待确认时提示确认后更新到书里。','被补录人切换后，继续补录按钮必须同步姓名和身份。'],events:[['contribution_person_viewed','进入某个人补录明细；属性：target_user_id, relation, contribution_count。'],['contribution_item_clicked','点击贡献；属性：status, contribution_id。'],['contribution_person_continue_clicked','继续给当前人补录；属性：target_user_id, relation。']],acceptance:['点击给老周内容后看到老周的内容列表。','点击单条内容进入贡献详情。','继续补录直接进入亲友录入第二步。'],metrics:['单人补录明细访问率','贡献详情点击率','继续补录率']},
  contribdetail:{title:'贡献详情 PRD',stage:'协作 · 内容查看与补充',problem:'贡献者需要看到某段内容的完整文本、状态和下一步动作，避免不知道是否还需要补充。',goal:'让贡献者能查看已录内容，并在需要时补充这段。',users:['家人/亲友贡献者。'],flow:['从单人补录明细点击某条内容。','查看问题、完整回答、状态、素材和收录位置。','需要时点击补充这段，直接进入亲友录入第二步。'],requirements:['展示贡献标题、问题、正文、提交身份、状态。','如有图片/视频，使用与家人补充详情一致的素材展示方式。','已收录内容显示章节位置。','待确认内容说明确认后更新到书里。','提供补充这段入口。'],edgeCases:['已收录内容再次补充需重新进入审核。','被退回内容显示原因和重新提交入口。','素材点击后放大查看。'],events:[['contribution_detail_viewed','进入贡献详情；属性：contribution_id, status, media_count。'],['contribution_media_opened','打开素材预览；属性：media_type。'],['contribution_supplement_clicked','点击补充；属性：contribution_id, status。']],acceptance:['问题、回答和状态不混在一个框里。','有素材时展示图片/视频横向列表。','补充按钮可进入亲友录入第二步。'],metrics:['贡献详情访问率','素材查看率','补充点击率','重新提交率']},
  review:{title:'家人帮写审核 PRD',stage:'协作 · 审核列表',problem:'家人补充内容需要主账号审核，但列表页如果承载全文和操作会显得拥挤。',goal:'让列表只负责筛选和定位，具体采纳动作放到详情页完成。',users:['主账号/传主：审核内容。','家人贡献者：等待反馈。'],flow:['从消息、书详情或协作者进入审核页。','在待确认和已采纳之间切换。','点击列表条目进入家人补充详情。','在详情页阅读、预览素材并决定采纳。'],requirements:['列表页支持待确认/已采纳切换。','列表条目只展示贡献者、身份、时间、标题摘要和状态。','列表页不放全文和采纳按钮。','点击条目进入 reviewdetail。'],edgeCases:['无待确认内容时展示轻空态。','从已采纳进入详情时只读。','返回列表后保留当前切换状态。'],events:[['family_review_viewed','进入审核列表；属性：pending_count, accepted_count。'],['family_review_tab_switched','切换审核分类；属性：tab_name。'],['family_review_item_clicked','点击审核条目；属性：status, contributor_role。']],acceptance:['待确认和已采纳可切换。','列表简洁，不出现大段正文和采纳按钮。','点击条目进入详情页。'],metrics:['审核列表访问率','待确认点击率','已采纳查看率','详情进入率']},
  reviewdetail:{title:'家人补充详情 PRD',stage:'协作 · 单条审核',problem:'单条家人补充可能包含文字、照片和视频，需要在一个聚焦页面里完成阅读、预览和采纳判断。',goal:'列表只负责定位内容，详情页负责完整阅读、素材查看和采纳决策。',users:['主账号/传主：逐条查看家人补充。'],flow:['从家人帮写列表点击某条。','进入补充详情查看贡献者、问题、正文和素材。','点击图片或视频放大查看。','待确认内容可采纳进书或先放着；已采纳内容只读返回。'],requirements:['详情页展示贡献者、时间、状态、问题和完整内容。','图片和视频使用统一横向素材列表。','图片/视频均支持点击放大查看。','待确认详情页显示采纳进书按钮。','已采纳详情页隐藏采纳按钮。'],edgeCases:['无素材时不展示素材区域。','视频预览用统一视频占位，不打断详情阅读。','从已采纳列表进入时，详情页为只读。','返回后保留审核列表当前状态。'],events:[['family_review_detail_viewed','进入补充详情；属性：status, contributor_role, media_count。'],['family_review_media_opened','打开素材预览；属性：media_type。'],['family_review_detail_accepted','详情页采纳；属性：contribution_id。']],acceptance:['列表点击可进入详情。','详情页能查看图片和视频。','待确认详情页能完成采纳。','已采纳详情不出现重复采纳按钮。'],metrics:['补充详情访问率','素材查看率','详情采纳率']}
});
PRD_CONTENT.session.promptDocs=[['查看 AI 追问完整提示词','docs/ai/followup-prompts.md']];
PRD_CONTENT.session.requirements.push('自由录入也要在追问阶段补齐时间、地点、人物关系、动作和关键物件；缺失时优先追问，不凭空补全。','用户可以确认、补充或跳过追问，跳过不影响查看回忆预览。');
PRD_CONTENT.session.acceptance.push('自由录入的内容会检查时间、地点和人物关系是否缺失；缺失时生成对应小问题。');
var PRD_FIELDS={
  userpath:[['路径阶段','点击路径节点查看对应页面或说明','认识对象 / 开口讲述 / AI 追问 / 故事成稿 / 进入书房'],['阶段状态','只读展示，标识该阶段是否已在原型覆盖','已完成 / 待补充 / 后续能力'],['目标页面','点击后跳转到对应 screen','setup / session / summary / shelf / book / printbook']],
  setup:[['被记录人关系','单选 chip，选择后高亮并写入上下文','我自己 / 父亲 / 母亲 / 祖父母 / 其他亲人'],['称呼/昵称','文本输入，失焦保存；为空时用兜底称呼','1-12 个中文字符；默认“秀英”或“家人”'],['年龄/年代','文本或单选，用于推荐问题','年龄数字 / 50 后 / 60 后 / 70 后 / 不确定'],['老家/现居地','基础地点字段，用于生成生活场景问题','城市/区县；可为空'],['平时喜好','多选 chip，用于生成生活类问题','种花 / 做饭 / 唱戏 / 旅行'],['重点内容','多选 chip，用于调整采访优先级','老照片 / 家族往事 / 工作经历 / 给孩子的话'],['跳过状态','按钮动作，进入采访但标记资料不完整','true / false']],
  session:[['首页记录入口','三个主入口按钮，点击进入不同记录路径','选个问题，慢慢讲 / 想到什么，就讲什么 / 看着照片，讲讲当时'],['当前话题','点击话题/章节触发切换；有内容时先弹保存确认','出生与家族 / 童年 / 求学 / 工作 / 成家 / 全部话题'],['输入模式','底部按钮切换；文案和录音态同步变化','keyboard / voice；默认 keyboard 且录音暂停'],['录音状态','按钮切换，影响波形和转写进度','paused / listening / failed'],['已录入文本','内容区可编辑或流式写入，支持滚动','0-5000 字；为空时不可直接完成'],['未保存状态','输入、转写、上传素材后置 true；保存/放弃后置 false','true / false'],['保存弹窗动作','切换话题或章节时出现','保存后切换 / 不保存继续切换 / 继续讲当前题']],
  summary:[['故事标题','可编辑文本，失焦自动保存','1-24 字；默认由 AI 根据内容生成'],['故事分类','点击分类或自动归类','出生与家族 / 童年 / 求学 / 工作 / 成家 / 亲人'],['金句','可编辑文本，用于金句卡和分享','不限制字数；可为空'],['故事正文','富文本/长文本编辑，失焦自动保存','建议 200-1200 字'],['后续动作','按钮点击进入对应页面','邀请帮写 / 分享 / 收进书房 / 接着聊']],
  shelf:[['整本书入口','点击进入书详情','book_id；默认“我的时光印记”'],['章节书本','点击进入章节详情','第一章-第六章；状态：已成稿 / 待补充'],['书架滚动','玻璃层内纵向滚动','scrollTop 0-N'],['空态按钮','无内容时显示并进入采访页','开始讲述']],
  book:[['书名','只读展示，后续可进入编辑','我的时光印记'],['封面样式','点击阅读或预览，视觉使用真实书本','陶土橙封面 / 纸张侧边 / 书脊'],['目录入口','右上角按钮打开目录抽屉','打开 / 关闭'],['书本状态','只读展示完成度','章节数 / 故事数 / 协作者数 / 阅读进度'],['功能入口','点击进入子流程','上传素材 / 邀请家人 / 分享成书 / 纸质成书']],
  printbook:[['纸张规格','只读或后续下拉选择','A5；后续可扩展 A4 / B5'],['预估页数','系统计算展示','整数；当前示例 86 页'],['导出格式','按钮选择生成类型','PDF / 样张 PDF'],['预览页型','翻页按钮切换','封面 / 目录 / 正文跨页 / 照片页 / 封底'],['生成状态','点击生成后进入状态流转','未生成 / 生成中 / 成功 / 失败可重试']],
  story:[['标题','可编辑，失焦保存','1-24 字'],['分类','点击或自动归类','童年 / 家族 / 求学 / 工作 / 成家 / 其他'],['正文','长文本编辑，失焦保存','建议 100-800 字'],['照片','上传入口，展示进度和失败重试','未上传 / 上传中 / 成功 / 失败'],['操作按钮','点击进入后续动作','分享 / 重新讲']],
  invite:[['邀请对象','选择或输入家人关系','女儿 / 儿子 / 孙辈 / 亲友 / 同事'],['邀请渠道','点击分享动作','微信 / 复制链接 / 面对面二维码'],['权限范围','只读说明或后续选择','仅家人可见 / 可公开精选片段'],['落地页预览','点击进入 landing','预览 / 返回']],
  collaborators:[['协作者角色','列表展示，点击进入贡献列表','传主 / 女儿 / 儿子 / 孙辈 / 亲友'],['贡献数量','只读展示','0-N 段'],['最近状态','只读标签','已讲 / 帮录 / 补充 / 出题 / 待确认'],['邀请按钮','点击进入邀请页','邀请家人一起记']],
  share:[['分享方式','点击进入对应分享流程','金句卡 / 分享章节 / 保存长图'],['章节参数','小程序卡片携带','chapter_id'],['分享渠道','由微信分享面板选择','微信好友 / 家族群'],['分享状态','分享动作后反馈','未分享 / 分享成功 / 取消 / 失败']],
  quotecard:[['金句内容','可编辑或从故事中选择','不限制字数，卡片自动换行适配'],['人物称呼','只读或来自资料','秀英 / 爸爸 / 妈妈 / 自定义称呼'],['卡片样式','点击切换模板','纸张款 / 老照片款 / 留白款'],['分享渠道','点击分享','朋友圈 / 微信好友 / 保存图片']],
  landing:[['访问身份','chip 单选，影响后续问题','女儿 / 儿子 / 孙辈 / 亲友 / 同事'],['邀请对象','只读展示传主信息','姓名/称呼脱敏展示'],['帮写入口','点击进入 contribute','我来帮她写'],['二次转化入口','点击进入自建流程','也给我父母做一本']],
  contribute:[['关系身份','第一步单选，决定问题模板','老同事 / 女儿 / 儿子 / 孙辈 / 亲友'],['补充问题','系统根据身份展示','你们怎么认识的 / 印象最深的一次 / 他年轻时的样子'],['输入方式','语音/文字切换','voice / keyboard'],['补充内容','长文本或语音转写','0-3000 字'],['提交状态','提交后进入状态','待确认 / 已发送 / 保存失败']],
  contriblist:[['贡献标题','列表主标题，点击进入详情','1-30 字'],['收录状态','标签展示','已进书 / 待确认 / 待查看 / 被退回'],['关联章节','只读展示','第一章-第六章 / 暂未归类'],['最近更新时间','只读展示','刚刚 / N 小时前 / 昨天 / 日期']],
  contribdetail:[['贡献正文','只读展示，点击补充进入录入','100-1200 字'],['提交身份','只读展示','女儿 / 儿子 / 同事 / 亲友'],['当前状态','状态标签','已收录 / 待确认 / 待查看 / 被退回'],['补充按钮','点击直接进入亲友录入第二步','补充这段']],
  upload:[['素材类型','入口卡片选择','老照片 / 文字资料 / 老物件 / 证件资料 / 视频'],['文件数量','上传后统计','1-20 个'],['素材说明','可选文本输入','0-100 字'],['关联位置','选择归类目标','整本书 / 某章节 / 某故事 / 待整理'],['上传状态','进度和结果展示','未上传 / 上传中 / 成功 / 失败']],
  review:[['贡献者','只读展示家人身份','女儿 / 儿子 / 孙辈 / 亲友'],['列表条目','点击进入详情，不在列表采纳','待确认 / 已采纳'],['审核分类','顶部切换','待确认 / 已采纳'],['审核状态','列表标签','待确认 / 已采纳']],
  reviewdetail:[['贡献者','只读展示家人身份和时间','女儿 / 儿子 / 孙辈 / 亲友'],['补充正文','完整展示家人补充内容','20-1200 字'],['详情状态','只读状态标签','待确认 / 已采纳'],['详情动作','待确认时显示','先放着 / 采纳进书']],
  mine:[['用户身份','只读展示','本人 / 子女发起人 / 家人协作者'],['故事进度','只读统计','已讲段数 / 章节数 / 已成稿数'],['套餐状态','点击进入套餐页','人生初卷 / 人生长卷 / 家族典藏'],['未读消息','点击进入消息页','0-N 条']],
  profile:[['头像','点击更换或只读展示','图片 / 姓名首字'],['昵称','文本输入，失焦保存','1-12 字'],['手机号','脱敏只读或绑定','138****0000 / 未绑定'],['套餐入口','点击进入 plans','当前套餐名称']],
  persona:[['来源照片','第一步直接上传，不裁剪','清晰正面半身照'],['半身主图','AI 生成 3:4 竖版形象','头部至腰部'],['形象风格','照片上传后单选','温暖生活 / 典雅东方 / 旧时光'],['生成状态','页面状态流转','待上传 / 已上传 / 生成中 / 已生成 / 失败'],['成功动作','生成成功后点击','分享人物形象 / 设为头像 / 更换半身照']],
  personaposter:[['人物主图','使用已确认 AI 半身形象','3:4 半身图'],['品牌信息','海报固定叠加','云忆 · 生命故事'],['主 Slogan','固定品牌文案','把一生，讲成一本书'],['拉新引导','二维码旁文案','扫码，也为父母留下一本'],['海报动作','点击执行','保存图片 / 分享到微信']],
  plans:[['当前套餐','只读展示','人生初卷 / 人生长卷 / 家族典藏'],['成书深度','只读展示','15 题 / 100 题 / 当前完整 303 题库'],['题库调度','后台权益说明','AI 自动跳过不适用问题'],['升级目标','点击选择套餐','人生长卷 / 家族典藏'],['支付状态','后续支付流转','未支付 / 支付中 / 成功 / 失败']],
  msgs:[['消息类型','列表标签或图标','采纳 / 回应 / 提问 / 待审核 / 系统'],['未读状态','点击消息后置已读','unread / read'],['跳转目标','点击消息进入对应页面','session / review / contribute / book'],['消息时间','只读展示','刚刚 / N 小时前 / 昨天 / 日期']],
  onboarding:[['引导页序号','滑动或点击切换','1 / 2 / 3'],['开始按钮','点击进入资料采集','开始，先认识一下'],['跳过入口','点击进入采访页','先随便看看'],['展示状态','首次展示后记录','未看 / 已看 / 已跳过']],
  permfail:[['权限状态','系统检测展示','未授权 / 已拒绝 / 已授权 / 不支持'],['恢复动作','点击查看设置指引','开启麦克风 / 返回键盘输入'],['兜底输入','按钮返回采访键盘输入','keyboard'],['错误原因','只读说明','浏览器权限 / 小程序权限 / 系统权限']],
  chapter:[['章节编号','只读展示','第一章-第六章'],['章节标题','只读或后续可编辑','出生与家族 / 童年时光 / 求学的日子等'],['章节状态','标签展示','已成稿 / 待补充'],['故事列表','点击进入阅读或故事详情','0-N 条'],['继续讲按钮','点击回采访并携带章节','chapter_id']],
  chapterread:[['章节正文','连续阅读内容','0-N 字，支持滚动'],['阅读位置','滚动记录','scrollTop 0-N'],['继续讲入口','点击回采访','chapter_id'],['读整本入口','点击进入整本书阅读','book/read']],
  devhandoff:[['页面真源','开发页面清单来自 screen id 和屏幕地图','prototype-v17.html#<screen_id>'],['视觉真源','颜色、字号、圆角、按钮、卡片规则来自 UI 规范','docs/UI设计规范.md'],['交互真源','每页字段、埋点、异常、验收来自 PRD 面板','PRD_CONTENT / PRD_FIELDS'],['状态真源','开发必须覆盖的页面状态清单','normal / empty / loading / error / success / permission / offline'],['验收宽度','移动端优先校验宽度','390 / 414 / 430']],
  default:[['页面 ID','路由切换时读取','screen_id'],['来源页面','跳转时记录','source_page'],['用户类型','全局上下文','被记录者 / 子女 / 协作者 / 运营'],['书籍 ID','业务对象标识','book_id']]
};
Object.assign(PRD_FIELDS,{
  setup:[['被记录人关系','单选 chip，选择后高亮并写入采访上下文','我自己 / 父亲 / 母亲 / 祖父母 / 其他亲人'],['称呼/昵称','文本输入，失焦保存；为空时用兜底称呼','1-12 个中文字符；默认“秀英”或“家人”'],['年龄','文本或数字输入，用于基础画像和推荐问题','数字年龄 / 可为空'],['出生年代','点击字段打开下拉菜单，选中后回填字段','40 后 / 50 后 / 60 后 / 70 后 / 80 后 / 不确定'],['老家','点击字段调用通用地址选择器','省 / 市 / 区；可为空'],['现住地','点击字段调用通用地址选择器','省 / 市 / 区；可为空'],['通用地址选择器','全局底部弹层组件，非 setup 页面专用组件','左取消 / 中标题 / 右保存；三列省市区'],['主按钮','点击进入采访页并完成资料采集','开启人生回忆'],['跳过入口','弱化按钮，进入通用采访并标记资料不完整','跳过']],
  share:[['分享容器','点击分享时打开底部弹窗，不切换主页面','closed / open'],['片段摘要','弹窗顶部只读展示当前片段','标题 + 一句摘要 + 缩略图'],['分享方式','点击进入或触发对应动作','金句卡 / 片段 / 保存长图'],['关闭动作','点击遮罩或关闭按钮','tap_mask / tap_close'],['分享状态','分享动作后反馈','未分享 / 分享成功 / 取消 / 失败']],
  contribute:[['关系身份','第一步单选；已知身份补录时跳过第一步','老同事 / 女儿 / 儿子 / 孙辈 / 亲友'],['身份条','第二步顶部只读展示当前身份','以老同事身份 / 以女儿身份等'],['补充问题','系统根据身份展示','你们怎么认识的 / 印象最深的一次 / 他年轻时的样子'],['素材列表','上传后才展示，支持横向滑动和拖拽排序','0-N 张图片 / 0-N 段视频'],['输入方式','语音/文字切换','voice / keyboard'],['补充内容','长文本或语音转写','0-3000 字'],['提交状态','提交后进入状态','待确认 / 待查看 / 保存失败']],
  contribperson:[['被补录人','当前明细页对象，只读展示','老周 / 兰秀英 / 小姨等'],['贡献者身份','当前贡献者与被补录人的关系','老同事 / 女儿 / 亲友'],['汇总数字','只读展示当前人下的贡献统计','已补录 N 段 / 已进书 N 段 / 待查看 N 段'],['补录条目','点击进入贡献详情','标题 / 状态 / 时间 / 章节提示'],['继续补录','点击直接进入亲友录入第二步','沿用当前被补录人和身份']],
  contribdetail:[['贡献问题','只读展示本段来源问题','1 条问题文本'],['贡献正文','只读展示，点击补充进入录入','100-1200 字'],['素材列表','如有图片/视频则横向展示并可放大','0-N 张图片 / 0-N 段视频'],['提交身份','只读展示','女儿 / 儿子 / 同事 / 亲友'],['当前状态','状态标签','已收录 / 待确认 / 待查看 / 被退回'],['补充按钮','点击直接进入亲友录入第二步','补充这段']],
  review:[['审核分类','顶部切换列表状态','待确认 / 已采纳'],['列表条目','点击进入详情，不在列表采纳','贡献者 / 标题摘要 / 时间 / 状态'],['待确认数','顶部只读统计','0-N'],['审核状态','列表标签','待确认 / 已采纳']],
  reviewdetail:[['贡献者','只读展示家人身份和时间','女儿 / 儿子 / 孙辈 / 亲友'],['来源问题','只读展示本段对应问题','1 条问题文本'],['补充正文','完整展示家人补充内容','20-1200 字'],['素材列表','图片和视频统一横向展示，可点击放大','0-N 张图片 / 0-N 段视频'],['详情状态','只读状态标签','待确认 / 已采纳'],['详情动作','待确认时显示','先放着 / 采纳进书']]
});
function renderPrd(id){
  var data=PRD_CONTENT[id]||PRD_CONTENT.default;
  var fields=PRD_FIELDS[id]||PRD_FIELDS.default;
  var title=document.getElementById('prdTitle'), stage=document.getElementById('prdStage'), body=document.getElementById('prdBody');
  if(title)title.textContent=data.title;
  if(stage)stage.textContent=data.stage;
  if(!body)return;
  function list(title,items){return items&&items.length?'<div class="prd-block"><h3>'+title+'</h3><ul class="prd-list">'+items.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></div>':'';}
  function para(title,text){return text?'<div class="prd-block"><h3>'+title+'</h3><p>'+text+'</p></div>':'';}
  function events(items){return items&&items.length?'<div class="prd-block"><h3>埋点事件</h3><div class="prd-event">'+items.map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>';}).join('')+'</div></div>':'';}
  function fieldList(items){return items&&items.length?'<div class="prd-block"><h3>字段交互 / 取值</h3><div class="prd-field">'+items.map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span><i>取值：'+x[2]+'</i></div>';}).join('')+'</div></div>':'';}
  function metrics(items){return items&&items.length?'<div class="prd-block"><h3>核心指标</h3><div class="prd-metrics">'+items.map(function(x){return '<span>'+x+'</span>';}).join('')+'</div></div>':'';}
  function promptDocs(items){return items&&items.length?'<div class="prd-block"><h3>AI 提示词</h3><div class="prd-docs">'+items.map(function(x){return '<a href="'+x[1]+'" target="_blank" rel="noopener">'+x[0]+'</a>';}).join('')+'</div></div>':'';}
  function packageTiers(items){return items&&items.length?'<div class="prd-block"><h3>套餐题目内置规则</h3><div class="prd-field">'+items.map(function(x){return '<div><b>'+x[0]+' · '+x[1]+'</b><span>'+x[2]+'</span></div>';}).join('')+'</div></div>':'';}
  body.innerHTML=para('问题',data.problem)+para('目标',data.goal)+promptDocs(data.promptDocs)+list('当前状态',data.status)+list('本版范围',data.inScope)+list('暂缓/后续',data.deferred)+list('目标用户',data.users)+list('用户流程',data.flow)+list('功能规则',data.requirements)+packageTiers(data.packageTiers)+list('异常与边界',data.edgeCases)+fieldList(fields)+events(data.events)+list('验收标准',data.acceptance)+metrics(data.metrics);
}
function togglePrdPanel(){
  var p=document.getElementById('prdPanel'), t=document.getElementById('prdToggle');
  if(!p)return;
  p.classList.toggle('collapsed');
  if(t)t.textContent=p.classList.contains('collapsed')?'展开':'收起';
}
function go(id){
  if(id==='share'){ openShareSheet(); renderPrd('share'); return; }
  if(typeof ivClearFlash==='function') ivClearFlash();   /* 离开当前屏一律停掉“记下啦”倒计时，避免后台把人跳走 */
  hidePayFloat('payMilestone'); hidePayFloat('payPeak');  /* 离屏清掉峰值付费浮卡 */
  closeShareSheet();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  var el=document.getElementById(id); if(el){el.classList.add('on'); var b=el.querySelector('.body'); if(b)b.scrollTop=0;}
  document.querySelectorAll('.map button').forEach(function(x){x.classList.toggle('act',x.dataset.go===id);});
  renderPrd(id);
  closeTopics(); closeDrawer(); closeToc();
  if(id==='setup') setupShow(1);
  if(id==='mine'||id==='profile'||id==='quotecard'||id==='persona') syncAvatarViews();
  if(id==='persona')personaRender(PersonaStore.get(PersonaStore.generatedKey)?'ready':(PersonaStore.get(PersonaStore.sourceKey)?'source':'idle'));
  if(id==='session'){ var rb=document.getElementById('recoverBar'); if(rb) rb.style.display = hasDraft ? 'flex' : 'none'; ivEnter(); }
  if(id==='book'){ bookShowPreview(); bookSkeleton(); } /* 进「我的书」默认显示成书视图（预览）+ 骨架屏 */
  if(id==='review') rvSwitch('pending');
}
/* P0-6 书详情骨架屏：进入书详情短暂显示后揭开真内容 */
function bookSkeleton(){ var s=document.getElementById('bkSkel'); if(!s)return; s.style.display='block'; clearTimeout(window._bkSk); window._bkSk=setTimeout(function(){s.style.display='none';},420); }
/* P0-4 情感峰值付费浮卡 */
function showPayFloat(id){ var e=document.getElementById(id); if(e){ e.classList.add('show'); } }
function hidePayFloat(id){ var e=document.getElementById(id); if(e){ e.classList.remove('show'); } }
function openShareSheet(){ var e=document.getElementById('shareSheet'); if(e)e.classList.add('show'); }
function closeShareSheet(){ var e=document.getElementById('shareSheet'); if(e)e.classList.remove('show'); }
function openMediaPreview(type,src,caption){
  var lb=document.getElementById('mediaLightbox'), box=document.getElementById('mediaPreviewBox');
  if(!lb||!box)return;
  var cap='<div class="cap">'+(caption||'素材预览')+'</div>';
  if(type==='video'){
    box.innerHTML='<div class="media-video-large"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>'+cap;
  }else{
    box.innerHTML='<img src="'+(src||'')+'" alt="">'+cap;
  }
  lb.classList.add('show');
}
function closeMediaPreview(){ var lb=document.getElementById('mediaLightbox'); if(lb)lb.classList.remove('show'); }
function rvSwitch(tab){
  var pending=tab!=='done';
  document.querySelectorAll('#review .rv-tab').forEach(function(t){t.classList.toggle('on',t.dataset.rvTab===(pending?'pending':'done'));});
  var p=document.getElementById('rvPending'), d=document.getElementById('rvDone');
  if(p)p.classList.toggle('on',pending);
  if(d)d.classList.toggle('on',!pending);
  var title=document.getElementById('rvTitle'), sub=document.getElementById('rvSub'), count=document.getElementById('rvCount'), label=document.getElementById('rvCountLabel');
  if(title)title.textContent=pending?'待确认的家人补充':'已采纳的补充';
  if(sub)sub.textContent=pending?'点开内容查看，再决定是否采纳。':'这些内容已经收进书里。';
  if(count)count.textContent=pending?'2':'1';
  if(label)label.textContent=pending?'待处理':'已采纳';
}
function openReviewDetail(title,meta,avatar,status,story){
  var done=status==='done';
  var av=document.getElementById('rvdAvatar'), h=document.getElementById('rvdTitle'), m=document.getElementById('rvdMeta'), st=document.getElementById('rvdStatus'), body=document.getElementById('rvdStory'), actions=document.getElementById('rvdActions');
  var person=document.getElementById('rvdPerson'), badge=document.getElementById('rvdBadgeMeta'), kind=document.getElementById('rvdKind');
  if(av)av.textContent=avatar||'家';
  if(h)h.textContent=title||'家人补充了一段回忆';
  if(m)m.textContent=meta||'家人 · 刚刚';
  if(st)st.textContent=done?'已采纳':'待确认';
  if(body)body.textContent=story||'这里展示家人补充的完整内容。';
  if(person)person.textContent='来自：'+((meta||'家人').split(' · ')[0]||'家人');
  if(badge)badge.textContent=done?'已采纳':'待确认';
  if(kind)kind.textContent=done?'照片 1':'照片 1 · 视频 1';
  if(actions){
    actions.classList.toggle('done',done);
    actions.innerHTML=done?'<button class="ghost" data-go="review">返回列表</button>':'<button class="ghost" data-go="review">先放着</button><button class="primary" data-toast="已采纳，收进书里">采纳进书</button>';
  }
  go('reviewdetail');
}
/* 断网态演示开关 */
function showOffline(on){ var e=document.getElementById('offlineBar'); if(e) e.classList.toggle('show', on!==false); }
/* P0-6 空态演示开关 */
function shelfEmptyDemo(on){ var f=document.getElementById('shelfFull'),e=document.getElementById('shelfEmpty'); if(f)f.style.display=on?'none':''; if(e)e.style.display=on?'flex':'none'; }
/* 书房分段 tab 高亮切换（视觉演示） */
function shelfTab(b){ var p=b.parentNode; for(var i=0;i<p.children.length;i++) p.children[i].classList.remove('on'); b.classList.add('on'); }
/* 章节详情：从书房点一本书（=一个章节）进入，按章填充内容 */
var currentChapterIndex=0;
var CHAPTERS=[
  {no:'第一章',name:'出生与家族',done:true,stories:['我的名字是谁取的','门口的老槐树','爷爷奶奶的老屋']},
  {no:'第二章',name:'童年时光',done:true,stories:['过年的新棉袄','头一天上学','村口的那口井']},
  {no:'第三章',name:'求学的日子',done:true,stories:['上学要走过一条河','启蒙老师','同桌的一块橡皮']},
  {no:'第四章',name:'参军岁月',done:false,stories:['新兵连的第一课','高原上的那场雪']},
  {no:'第五章',name:'成家立业',done:false,stories:['和老伴第一次见面','盖起自己的房子']},
  {no:'第六章',name:'儿女绕膝',done:false,stories:['老大出生那天','一家人的年夜饭']}
];
function memoirEscape(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function chapterStoryText(chapter,story,idx){
  var lead=idx===0?'这一段像是这章的开场，顺着讲下去，人物和场景一下就立住了。':'这一段把前后的日子接了起来，读起来已经像书里的一节。';
  return '“'+story+'”这一段，已经被小云理进《'+chapter.name+'》里。'+lead+' 现在先按单章阅读的方式收着，后面还可以继续往这一章里补故事、补照片、补家人的记忆。';
}
function openChapter(i){
  var c=CHAPTERS[i]; if(!c)return;
  currentChapterIndex=i;
  document.getElementById('chH').textContent=c.no;
  document.getElementById('chNo').textContent=c.no;
  document.getElementById('chName').textContent=c.name;
  var st=document.getElementById('chSt'); st.textContent=c.done?'已成稿':'整理中'; st.className='ch-pill '+(c.done?'done':'wait');
  document.getElementById('chCount').textContent='已讲 '+c.stories.length+' 段';
  var ico='<span class="ci-ico"><svg class="ico-ph" viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2V5Z"/><path d="M20 5a2 2 0 0 0-2-2h-5v16h5a2 2 0 0 1 2 2V5Z"/></svg></span>';
  document.getElementById('chList').innerHTML = c.stories.map(function(s,idx){
    return '<button class="ch-item" onclick="openChapterRead('+idx+')">'+ico+'<span class="ci-t">'+memoirEscape(s)+'</span><span class="ci-chev">›</span></button>';
  }).join('');
  go('chapter');
}
function openChapterRead(focusIdx){
  var c=CHAPTERS[currentChapterIndex]; if(!c)return;
  var focus=(typeof focusIdx==='number'&&focusIdx>=0)?focusIdx:0;
  document.getElementById('crNo').textContent=c.no;
  document.getElementById('crTitle').textContent=c.name;
  document.getElementById('crMeta').textContent=c.stories.length+' 段故事';
  document.getElementById('crFlow').innerHTML=c.stories.map(function(story,idx){
    return '<div class="cr-card'+(idx===focus?' current':'')+'"><div class="eyebrow"><b>第 '+(idx+1)+' 段</b>'+(idx===focus?'<span class="tag">当前这段</span>':'')+'</div><div class="ttl">'+memoirEscape(story)+'</div><div class="txt">'+chapterStoryText(c,story,idx)+'</div></div>';
  }).join('');
  go('chapterread');
}
function msgsEmptyDemo(on){ var f=document.getElementById('msgsFull'),e=document.getElementById('msgsEmpty'); if(f)f.style.display=on?'none':''; if(e)e.style.display=on?'flex':'none'; }
/* P0-6 加照片：上传中 → 失败（占位示意，可重试） */
function storySaveEdits(silent){
  var s=document.getElementById('story');
  if(document.activeElement&&document.activeElement.blur) document.activeElement.blur();
  if(s) s.classList.remove('story-dirty');
  window._storyEdited=true;
  if(!silent) toast('故事卡已保存');
}
document.addEventListener('input',function(e){
  if(e.target&&e.target.matches&&e.target.matches('#story [data-story-edit]')){
    var s=document.getElementById('story'); if(s) s.classList.add('story-dirty');
  }
  if(e.target&&e.target.matches&&e.target.matches('#ivLiveTxt[contenteditable="true"]')){
    window._ivHasUnsavedRec=true;
  }
});
document.addEventListener('focusout',function(e){
  if(e.target&&e.target.matches&&e.target.matches('#story [data-story-edit]')){
    var s=document.getElementById('story');
    if(s&&s.classList.contains('story-dirty')) storySaveEdits(false);
  }
});
function storyUpload(){ var up=document.getElementById('storyUp'),f=document.getElementById('storyUpFail'); if(!up)return; f.classList.remove('show'); up.classList.add('show'); clearTimeout(window._upT); window._upT=setTimeout(function(){ up.classList.remove('show'); f.classList.add('show'); },1400); }
function landRole(el,type){ var box=document.getElementById('landRoles'); if(box) box.querySelectorAll('.chip').forEach(function(c){c.classList.remove('on')}); el.classList.add('on'); var h=document.getElementById('landRoleHint'); if(!h)return; if(type==='friend'){ h.classList.add('friend'); h.textContent='答几个「你眼中的她」，内容只你和家人可见、经她确认后再进书。'; } else { h.classList.remove('friend'); h.textContent='帮她讲、帮她补充，内容会收进她的书里。'; } }
function sumMediaCover(){ var g=document.getElementById('sumMedia'); if(!g)return; g.querySelectorAll('.sum2-fig').forEach(function(it,i){ var c=it.querySelector('.sm-cover'); if(i===0){ if(!c){c=document.createElement('span');c.className='sm-cover';c.textContent='封面';it.insertBefore(c,it.firstChild);} c.style.display=''; } else if(c){ c.remove(); } }); }
function sumMediaDel(e,el){ e.stopPropagation(); var it=el.closest('.sum2-fig'); if(it)it.remove(); sumMediaCover(); }
function sumMediaAdd(){ var g=document.getElementById('sumMedia'); if(!g)return; var it=document.createElement('figure'); it.className='sum2-fig'; it.setAttribute('draggable','true'); it.innerHTML='<div class="frame"><svg class="clip" viewBox="0 0 24 50" fill="none" stroke="#9c8a72" stroke-width="2.4" stroke-linecap="round"><path d="M7 15 V37 a5 5 0 0 0 10 0 V10 a3 3 0 0 0 -6 0 V35"/></svg><div class="media p1"><svg class="pic" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M4 18l5-5 3 3 3-3 5 5"/></svg></div></div><figcaption>新添加的照片 · 点此写说明</figcaption><span class="sm-del" onclick="sumMediaDel(event,this)">×</span>'; g.appendChild(it); sumMediaCover(); toast('已添加到这段，可拖动调整顺序'); }
function sumMediaInit(){ var g=document.getElementById('sumMedia'); if(!g||g._i)return; g._i=1; var drag=null;
  g.addEventListener('dragstart',function(e){ var it=e.target.closest('.sum2-fig'); if(!it){e.preventDefault();return;} drag=it; e.dataTransfer.effectAllowed='move'; setTimeout(function(){it.classList.add('dragging')},0); });
  g.addEventListener('dragend',function(){ if(drag)drag.classList.remove('dragging'); drag=null; sumMediaCover(); });
  g.addEventListener('dragover',function(e){ e.preventDefault(); if(!drag)return; var kids=[].slice.call(g.children).filter(function(c){return c!==drag;}); var after=null; for(var i=0;i<kids.length;i++){ var r=kids[i].getBoundingClientRect(); if(e.clientY < r.top + r.height/2){ after=kids[i]; break; } } if(after){ if(drag.nextSibling!==after) g.insertBefore(drag, after); } else if(g.lastElementChild!==drag){ g.appendChild(drag); } });
}
sumMediaInit();
var CT_Q={
  colleague:{cat:'给老同事的问题',qs:['你们是怎么共事的？印象最深的一次，是一起做成了什么事？','工作里，她最让你佩服、或最较真的地方是什么？']},
  friend:{cat:'给老朋友的问题',qs:['你们是怎么认识的？年轻时最常一起做的事是什么？','有没有一件小事，让你觉得「这就是她」？']},
  neighbor:{cat:'给老邻居的问题',qs:['住在一块儿的日子，最有人情味的一件事是什么？','街坊里提起她，大家最常说的一句是什么？']},
  student:{cat:'给学生的问题',qs:['她当年是怎么教你的？有没有一句话你记到现在？','毕业这么多年，最想对老师说的一句是什么？']},
  relative:{cat:'给亲戚的问题',qs:['在家族里，她是个什么样的人？','逢年过节，最记得她做的什么、说的什么？']},
  other:{cat:'给亲友的问题',qs:['你和她是怎么认识的？','关于她，你最想讲的一件事是什么？']}
};
var _ctRole='colleague',_ctIdx=0,_mycPerson='老周',_mycRole='colleague',_mycRoleName='老同事';
function ctPick(role,name){ _ctRole=role; _ctIdx=0; var rn=document.getElementById('ctRoleName'); if(rn)rn.textContent=name; ctRender(); ctRenderMediaItems([],false); var s1=document.getElementById('ctStep1'),s2=document.getElementById('ctStep2'),ft=document.getElementById('ctRecFoot'); if(s1)s1.style.display='none'; if(s2)s2.style.display=''; if(ft)ft.style.display=''; var b=document.querySelector('#contribute .body'); if(b)b.scrollTop=0; }
function ctReset(){ var s1=document.getElementById('ctStep1'),s2=document.getElementById('ctStep2'),ft=document.getElementById('ctRecFoot'); if(s1)s1.style.display=''; if(s2)s2.style.display='none'; if(ft)ft.style.display='none'; ctRenderMediaItems([],false); }
function openMyContribPerson(name,initial,role,roleName,total,done,pending,status){
  _mycPerson=name||'老周';
  _mycRole=role||'colleague';
  _mycRoleName=roleName||'老同事';
  var nav=document.getElementById('mycDetailNav'), ey=document.getElementById('mycDetailEy'), title=document.getElementById('mycDetailTitle'), sub=document.getElementById('mycDetailSub');
  var t=document.getElementById('mycDetailTotal'), d=document.getElementById('mycDetailDone'), p=document.getElementById('mycDetailPending'), btn=document.getElementById('mycDetailContinue');
  if(nav)nav.textContent='给'+_mycPerson+'补的';
  if(ey)ey.textContent='你以'+_mycRoleName+'身份补录';
  if(title)title.textContent='给'+_mycPerson+'补了 '+(total||'5')+' 段';
  if(sub)sub.textContent='这里是你给 '+_mycPerson+' 写过的内容和当前状态。';
  if(t)t.textContent=total||'5';
  if(d)d.textContent=done||'1';
  if(p)p.textContent=pending||'3';
  if(btn)btn.textContent='继续给'+_mycPerson+'补录';
  go('contribperson');
}
function openContributionDetail(title,state,story,badge){
  var person=_mycPerson||'老周', role=_mycRoleName||'老同事';
  var st=document.getElementById('contribDetailState'), h=document.getElementById('contribDetailTitle'), sub=document.getElementById('contribDetailSub');
  var q=document.getElementById('contribDetailQuestion'), body=document.getElementById('contribDetailStory'), p=document.getElementById('contribDetailPerson'), r=document.getElementById('contribDetailRole'), b=document.getElementById('contribDetailBadge');
  var av=document.getElementById('contribDetailAvatar'), target=document.getElementById('contribDetailFor'), from=document.getElementById('contribDetailFrom'), topBadge=document.getElementById('contribDetailBadgeTop');
  if(st)st.textContent=state||'待查看';
  if(h)h.textContent=title||'补录内容';
  if(sub)sub.textContent=(person||'TA')+'确认后，这段会作为亲友补充收进书里。';
  if(q)q.textContent=title||'关于 TA 的一段回忆';
  if(body)body.textContent=story||'这里展示你已经补录的具体内容。';
  if(av)av.textContent=(person||'TA').slice(0,1);
  if(target)target.textContent='给'+person+'补的一段';
  if(from)from.textContent=role+'口述补录';
  if(topBadge)topBadge.textContent=badge||state||'待查看';
  if(p)p.textContent='补充给：'+person;
  if(r)r.textContent='身份：'+role;
  if(b)b.textContent=badge||state||'待查看';
  go('contribdetail');
}
function toggleMycStory(row){ if(row)row.classList.toggle('open'); }
function ctSupplementForCurrentPerson(){ go('contribute'); ctPick(_mycRole||'colleague', _mycRoleName||'老同事'); }
function ctSupplementFromDetail(){ ctSupplementForCurrentPerson(); }
function ctSwap(){ var d=CT_Q[_ctRole]; if(!d)return; _ctIdx=(_ctIdx+1)%d.qs.length; ctRender(); }
function ctRender(){ var d=CT_Q[_ctRole]; if(!d)return; var txt=document.getElementById('ctQText'); if(txt)txt.textContent=d.qs[_ctIdx]; }
function ctToggleMine(btn){ var m=document.getElementById('ctMine'); if(!m)return; var open=m.style.display==='none'; m.style.display=open?'':'none'; btn.classList.toggle('open',open); }
function ctRecToggle(){ var b=document.getElementById('ctRecToggle'),card=document.getElementById('ctRecCard'),lab=document.getElementById('ctRecLabel'); if(!b)return; var paused=b.classList.toggle('paused'); if(card)card.classList.toggle('rec-paused',paused); if(lab)lab.textContent=paused?'已暂停':'正在聆听…'; b.querySelector('.ic').innerHTML=paused?'<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>':'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>'; b.querySelector('.lb').textContent=paused?'继续':'暂停'; }
function ctDone(){ toast('这段补充已提交，经兰秀英确认后收进书'); }
function ctRenderMediaItems(items, notify){
  window._ctMediaItems=items||[];
  var list=document.getElementById('ctMediaList');
  var page=document.getElementById('contribute');
  if(page) page.classList.toggle('has-ct-media', !!window._ctMediaItems.length);
  if(!list) return;
  list.innerHTML='';
  window._ctMediaItems.forEach(function(media,index){
    var v=media.type==='video';
    var tile=document.createElement('div');
    tile.className='iv2-thumb'+(v?' video':'');
    tile.draggable=true;
    tile.dataset.index=index;
    tile.ondragstart=ctMediaDragStart;
    tile.ondragover=ctMediaDragOver;
    tile.ondragleave=ctMediaDragLeave;
    tile.ondrop=ctMediaDrop;
    tile.ondragend=ctMediaDragEnd;
    if(v){
      tile.innerHTML='<div class="poster"><svg class="ico-ph" viewBox="0 0 24 24"><rect x="4" y="5" width="13" height="14" rx="2"/><path d="M17 10l4-2.5v9L17 14"/></svg></div><span class="badge">视频</span>';
    }else{
      tile.innerHTML='<img alt=""><span class="badge">照片</span>';
      tile.querySelector('img').src=media.url;
    }
    list.appendChild(tile);
  });
  list.classList.toggle('show', !!window._ctMediaItems.length);
  if(notify){
    var photo=0, video=0;
    window._ctMediaItems.forEach(function(item){ if(item.type==='video') video++; else photo++; });
    var parts=[];
    if(photo) parts.push(photo+' 张照片');
    if(video) parts.push(video+' 段视频');
    toast('已添加 '+parts.join('、')+'，稍后配进这段');
  }
}
function ctMediaPicked(input){
  var files=input&&input.files;
  if(!files||!files.length) return;
  var current=window._ctMediaItems||[];
  var picked=Array.prototype.map.call(files,function(file){
    var isVideo=file.type&&file.type.indexOf('video/')===0;
    return {type:isVideo?'video':'photo',name:file.name||'素材',url:isVideo?'':URL.createObjectURL(file)};
  });
  ctRenderMediaItems(current.concat(picked),true);
  input.value='';
}
function ctMediaDragStart(e){
  var tile=e.currentTarget;
  window._ctMediaDragIndex=Number(tile.dataset.index);
  tile.classList.add('dragging');
  if(e.dataTransfer){
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain', String(window._ctMediaDragIndex));
  }
}
function ctMediaDragOver(e){
  e.preventDefault();
  if(e.dataTransfer) e.dataTransfer.dropEffect='move';
  e.currentTarget.classList.add('drop-target');
}
function ctMediaDragLeave(e){ e.currentTarget.classList.remove('drop-target'); }
function ctMediaDragEnd(){
  document.querySelectorAll('#ctMediaList .iv2-thumb.dragging,#ctMediaList .iv2-thumb.drop-target').forEach(function(el){
    el.classList.remove('dragging','drop-target');
  });
  window._ctMediaDragIndex=null;
}
function ctMediaDrop(e){
  e.preventDefault();
  var from=Number(e.dataTransfer&&e.dataTransfer.getData('text/plain'));
  if(!Number.isFinite(from)) from=Number(window._ctMediaDragIndex);
  var to=Number(e.currentTarget.dataset.index);
  var items=(window._ctMediaItems||[]).slice();
  if(!Number.isFinite(from)||!Number.isFinite(to)||from===to||!items[from]||!items[to]){ctMediaDragEnd();return;}
  var moved=items.splice(from,1)[0];
  items.splice(to,0,moved);
  ctRenderMediaItems(items,false);
  ctMediaDragEnd();
  toast('已调整素材顺序');
}
/* 回听：缓冲 → 播放中（占位示意） */
/* P0-5/P0-8 讲述目录 → 半屏「回看」模态 */
function openTopics(){var m=document.getElementById('hmodal'),s=document.getElementById('hmScrim');if(m)m.classList.add('open');if(s)s.classList.add('open');}
function closeTopics(){var m=document.getElementById('hmodal'),s=document.getElementById('hmScrim');if(m)m.classList.remove('open');if(s)s.classList.remove('open');}
/* 换个话题：不是选题器——软性交给小云换一问（长辈不选题） */
var ivSkipCount=0, ivFree=false;
var ivFreeText='我也说不好从哪讲起……就先想起我娘。夏天槐花开的时候，她会拿一个竹篮子，站在门口那棵老槐树底下，一把一把地捋槐花。回屋以后先用清水淘一遍，再拌一点玉米面，上锅一蒸，满屋子都是甜香。那时候家里穷，没什么好吃的，可我到现在还记得那个味道。傍晚吃完饭，全村人都搬着小板凳坐到树下乘凉，大人说收成，说谁家添了娃，小孩就在旁边追着萤火虫跑。对了，我爷爷是教书先生，方圆几里的娃都跟他念过书。他写字特别好，过年给人写春联，红纸铺满一桌子。我小时候不懂，只觉得他拿毛笔的样子很神气。';
function ivSkipTopic(){
  if(ivHasUnsavedTopicDraft()){ openTopicSave(); return; }
  ivSwitchTopicNow();
}
function ivSwitchTopicNow(){
  ivSkipCount++;
  if(ivSkipCount>=3){ ivSkipCount=0; ivFreeTalk(); return; }   /* 连换 3 个话题没开口 → 兜底进「随便讲讲」 */
  toast('好嘞，咱换个轻省的聊'); ivConfirm();
}
function ivHasUnsavedTopicDraft(){
  var pane=document.getElementById('ivListenPane'), txt=document.getElementById('ivLiveTxt');
  if(!pane || pane.style.display==='none') return false;
  var textLen=txt ? txt.textContent.trim().length : 0;
  return !!(window._ivHasUnsavedRec || ivLiveIdx>0 || textLen>0);
}
function ivOpenChapterSwitch(){
  if(ivFree){ toast('随便讲讲不用选目录，讲完我来帮您归类'); return; }
  if(ivHasUnsavedTopicDraft()){ openTopicSave(function(){ivOpenQuestionSelect('chapters');}); return; }
  ivOpenQuestionSelect('chapters');
}
function openTopicSave(next){
  ivLiveStop();
  window._topicSaveFromListen=true;
  window._topicSaveNext=typeof next==='function'?next:null;
  ivShowPane('Listen');
  ivMood('已暂停，先确认是否保存');
  ivRecUI();
  var m=document.getElementById('topicSaveModal'); if(m)m.classList.add('open');
}
function closeTopicSave(){
  var m=document.getElementById('topicSaveModal'); if(m)m.classList.remove('open');
  if(window._topicSaveFromListen){
    ivShowPane('Listen');
    ivMood(ivRecPaused?'已暂停 · 点“继续说”接着录':'正在听您说');
  }
  window._topicSaveFromListen=false;
  if(!ivRecPaused && document.getElementById('ivListenPane').style.display!=='none') ivLiveRun();
}
function ivRunTopicSaveNext(){
  var next=window._topicSaveNext;
  window._topicSaveNext=null;
  if(typeof next==='function') next();
  else ivSwitchTopicNow();
}
function topicSwitchSave(){
  window._topicSaveFromListen=false;
  window._ivHasUnsavedRec=false; closeTopicSave();
  toast('已保存当前内容，稍后整理');
  ivRunTopicSaveNext();
}
function topicSwitchDiscard(){
  window._topicSaveFromListen=false;
  window._ivHasUnsavedRec=false; closeTopicSave();
  toast('已放弃当前内容');
  ivRunTopicSaveNext();
}
/* 随便讲讲：不挑题，随口说，AI 后台归类 */
function ivStructuredStart(){
  ivFree=false;
  ivSelectedQuestion=null;
  window._ivPendingQuestion=null;
  window._ivQuestionKeyword='';
  var badge=document.getElementById('ivFreeBadge'); if(badge) badge.style.display='none';
  ivOpenQuestionSelect('linked');
  ivMood('先选一个问题');
}
function ivOpenQuestionSelect(mode,chapterIndex){
  ivQuestionMode='linked';
  if(typeof chapterIndex==='number') ivQuestionChapter=chapterIndex;
  else ivQuestionChapter=ivFirstQuestionChapter();
  ivRenderQuestionSelect();
  var p=document.getElementById('ivSelectPane'), sess=document.getElementById('session');
  if(p&&sess&&p.parentNode!==sess) sess.appendChild(p);
  if(p)p.style.display='flex';
}
function ivCloseQuestionSelect(){ var p=document.getElementById('ivSelectPane'); if(p)p.style.display='none'; ivMood('在陪您聊天'); }
function ivFirstQuestionChapter(){
  for(var i=0;i<IV_CHAPTER_QUESTIONS.length;i++){
    if(IV_CHAPTER_QUESTIONS[i].questions&&IV_CHAPTER_QUESTIONS[i].questions.length>0) return i;
  }
  return 0;
}
function ivQuestionDone(chapterIndex,questionIndex){
  return chapterIndex===0&&questionIndex===0 || chapterIndex===1&&questionIndex===0;
}
function ivRenderQuestionSelect(){
  var list=document.getElementById('ivqList'), confirm=document.getElementById('ivqConfirm');
  if(!list)return;
  list.classList.add('linked');
  var kw=(window._ivQuestionKeyword||'').trim();
  var available=IV_CHAPTER_QUESTIONS.map(function(ch,i){
    var qs=(ch.questions||[]).filter(function(q){
      return !kw || ch.title.indexOf(kw)>=0 || q.q.indexOf(kw)>=0 || (q.hint||'').indexOf(kw)>=0;
    });
    return {chapter:ch,index:i,questions:qs};
  }).filter(function(x){return x.questions.length>0;});
  if(!available.some(function(x){return x.index===ivQuestionChapter;})){
    ivQuestionChapter=available[0]?available[0].index:ivFirstQuestionChapter();
  }
  var chapters=IV_CHAPTER_QUESTIONS.map(function(ch,i){
    var match=(ch.questions||[]).filter(function(q){
      return !kw || ch.title.indexOf(kw)>=0 || q.q.indexOf(kw)>=0 || (q.hint||'').indexOf(kw)>=0;
    });
    var count=match.length;
    if(count<=0)return '';
    return '<button class="ivq-tab '+(i===ivQuestionChapter?'on':'')+'" onclick="ivPickQuestionChapter('+i+')">'+ch.title+'</button>';
  }).join('');
  var ch=IV_CHAPTER_QUESTIONS[ivQuestionChapter]||IV_CHAPTER_QUESTIONS[ivFirstQuestionChapter()]||IV_CHAPTER_QUESTIONS[0];
  var questionItems=(ch.questions||[]).map(function(q,i){return {q:q,index:i};}).filter(function(item){
    return !kw || ch.title.indexOf(kw)>=0 || item.q.q.indexOf(kw)>=0 || (item.q.hint||'').indexOf(kw)>=0;
  }).slice(0,2);
  var questions=questionItems.map(function(item,n){
    var selected=window._ivPendingQuestion&&window._ivPendingQuestion.chapterIndex===ivQuestionChapter&&window._ivPendingQuestion.questionIndex===item.index;
    var done=ivQuestionDone(ivQuestionChapter,item.index);
    return '<button class="ivq-question '+(selected?'on':'')+'" onclick="ivSelectPendingQuestion('+ivQuestionChapter+','+item.index+')"><span class="ivq-num">'+(n+1)+'</span><span class="ivq-txt"><b>'+item.q.q+'</b></span><span class="ivq-status '+(done?'done':'')+'">'+(done?'已录':'待录')+'</span><span class="ivq-go">'+(selected?'✓':'')+'</span></button>';
  }).join('');
  list.innerHTML='<div class="ivq-chapters">'+chapters+'</div><div class="ivq-questions">'+(questions||'<div class="ivq-empty">没有找到匹配的问题</div>')+'</div>';
  if(confirm) confirm.disabled=!window._ivPendingQuestion;
}
function ivPickQuestionChapter(i){
  var ch=IV_CHAPTER_QUESTIONS[i]||IV_CHAPTER_QUESTIONS[0];
  if(!ch.questions||ch.questions.length<=0)return;
  ivQuestionChapter=i;
  ivRenderQuestionSelect();
}
function ivQuestionSearch(value){
  window._ivQuestionKeyword=value||'';
  window._ivPendingQuestion=null;
  ivRenderQuestionSelect();
}
function ivSelectPendingQuestion(chapterIndex,questionIndex){
  window._ivPendingQuestion={chapterIndex:chapterIndex,questionIndex:questionIndex};
  ivQuestionChapter=chapterIndex;
  ivRenderQuestionSelect();
}
function ivConfirmQuestionPick(){
  if(!window._ivPendingQuestion){ toast('先选一个问题'); return; }
  ivChooseQuestion(window._ivPendingQuestion.chapterIndex,window._ivPendingQuestion.questionIndex);
}
function ivChooseChapter(i){
  var ch=IV_CHAPTER_QUESTIONS[i]||IV_CHAPTER_QUESTIONS[0];
  ivQuestionChapter=i;
  if(ch.questions.length>=1){ ivPickQuestionChapter(i); return; }
  toast('这一章还没有可讲的问题');
}
function ivChooseQuestion(chapterIndex,questionIndex){
  ivFree=false;
  var ch=IV_CHAPTER_QUESTIONS[chapterIndex]||IV_CHAPTER_QUESTIONS[0], q=ch.questions[questionIndex]||ch.questions[0];
  ivCloseQuestionSelect();
  ivQuestionChapter=chapterIndex;
  ivSelectedChapterTitle=ch.title;
  ivSelectedQuestion=q;
  ivTurn=Math.max(0,Math.min((typeof q.turn==='number'?q.turn:0),ivTurns.length-1));
  ivRender();
  ivListen();
}
function ivStartChapter(ch){
  ivFree=false;
  ivCloseQuestionSelect();
  ivSelectedChapterTitle=ch.title;
  ivSelectedQuestion={q:'这一章里，您最想先讲哪件事？',hint:'不用按题，先从最有画面的一件事讲起',turn:0,said:ivFreeText};
  ivTurn=0;
  ivRender();
  ivListen();
}
function ivFreeEntry(){
  ivFree=true;
  ivSelectedQuestion=null;
  ivCloseQuestionSelect();
  ivListen();
}
function ivPhotoEntry(){
  var pick=document.getElementById('ivPhotoPick');
  if(pick) pick.click();
}
function ivPhotoPicked(input){
  var file=input&&input.files&&input.files[0];
  if(!file) return;
  var pp=document.getElementById('ivPhotoPreview');
  var img=document.getElementById('ivPhotoPreviewImg');
  if(pp&&img){
    if(window._ivPhotoObjectUrl) URL.revokeObjectURL(window._ivPhotoObjectUrl);
    window._ivPhotoObjectUrl=URL.createObjectURL(file);
    img.src=window._ivPhotoObjectUrl;
    img.alt=file.name||'上传的照片';
    pp.classList.remove('portrait','landscape');
    img.onload=function(){
      pp.classList.toggle('portrait', img.naturalHeight>img.naturalWidth);
      pp.classList.toggle('landscape', img.naturalWidth>=img.naturalHeight);
    };
  }
  toast('照片上传成功，开始讲这一张');
  setTimeout(function(){ ivPhotoListen('照片'); if(input) input.value=''; },450);
}
function uploadMaterialPicked(type){
  var label=type||'素材';
  if(window._uploadFromPhotoEntry){
    toast('已选择'+label+'，接下来可以看着照片讲');
    window._uploadFromPhotoEntry=false;
    setTimeout(function(){ go('session'); ivPhotoListen(label); },650);
    return;
  }
  toast('选择'+label+'上传（演示）');
}
function ivMockMediaSvg(fill,accent){
  return '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="'+fill+'"/><circle cx="214" cy="178" r="72" fill="#fff3e9" opacity=".82"/><rect x="326" y="120" width="178" height="190" rx="18" fill="#fffaf2" opacity=".78"/><path d="M0 342 C130 300 230 365 340 325 C452 286 526 318 640 276 V420 H0 Z" fill="'+accent+'" opacity=".32"/></svg>';
}
function ivRenderMediaItems(items, notify){
  if(!items||!items.length) return;
  window._ivMediaItems=items;
  var photo=0, video=0;
  items.forEach(function(item){
    if(item.type==='video') video++;
    else photo++;
  });
  var parts=[];
  if(photo) parts.push(photo+' 张照片');
  if(video) parts.push(video+' 段视频');
  var msg='已添加 '+parts.join('、')+'，稍后配进这段';
  var first=items[0], isVideo=first.type==='video';
  var pane=document.getElementById('ivListenPane');
  var pp=document.getElementById('ivPhotoPreview');
  var img=document.getElementById('ivPhotoPreviewImg');
  var list=document.getElementById('ivMediaList');
  if(pane) pane.classList.add('has-media');
  if(list){
    list.innerHTML='';
    items.forEach(function(media,index){
      var v=media.type==='video';
      var tile=document.createElement('div');
      tile.className='iv2-thumb'+(v?' video':'');
      tile.draggable=true;
      tile.dataset.index=index;
      tile.ondragstart=ivMediaDragStart;
      tile.ondragover=ivMediaDragOver;
      tile.ondragleave=ivMediaDragLeave;
      tile.ondrop=ivMediaDrop;
      tile.ondragend=ivMediaDragEnd;
      tile.onclick=function(){ivSelectMedia(index);};
      if(v){
        tile.innerHTML='<div class="poster"><svg class="ico-ph" viewBox="0 0 24 24"><rect x="4" y="5" width="13" height="14" rx="2"/><path d="M17 10l4-2.5v9L17 14"/></svg></div><span class="badge">视频</span>';
      }else{
        tile.innerHTML='<img alt=""><span class="badge">照片</span>';
        tile.querySelector('img').src=media.url;
      }
      list.appendChild(tile);
    });
    list.classList.add('show');
  }
  if(pp){
    pp.classList.toggle('video',!!isVideo);
    pp.classList.remove('portrait','landscape');
    var label=pp.querySelector('span');
    if(label) label.textContent=msg.replace('已添加 ','已添加')+' · 可以看着继续讲';
  }
  if(img){
    if(window._ivMediaObjectUrl) URL.revokeObjectURL(window._ivMediaObjectUrl);
    if(isVideo){
      img.removeAttribute('src');
      img.alt=first.name||'上传的视频';
    }else{
      img.src=first.url;
      img.alt=first.name||'上传的照片';
      img.onload=function(){
        if(!pp)return;
        pp.classList.toggle('portrait', img.naturalHeight>img.naturalWidth);
        pp.classList.toggle('landscape', img.naturalWidth>=img.naturalHeight);
      };
    }
  }
  var live=document.querySelector('#ivListenPane .iv2-scroll');
  if(live) live.scrollTop=0;
  ivSelectMedia(0);
  if(notify) toast(msg);
}
function ivSelectMedia(index){
  var items=window._ivMediaItems||[];
  var media=items[index];
  if(!media) return;
  var isVideo=media.type==='video';
  var pane=document.getElementById('ivListenPane');
  var pp=document.getElementById('ivPhotoPreview');
  var img=document.getElementById('ivPhotoPreviewImg');
  if(pane) pane.classList.add('has-media');
  if(pp){
    pp.classList.toggle('video',isVideo);
    pp.classList.remove('portrait','landscape');
  }
  if(img){
    if(isVideo){
      img.removeAttribute('src');
      img.alt=media.name||'上传的视频';
    }else{
      img.src=media.url;
      img.alt=media.name||'上传的照片';
      img.onload=function(){
        if(!pp)return;
        pp.classList.toggle('portrait',img.naturalHeight>img.naturalWidth);
        pp.classList.toggle('landscape',img.naturalWidth>=img.naturalHeight);
      };
    }
  }
  document.querySelectorAll('#ivMediaList .iv2-thumb').forEach(function(tile){
    var tileIndex=Number(tile.dataset.index);
    tile.classList.toggle('selected',tileIndex===index);
  });
}
function ivMediaDragStart(e){
  var tile=e.currentTarget;
  window._ivMediaDragIndex=Number(tile.dataset.index);
  tile.classList.add('dragging');
  if(e.dataTransfer){
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain', String(window._ivMediaDragIndex));
  }
}
function ivMediaDragOver(e){
  e.preventDefault();
  if(e.dataTransfer) e.dataTransfer.dropEffect='move';
  e.currentTarget.classList.add('drop-target');
}
function ivMediaDragLeave(e){ e.currentTarget.classList.remove('drop-target'); }
function ivMediaDragEnd(){
  document.querySelectorAll('.iv2-thumb.dragging,.iv2-thumb.drop-target').forEach(function(el){
    el.classList.remove('dragging','drop-target');
  });
  window._ivMediaDragIndex=null;
}
function ivMediaDrop(e){
  e.preventDefault();
  var from=Number(e.dataTransfer&&e.dataTransfer.getData('text/plain'));
  if(!Number.isFinite(from)) from=Number(window._ivMediaDragIndex);
  var to=Number(e.currentTarget.dataset.index);
  var items=(window._ivMediaItems||[]).slice();
  if(!Number.isFinite(from)||!Number.isFinite(to)||from===to||!items[from]||!items[to]){ivMediaDragEnd();return;}
  var moved=items.splice(from,1)[0];
  items.splice(to,0,moved);
  ivRenderMediaItems(items,false);
  ivMediaDragEnd();
  toast('已调整素材顺序');
}
function ivDemoMedia(){
  var mk=function(name,fill,accent){return {type:'photo',name:name,url:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ivMockMediaSvg(fill,accent))};};
  ivRenderMediaItems([
    mk('门口老槐树.jpg','#B88A58','#6B4423'),
    mk('全家福.jpg','#8A6F5C','#D9663F'),
    {type:'video',name:'树下乘凉.mov'},
    mk('旧院子.jpg','#4C7A5C','#F4A877'),
    {type:'video',name:'槐花饭.mp4'}
  ],false);
}
function ivClearMedia(){
  var pane=document.getElementById('ivListenPane');
  var pp=document.getElementById('ivPhotoPreview');
  var img=document.getElementById('ivPhotoPreviewImg');
  var list=document.getElementById('ivMediaList');
  window._ivMediaItems=[];
  if(pane) pane.classList.remove('has-media');
  if(pp) pp.classList.remove('video','portrait','landscape');
  if(img){ img.removeAttribute('src'); img.alt=''; }
  if(list){ list.innerHTML=''; list.classList.remove('show'); }
}
function ivOpenMediaPicker(){
  var pick=document.getElementById('ivMediaPick');
  if(pick) pick.click();
}
function ivMediaPicked(input){
  var files=input&&input.files;
  if(!files||!files.length) return;
  var current=window._ivMediaItems||[];
  var picked=Array.prototype.map.call(files,function(file){
    var isVideo=file.type&&file.type.indexOf('video/')===0;
    return {type:isVideo?'video':'photo',name:file.name||'素材',url:isVideo?'':URL.createObjectURL(file)};
  });
  ivRenderMediaItems(current.concat(picked),true);
  input.value='';
}
function ivFreeTalk(){
  ivFree=true;
  ivShowPane('Ask'); ivMood('不挑了，您随便说'); ivAskHero();
  var fe=document.getElementById('ivFamEcho'); if(fe) fe.style.display='none';
  var badge=document.getElementById('ivFreeBadge'); if(badge) badge.style.display='inline-flex';
  ivSet('ivQ','换了好几个了？<b>那咱不挑了</b> —— 您想到啥就说啥，一件小事、一个人都行，我在后头帮您理清楚、归到该放的地方。');
  toast('挑不出来没关系，随便聊就好');
}
function ivShowSummary(isFree){ var c=document.getElementById('sumCate'); if(c) c.style.display=isFree?'block':'none'; go('summary'); }
/* 「我的书」= 成书预览 + 同屏翻页阅读（原 flipbook 并入，0 跳屏） */
function openBook(read){ go('book'); if(read) bookOpenRead(); }
function bookOpenRead(){ var r=document.getElementById('bookRead'); if(r) r.style.display='flex'; hidePayFloat('payPeak'); fbSkeleton(); fbReset(); }
function bookShowPreview(){ var r=document.getElementById('bookRead'); if(r) r.style.display='none'; hidePayFloat('payPeak'); }
var ppPage=0;
var ppPages=[
  {label:'封面',html:'<div class="pp-page cover"><div class="name">我的<br>时光印记</div><div class="sub">生命故事书</div><div class="by">兰秀英 口述 · 云忆整理</div></div>'},
  {label:'目录',html:'<div class="pp-page"><div class="ey">CONTENTS</div><div class="h">目录</div><div class="pp-toc"><div><b>01</b><span>生命的起点</span><em>1</em></div><div><b>02</b><span>童年时的记忆</span><em>18</em></div><div><b>03</b><span>求学的岁月</span><em>36</em></div></div><div class="pp-no">2</div></div><div class="pp-page"><div class="ey">序</div><div class="h">写给家里人</div><p>这本书不是用来证明什么，只是把那些怕忘掉的小事，一段一段留下来。</p><div class="pp-no">3</div></div>'},
  {label:'第一章',html:'<div class="pp-page"><div class="ey">第一章 · 生命的起点</div><div class="h">门口的老槐树</div><p>我家在村头一间土坯房，门口有一棵很老很老的槐树。夏天傍晚，全村人都搬着小板凳到树下乘凉。</p><div class="pp-no">12</div></div><div class="pp-page"><div class="pp-photo">老照片位</div><p>“夏天全村人都爱在树下乘凉，那是我一辈子最凉快的地方。”</p><div class="pp-no">13</div></div>'},
  {label:'照片页',html:'<div class="pp-page"><div class="ey">照片说明</div><div class="h">家门口那棵树</div><div class="pp-photo" style="height:112px">横版照片</div><p>照片会自动配说明，和故事段落一起进入纸质书。</p><div class="pp-no">14</div></div><div class="pp-page"><div class="ey">第二章</div><div class="h">童年时的记忆</div><p>那时日子慢，很多事都像在昨天。过年穿的新棉袄，第一天上学的路，都能在书里慢慢展开。</p><div class="pp-no">15</div></div>'},
  {label:'封底',html:'<div class="pp-page cover"><div class="name" style="font-size:24px">愿这本书<br>被爱的人<br>一读再读</div><div class="by">云忆 · 生命故事</div></div>'}
];
function renderPrintPreview(){
  var sheet=document.getElementById('ppSheet'), num=document.getElementById('ppNum');
  if(!sheet)return;
  var p=ppPages[ppPage]||ppPages[0];
  sheet.innerHTML=p.html;
  if(num) num.textContent=p.label;
}
function openPrintPreview(){ ppPage=0; var p=document.getElementById('printPreview'); if(p)p.classList.add('show'); renderPrintPreview(); }
function closePrintPreview(){ var p=document.getElementById('printPreview'); if(p)p.classList.remove('show'); }
function printPreviewNext(){ ppPage=Math.min(ppPage+1,ppPages.length-1); renderPrintPreview(); }
function printPreviewPrev(){ ppPage=Math.max(ppPage-1,0); renderPrintPreview(); }
/* P0-6 翻页骨架屏：书打开前短暂显示 */
function fbSkeleton(){ var s=document.getElementById('fbSkel'); if(!s)return; s.style.display='flex'; clearTimeout(window._fbSk); window._fbSk=setTimeout(function(){s.style.display='none';},700); }
/* 断点恢复条：仅当真有草稿(hasDraft=true)时才显示，默认关闭，避免误显 */
var hasDraft=false;
/* ---- flipbook ---- */
var fbLeaves=[], fbPage=0;
var fbLabels=['封面','序言','第一章','正文','第二章','封底'];
function fbReset(){
  fbLeaves=Array.prototype.slice.call(document.querySelectorAll('#bookRead .leaf')).reverse();
  fbPage=0; fbRender();
  var bk=document.getElementById('book3d'), h=document.getElementById('fbHint');
  if(h){h.textContent='轻点翻开';h.classList.remove('hide');}
  if(bk){bk.classList.remove('in'); void bk.offsetWidth; setTimeout(function(){bk.classList.add('in');},40);} /* 书本淡入放大 */
  clearTimeout(window._fbOpen); /* 不再自动翻页：等用户轻点封面才翻 */
}
function fbRender(){
  var N=fbLeaves.length;
  fbLeaves.forEach(function(lf,i){ if(i<fbPage){lf.classList.add('flipped');lf.style.zIndex=i;} else {lf.classList.remove('flipped');lf.style.zIndex=N-i;} });
  var num=document.getElementById('fbNum'); if(num) num.textContent=fbLabels[fbPage]||(fbPage+' / '+N);
  var p=document.getElementById('fbPrev'),n=document.getElementById('fbNext');
  if(p)p.disabled=fbPage<=0; if(n)n.disabled=fbPage>=N;
}
function fbHideHint(){var h=document.getElementById('fbHint');if(h)h.classList.add('hide');}
/* 升级弹窗：由"下载电子书"和"想写更多"上下文触发 */
function showUpgrade(ctx){
  var h=document.getElementById('upH'),b=document.getElementById('upB');
  if(ctx==='download'){ h.textContent='下载电子书 / 制作实物书'; b.innerHTML='小程序内看全本免费；把书<b>留下来</b>才付费——下载电子书 <b>¥99.9</b>，实物精装更完整。'; }
  else if(ctx==='more'){ h.textContent='讲得真好，想写更多？'; b.innerHTML='升级<b>更高题量版本</b>，解锁求学 / 事业 / 家庭 等更多章节，书更完整。'; }
  else { h.textContent='升级更完整的传记'; b.innerHTML='题量 = 书的厚度，随时可升级。'; }
  document.getElementById('upModal').classList.add('open');
}
function closeUpgrade(){document.getElementById('upModal').classList.remove('open');}
function fbNext(){ if(fbPage<fbLeaves.length){fbPage++;fbRender();fbHideHint();
    if(fbPage>=fbLeaves.length){ clearTimeout(window._peak); window._peak=setTimeout(function(){ showPayFloat('payPeak'); },1050); } /* P0-4 读到结尾页（峰终）浮出付费卡 */
  } }
function fbPrev(){ if(fbPage>0){ hidePayFloat('payPeak'); fbPage--;fbRender();fbHideHint();} }
function toast(msg){
  var t=document.getElementById('toastc'); t.textContent=msg; t.classList.add('show');
  clearTimeout(window._tt); window._tt=setTimeout(function(){t.classList.remove('show');},1600);
}
function openDrawer(){document.getElementById('dw').classList.add('open');document.getElementById('dwScrim').classList.add('open');}
function closeDrawer(){var d=document.getElementById('dw');if(d)d.classList.remove('open');var s=document.getElementById('dwScrim');if(s)s.classList.remove('open');}
function openToc(){var d=document.getElementById('tocDrawer'),s=document.getElementById('tocScrim');if(d)d.classList.add('open');if(s)s.classList.add('open');}
function closeToc(){var d=document.getElementById('tocDrawer'),s=document.getElementById('tocScrim');if(d)d.classList.remove('open');if(s)s.classList.remove('open');}
/* ============ 采访页·访谈式对话流（脚本模拟，移植自 elder-v1）
   同一话题多轮追问：AI 从老人上一句抓“钩子”继续问；
   覆盖 讲得起劲深挖 / 答得短换小切口 / 自然换话题 / 情绪波动安慰 四条分支。============ */
var ivTurns=[
  { /* 0 开场第一问 */
    q:'秀英，您的名字，是谁给取的呀？',
    recap:'我听您说：您这名字是<b>爷爷</b>给取的，盼着日子风调雨顺。',
    said:'我这名字啊，是我爷爷给取的。听我娘说，我出生那年雨水特别多，村口那条小河涨了好几回，地里的麦子差点都泡坏了。爷爷说，孩子生在这样的年景里，就盼着以后日子能顺一点，所以给我取了秀英。其实小时候我也不懂这个名字是什么意思，只知道大人一喊“秀英”，我就得赶紧答应。那时候家里住在村头，院子不大，门口有一棵老槐树，夏天特别凉快。爷爷常坐在树底下给人写信，也给村里的孩子讲字。我最喜欢蹲在旁边看他磨墨，墨香混着槐花香，到现在我都记得。后来上学了，老师第一次点名，念到我的名字，我还挺不好意思，因为班里好几个孩子都说这个名字好听。爷爷听了以后笑得很高兴，说名字不光是让人叫的，也是家里人给孩子的一点盼头。',
    origin:'正在回放：“我这名字是我爷爷取的，说是盼着风调雨顺……”' },
  { /* 1 讲得起劲 → 抓“爷爷”深挖 */
    q:'哦，是爷爷取的。那时候您爷爷，是做什么的呀？',
    recap:'我听您说：爷爷是<b>教书先生</b>，方圆几里的孩子都跟他念过书。',
    origin:'正在回放：“我爷爷是个教书先生，方圆几里的娃都跟他念过书……”' },
  { /* 2 答得短 */
    q:'教书先生呀。那他平时对您，是不是特别严？',
    recap:'嗯，我记下啦。',
    origin:'正在回放：“还行吧……记不太清了。”' },
  { /* 3 答得短 → 换小切口，又讲起劲（走过渡桥接进入） */
    q:'那我换个问法 —— 您还记得，过年那天，穿的是什么衣裳吗？',
    recap:'我听您说：过年穿一件<b>枣红新棉袄</b>，是娘熬夜缝的，兜里还揣着俩铜板。',
    origin:'正在回放：“记得记得！一件枣红的新棉袄，我娘熬了好几夜缝的……”',
    enterVia:'transition',
    transLead:'刚才那段不好想，没关系，咱换个轻省的。',
    transQ:'那我换个问法 —— 您还记得，过年那天，穿的是什么衣裳吗？' },
  { /* 4 话题聊透 → 自然过渡到新话题：上学 */
    q:'那您还记得，头一天上学，是什么样吗？',
    recap:'我听您说：第一天上学，<b>爹送您到村口</b>，回头冲您摆手。',
    origin:'正在回放：“背个布书包，我爹送我到村口，回头冲我摆手……”',
    enterVia:'transition',
    transLead:'过年那些事，我都替您记下啦。',
    transQ:'那咱接着往前走 —— 您还记得，头一天上学是什么样吗？' },
  { /* 5 继续深挖 —— 本轮结束后进入采访完成确认 / 追问页 */
    q:'刚才这段我先帮您整理一下，有几个地方还想问清楚。',
    needConfirm:true,
    recap:'这段我先整理好了，主要是<b>家门口的老槐树</b>和树下乘凉的回忆。',
    origin:'正在回放：“门口有棵老槐树，夏天傍晚大家都在树下乘凉，我妈还会做槐花饭……”' },
  { /* 6 情绪波动 */
    q:'那会儿家里热闹吗，还有谁跟您一块儿过年？',
    recap:'这段……我轻轻替您记下了。',
    origin:'正在回放：“还有我哥……他走得早，那年才十九……”（沉默）' },
  { /* 7 安慰后换开心话题 */
    q:'那说件高兴的 —— 这辈子，您最得意的一件事是啥？',
    recap:'我听您说：最得意的是<b>闺女考上了大学</b>，是村里头一个。',
    origin:'正在回放：“最得意啊，是我闺女考上了大学，村里头一个！”',
    enterVia:'comfort' }
];
var ivTurn=0;
var IV_CHAPTER_QUESTIONS=[
  {title:'出生与家族',desc:'名字、老家、亲人和家里的来处',questions:[
    {q:'秀英，您的名字，是谁给取的呀？',hint:'从名字、家里人和出生那会儿讲起',turn:0},
    {q:'小时候住的老房子，是什么样？',hint:'聊家、院子、门口的树和邻里',turn:4},
    {q:'家里最疼您的人是谁？',hint:'讲一个亲人，讲一件记到现在的小事',turn:1}
  ]},
  {title:'童年时光',desc:'小时候的玩伴、年节和难忘小事',questions:[
    {q:'那您还记得，头一天上学，是什么样吗？',hint:'从上学路、老师和同学开始讲',turn:4}
  ]},
  {title:'求学的日子',desc:'老师、同学、课本和那时候的志气',questions:[
    {q:'学生时代，哪位老师让您一直记到现在？',hint:'讲老师的一句话，或一件被鼓励的小事'}
  ]},
  {title:'工作与闯荡',desc:'年轻时怎么走出去，怎么把日子撑起来',questions:[
    {q:'第一次真正挣钱的时候，您记得是什么感觉吗？',hint:'从工作、工资和当时的心气讲起'},
    {q:'那几年最辛苦的一天，是怎么熬过来的？',hint:'讲困难，也讲您怎么扛过去'}
  ]},
  {title:'成家与亲人',desc:'伴侣、孩子和一家人的重要时刻',questions:[
    {q:'您和老伴第一次见面，是在什么地方？',hint:'从见面、印象和后来慢慢熟悉讲起'}
  ]},
  {title:'想留给家人的话',desc:'不按问题也可以，讲给家里人听',questions:[]}
];
var ivQuestionMode='chapters';
var ivQuestionChapter=0;
var ivSelectedChapterTitle='出生与家族';
var ivSelectedQuestion=null;
function ivSet(id,html){var e=document.getElementById(id);if(e)e.innerHTML=html;}
function ivMood(s){var e=document.getElementById('ivMood');if(e)e.textContent=s;}
function ivShowPane(name){
  ['Ask','Listen','Processing','Flash','Recorded','Trans','Comfort'].forEach(function(p){
    var el=document.getElementById('iv'+p+'Pane'); if(el) el.style.display=(p===name?'flex':'none');
  });
  /* v16：只有【讲述】开场（第一问 ask）走女子图全屏沉浸；其余功能态保持干净 */
  var sess=document.getElementById('session'); if(sess){ sess.classList.toggle('sess-imm', name==='Ask'); sess.classList.toggle('sess-listen', name==='Listen'); sess.classList.toggle('sess-confirm', name==='Recorded'); }   /* Ask=满铺沉浸；Listen=日记纸感录音态；Recorded=完成确认紧凑顶栏 */
  if(name!=='Listen') ivLiveStop();   /* 离开“说话中”停掉实时转写 */
}
/* ===== 语音录入·实时转写（原型脚本模拟；真机替换为 ASR 流式回调即可） ===== */
function ivSaidText(){if(ivSelectedQuestion&&ivSelectedQuestion.said) return ivSelectedQuestion.said; if(ivFree) return ivFreeText; var t=ivTurns[ivTurn]||{};var s=t.said||t.origin||'';
  return s.replace(/^正在回放[:：]/,'').replace(/[“”"]/g,'').replace(/（沉默）/g,' ').trim();}
var ivLiveFull='', ivLiveIdx=0, ivRecPaused=false;
function ivLiveStop(){clearInterval(window._ivLive);}
function ivLiveRun(){   /* 从当前进度继续逐字流式（支持暂停后续跑） */
  var box=document.getElementById('ivLive'), txt=document.getElementById('ivLiveTxt');
  ivLiveStop();
  window._ivLive=setInterval(function(){
    if(ivLiveIdx>=ivLiveFull.length){ivLiveStop();return;}
    ivLiveIdx+=1; if(txt) txt.textContent=ivLiveFull.slice(0,ivLiveIdx);
    window._ivHasUnsavedRec=true;
    if(box) box.scrollTop=box.scrollHeight;
  },18);
}
function ivLiveStart(){   /* 进入说话中：重置并开录 */
  var txt=document.getElementById('ivLiveTxt'); if(!txt)return;
  var pane=document.getElementById('ivListenPane'); if(pane) pane.classList.remove('text-mode');
  txt.removeAttribute('contenteditable');
  ivLiveFull=ivSaidText(); ivLiveIdx=0; txt.textContent=''; ivRecPaused=false;
  window._ivHasUnsavedRec=false;
  ivLiveRun(); ivRecUI();
}
function ivWrite(){
  ivSkipCount=0; ivRender(); ivShowPane('Listen'); ivMood('可以直接写这一段');
  var pane=document.getElementById('ivListenPane'), txt=document.getElementById('ivLiveTxt');
  if(pane) pane.classList.add('text-mode');
  ivLiveStop(); ivLiveFull=''; ivLiveIdx=0; ivRecPaused=true; window._ivHasUnsavedRec=false;
  if(txt){
    txt.textContent='';
    txt.setAttribute('contenteditable','true');
    setTimeout(function(){ txt.focus(); },80);
  }
  var lab=document.getElementById('ivRecLabel'); if(lab) lab.textContent='录音已暂停 · 正在键盘输入';
  ivRecUI();
}
/* 中间主按钮：录音 开始/暂停 toggle（暂停 ⇄ 继续说） */
function ivToggleRec(){
  var pane=document.getElementById('ivListenPane'), txt=document.getElementById('ivLiveTxt');
  if(pane&&pane.classList.contains('text-mode')&&ivRecPaused){
    var prefix=txt?txt.textContent.trim():'';
    pane.classList.remove('text-mode');
    if(txt) txt.removeAttribute('contenteditable');
    ivLiveFull=(prefix?(prefix+' '):'')+ivSaidText();
    ivLiveIdx=prefix.length;
    ivRecPaused=false; ivLiveRun(); ivMood('正在听您说'); ivRecUI(); return;
  }
  ivRecPaused=!ivRecPaused;
  if(ivRecPaused){ ivLiveStop(); ivMood('已暂停 · 点“继续说”接着录'); }
  else { ivLiveRun(); ivMood('正在听您说'); }
  ivRecUI();
}
function ivRecUI(){
  var pane=document.getElementById('ivListenPane'); if(pane) pane.classList.toggle('rec-paused', ivRecPaused);
  var lab=document.getElementById('ivRecLabel'); if(lab) lab.textContent=(pane&&pane.classList.contains('text-mode'))?'录音已暂停 · 正在键盘输入':(ivRecPaused?'已暂停':'正在聆听…');
  var btn=document.getElementById('ivRecToggle'); if(!btn) return;
  var ic=btn.querySelector('.ic'), lb=btn.querySelector('.lb');
  if(ic) ic.innerHTML = ivRecPaused
    ? '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7V5Z"/></svg>'
    : '<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>';
  if(lb) lb.textContent = ivRecPaused ? '继续说' : '暂停';
}
function ivRender(){
  var t=ivTurns[ivTurn]||ivTurns[0], q=(ivSelectedQuestion&&ivSelectedQuestion.q)||t.q;
  ivSet('ivQ',q);ivSet('ivQmini',q);ivSet('ivRecap',t.recap);
  var ch=document.getElementById('ivChapterTitle'); if(ch)ch.textContent=ivSelectedChapterTitle||'出生与家族';
}
/* 进入采访页：展示“开场/当前一问” */
function ivEnter(){ivFree=false;var b=document.getElementById('ivFreeBadge');if(b)b.style.display='none';ivRender();ivShowPane('Ask');ivMood('在陪您聊天');ivAskHero();}
/* v9: 实拍人物氛围图只在【讲述】开场初始态(第一问)出现，后续问答保持干净 */
function ivAskHero(){var ap=document.getElementById('ivAskPane');if(ap)ap.classList.toggle('ask-hero',true);   /* 所有提问都用满铺 hero 布局 */
  var fe=document.getElementById('ivFamEcho'); if(fe) fe.style.display=(ivTurn===0?'inline-flex':'none');} /* P0-2 家人回音仅开场第一问出现（顶部 pill） */
/* 说话中：长停顿不打断，靠“我说完了”判停 + 自动保存反馈 */
function ivListen(){
  ivSkipCount=0;ivRender();ivShowPane('Listen');
  var pane=document.getElementById('ivListenPane');
  if(pane){
    pane.classList.toggle('free-mode',!!ivFree);
    pane.classList.remove('photo-mode');
    if(!ivFree) pane.classList.remove('text-mode');
  }
  ivMood(ivFree?'随便说，我记着':'正在听您说');
  if(ivFree)ivSet('ivQmini','随便讲讲 · 想到啥说啥');
  ivLiveStart();
  ivClearMedia();
}
function ivPhotoListen(label){
  ivFree=true;
  ivSelectedQuestion=null;
  ivSkipCount=0;ivRender();ivShowPane('Listen');
  var pane=document.getElementById('ivListenPane'); if(pane){ pane.classList.add('free-mode','photo-mode'); pane.classList.remove('text-mode'); }
  var pp=document.getElementById('ivPhotoPreview'); if(pp){ var s=pp.querySelector('span'); if(s)s.textContent='已添加'+(label||'照片')+' · 看着这张慢慢讲'; }
  ivMood('看着照片慢慢说');
  ivLiveStart();
}
/* 点“我说完了”：先过处理态“小云正在记下…”(≈1s)，再进入追问确认页；小结由底部主按钮生成 */
var ivFirstDone=false;
function ivDone(){
  window._ivHasUnsavedRec=false;
  var t=ivTurns[ivTurn];
  ivProcessing(function(){
    if(ivFree){ ivFree=false; ivRecorded(); ivFollowupState(0); return; }   /* 随便讲讲也先到追问页；无追问时直接给小结入口 */
    ivFirstDone=true;
    ivRecorded();
  });
}
/* P0-6 处理态：小云正在记下…（≈1s） */
function ivProcessing(cb){
  ivShowPane('Processing'); ivMood('正在记下…');
  clearTimeout(window._ivProc);
  window._ivProc=setTimeout(function(){ if(typeof cb==='function') cb(); }, 1000);
}
/* 默认路径：一闪“记下啦 ✓”，倒计时 5 秒后小云直接问下一句；点任意处暂停、点“看看这段小结”取消 */
function ivClearFlash(){ clearTimeout(window._ivf); clearInterval(window._ivfCd); clearTimeout(window._ivProc); window._ivf=null; window._ivfCd=null; window._ivProc=null; }
function ivFlash(){
  ivShowPane('Flash'); ivMood('记下您刚说的话');
  ivClearFlash();
  /* 记下啦 · 成书故事卡 + 8 秒细进度倒计时；到点自动「接着聊」进下一问；点「看看这段小结」进小结、点屏幕暂停 */
  var total=8, n=total;
  var resume=document.getElementById('ivFlashResume'); if(resume) resume.style.display='';
  var lbl=document.getElementById('ivFlashLbl'); if(lbl) lbl.innerHTML='<b id="ivFlashCd">'+n+'</b> 秒后，小云接着问您下一个';
  var hint=document.getElementById('ivFlashHint'); if(hint) hint.textContent='点一下屏幕，先歇会儿 · 不着急';
  var bar=document.getElementById('ivFlashBar'); if(bar){ bar.style.transition='none'; bar.style.width='100%'; void bar.getBoundingClientRect(); bar.style.transition='width 1s linear'; }
  window._ivfCd=setInterval(function(){
    n--;
    var num=document.getElementById('ivFlashCd'); if(num) num.textContent=Math.max(n,0);
    var bar=document.getElementById('ivFlashBar'); if(bar) bar.style.width=(Math.max(n,0)/total*100)+'%';
    if(n<=0){ ivClearFlash(); ivConfirm(); }
  },1000);
}
/* P0-7 点任意处暂停倒计时：停住计时，给“接着聊”按钮，把控制权还给长辈 */
function ivPauseFlash(){
  ivClearFlash();
  var lbl=document.getElementById('ivFlashLbl'); if(lbl) lbl.innerHTML='已停住 · 您歇会儿，想好了再接着聊';
  var hint=document.getElementById('ivFlashHint'); if(hint) hint.textContent='歇够了，点下面「接着聊」就行';
  var resume=document.getElementById('ivFlashResume'); if(resume) resume.style.display='';
}
/* 一闪页“看看这段小结”：立刻停倒计时（防被跳走）→ 进「回忆小结」屏 */
function ivViewSummary(){ ivClearFlash(); ivShowSummary(false); }
function ivDirectSummary(){
  ivClearFlash();
  window._ivHasUnsavedRec=false;
  toast('正在打开回忆预览');
  ivShowSummary(false);
}
function ivContinueInput(){
  toast('回到采访首页，继续录入');
  ivEnter();
}
function ivFollowDone(btn,label){
  var item=btn&&btn.closest?btn.closest('.iv-askitem'):null;
  if(!item)return;
  item.classList.add('done');
  var s=item.querySelector('.state'); if(s)s.textContent=label||'已处理';
  toast(label||'已处理');
  setTimeout(function(){ ivFollowNext(item); },260);
}
function ivFollowVoice(btn){
  ivFollowDone(btn,'待语音补充');
  toast('请直接说补充内容');
  ivListen();
}
function ivFollowupState(count){
  var box=document.getElementById('ivFollowups'), cnt=document.getElementById('ivFollowCount'), title=document.getElementById('ivFollowTitle'), help=document.getElementById('ivFollowHelp');
  if(!box)return;
  var n=Number(count||0);
  box.classList.toggle('no-questions', n<=0);
  box.classList.toggle('has-questions', n>0);
  if(cnt)cnt.textContent=n>0?(n+' 个待确认'):'无追问';
  if(title)title.textContent=n>0?'这段已记下':'无需补问';
  if(help)help.textContent=n>0?'小云整理时发现两个细节，点一下就能确认；不想答也可以先跳过。':'这段内容已经够完整，不需要额外确认。';
  ivFollowSummaryState(n<=0);
  setTimeout(ivFollowSyncPage,0);
}
function ivFollowNext(item){
  var q=document.getElementById('ivAskQueue'); if(!q)return;
  var cards=Array.prototype.slice.call(q.querySelectorAll('.iv-askitem'));
  var idx=cards.indexOf(item), next=cards[idx+1];
  if(next){ q.scrollTo({left:next.offsetLeft-q.offsetLeft-4,behavior:'smooth'}); }
  else{
    ivFollowSummaryState(true);
    toast('追问处理完了，可以查看回忆预览');
  }
  ivFollowSyncPage();
}
function ivFollowSummaryState(ready){
  var btn=document.getElementById('ivSummaryBtn'); if(!btn)return;
  btn.classList.toggle('ready',!!ready);
  btn.textContent=ready?'查看回忆预览':'先看回忆预览';
}
function ivFollowSyncPage(){
  var q=document.getElementById('ivAskQueue'), dots=document.querySelectorAll('#ivQPages i');
  if(!q||!dots.length)return;
  var idx=Math.round(q.scrollLeft/Math.max(1,q.clientWidth));
  dots.forEach(function(d,i){d.classList.toggle('on',i===idx);});
}
/* 采访完成确认：说完后整理摘要、补问关键细节、确认不清楚的点 */
function ivRecorded(){ivRender();ivShowPane('Recorded');ivMood('记下您刚说的话');ivFollowupState(2);}
function ivTransition(){var t=ivTurns[ivTurn];ivSet('ivTransLead',t.transLead||'这段我都记下啦。');ivSet('ivTransQ',t.transQ||t.q);ivShowPane('Trans');ivMood('在陪您聊天');}
function ivComfortShow(){ivShowPane('Comfort');ivMood('陪着您');}
/* 推进下一轮（默认路径 flash 自动调用 / 例外路径“对，接着聊”按钮调用）；需先走过渡/安慰桥接的先展示桥接 */
function ivConfirm(){
  var next=ivTurn+1;
  if(next>=ivTurns.length){ ivMood('今天辛苦啦'); toast('今天讲了好多啦，改天接着聊'); ivEnter(); return; }
  var nt=ivTurns[next];
  ivSelectedQuestion=null;
  if(nt.enterVia==='transition'){ ivTurn=next; ivTransition(); return; }
  if(nt.enterVia==='comfort'){ ivTurn=next; ivComfortShow(); return; }
  ivTurn=next; ivEnter();
}
function ivComfortContinue(){ ivRender(); ivShowPane('Ask'); ivMood('在陪您聊天'); ivAskHero(); }
function ivTTS(msg){ toast(msg || ('正在念：'+(document.getElementById('ivQ')||{}).textContent)); }
function ivReplayOrigin(){ toast(ivTurns[ivTurn].origin || '正在回放您刚才的原声…'); }
/* 演示：直接跳到某个状态（截图 / 客户演示用） */
function ivDemo(state){
  go('session');
  if(state==='ask'){ ivTurn=0; ivEnter(); }
  else if(state==='listen'){ ivTurn=0; ivListen(); }
  else if(state==='processing'){ ivTurn=1; ivClearFlash(); ivShowPane('Processing'); ivMood('正在记下…'); }  /* P0-6 处理态（静态演示） */
  else if(state==='flash'){ ivTurn=1; ivFlash(); }              /* 记下啦→倒计时5秒→下一问 */
  else if(state==='flashpaused'){ ivTurn=1; ivFlash(); ivPauseFlash(); }  /* P0-7 暂停态 */
  else if(state==='recorded'){ ivTurn=1; ivRecorded(); }        /* 讲得起劲深挖那轮的记下啦 */
  else if(state==='confirm'){ ivTurn=5; ivRecorded(); }         /* 采访完成确认 / 追问页 */
  else if(state==='transition'){ ivTurn=3; ivTransition(); }     /* 答得短→换小切口的过渡 */
  else if(state==='comfort'){ ivTurn=7; ivComfortShow(); }       /* 情绪波动→安慰软出口 */
  else if(state==='firstsummary'){ ivTurn=0; ivFirstDone=false; ivDone(); }  /* P0-1 首次讲完→(处理态1s后)强制进小结 */
}
document.addEventListener('click',function(e){
  if(!e.target.closest('#memoir-runtime'))return;
  var g=e.target.closest('[data-go]'); if(g){go(g.dataset.go); return;}
  var t=e.target.closest('[data-toast]'); if(t){toast(t.dataset.toast);}
});
/* 深链：#book / #flipbook / #flipbook/2（翻页阅读已并入「我的书」，flipbook 深链兼容） */
function applyHash(){var h=(location.hash||'').slice(1);if(!h)return;var p=h.split('/');
  if(p[0]==='flipbook'){ openBook(true); if(p[1]){fbPage=Math.min(+p[1]||0,fbLeaves.length);fbRender();} return; }
  go(p[0]);
  if(p[0]==='book'&&p[1]==='read'){ bookOpenRead(); if(p[2]){fbPage=Math.min(+p[2]||0,fbLeaves.length);fbRender();} }}
window.addEventListener('load',function(){
  syncAvatarViews();
  applyHash();
  var active=document.querySelector('.screen.on');
  renderPrd(active?active.id:'session');
  /* 刷新/首次加载时若讲述页是默认激活屏，主动初始化 → 补上 sess-imm 满铺沉浸效果 */
  var s=document.getElementById('session'); if(s&&s.classList.contains('on')) ivEnter();
});
window.addEventListener('hashchange',applyHash);
