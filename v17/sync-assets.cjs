// Bind the V17 page to exact feature assets, preventing mixed cached API versions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),entry=path.join(root,'prototype-v17.html');
const before=fs.readFileSync(entry,'utf8');let after=before;
const assets=['v17/microfilm.css','v17/microfilm-core.js','v17/microfilm.js','v17/jiang-teacher-data.js','v17/jiang-teacher-case.js','v17/jiang-teacher-generated-story.js','v17/memoir-catalog.js'];
for(const asset of assets){
  const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,asset))).digest('hex').slice(0,16);
  const escaped=asset.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp('((?:href|src)=["\'])'+escaped+'(?:\\?v=[^"\']*)?(["\'])','g');
  let matches=0;
  after=after.replace(pattern,(_all,prefix,suffix)=>{matches++;return prefix+asset+'?v='+version+suffix;});
  if(matches!==1)throw new Error('Expected one asset reference: '+asset+'; found '+matches);
}
if(process.argv.includes('--check')){
  if(after!==before){console.error('V17 asset versions are stale. Run: node v17/sync-assets.cjs');process.exitCode=1;}
  else console.log('V17 HTML matches the exact content versions of all 7 microfilm assets.');
}else{
  if(after!==before)fs.writeFileSync(entry,after);
  console.log('V17 microfilm asset references synchronized by SHA-256 content versions.');
}
