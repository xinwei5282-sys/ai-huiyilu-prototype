/* Chapter titles/order follow the existing memoir ten-chapter classification:
 * ai-huiyilu-backend-audio-compat/sql/11_memoir_unified_chapter_classification.sql
 * Time stages are a separate filter dimension; neither is inferred from file order.
 */
(function(root,factory){const value=factory();if(typeof module==='object'&&module.exports)module.exports=value;else root.YunyiMemoirCatalog=value;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const chapters=[
    {id:1,name:'生命的起点',subtitle:'出生与童年'},
    {id:2,name:'求学岁月',subtitle:'校园与成长'},
    {id:3,name:'事业与奋斗',subtitle:'工作与选择'},
    {id:4,name:'爱情与婚姻',subtitle:'相遇与相守'},
    {id:5,name:'家庭与亲情',subtitle:'家庭与亲情'},
    {id:6,name:'人生的风浪',subtitle:'迁徙、挑战与改变'},
    {id:7,name:'友谊与社会关系',subtitle:'友情、社区与社会角色'},
    {id:8,name:'内心世界',subtitle:'价值观、情感与热爱'},
    {id:9,name:'生命的黄昏与传承',subtitle:'回望与嘱托'},
    {id:10,name:'感官记忆档案',subtitle:'声音、味道与触觉'}
  ];
  const stages=['出生与家庭','童年与少年','求学与成长','走上社会与学艺','工作与成家','养育儿女','退休以后的生活','跨阶段回望'].map((name,i)=>({id:i+1,name}));
  function normalize(source){return {...source,chapterName:chapters.find(c=>c.id===source.chapterNo)?.name||source.chapterName||'未分章回忆',stageName:stages.find(c=>c.id===source.stageId)?.name||source.stageName||'未分阶段'};}
  return {chapters,stages,normalize};
});
