// Build a file:// compatible reader from the canonical Markdown documents.
const fs=require('node:fs'),path=require('node:path');
const docs=[['daily','每日分享 · PRD','daily-posters.md'],['prompts','每日分享 · 提示词','daily-poster-prompts.md'],['film','微电影 · PRD','microfilm.md']];
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function render(md){let code=false,out=[],table=false;
 for(const line of md.split('\n')){
  if(line.startsWith('```')){if(table){out.push('</tbody></table></div>');table=false;}out.push(code?'</code></pre>':'<pre><code>');code=!code;continue;}
  if(code){out.push(esc(line)+'\n');continue;}
  if(line.startsWith('|')){if(/^\|[\s:|-]+\|$/.test(line))continue;if(!table){out.push('<div class="table"><table><tbody>');table=true;}out.push('<tr>'+line.split('|').slice(1,-1).map(c=>'<td>'+esc(c.trim())+'</td>').join('')+'</tr>');continue;}
  if(table){out.push('</tbody></table></div>');table=false;}
  const heading=line.match(/^(#{1,6})\s+(.+)/);if(heading){const n=Math.min(heading[1].length+1,6);out.push('<h'+n+'>'+esc(heading[2])+'</h'+n+'>');continue;}
  if(line.trim())out.push('<p>'+esc(line).replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')+'</p>');
 }
 if(table)out.push('</tbody></table></div>');if(code)out.push('</code></pre>');return out.join('\n');
}
const output=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>新增需求 PRD</title><style>
*{box-sizing:border-box}body{margin:0;background:#fffbf5;color:#352c25;font:16px/1.8 system-ui,sans-serif}nav{position:sticky;top:0;display:flex;gap:8px;flex-wrap:wrap;padding:14px 24px;background:#fffbf5;border-bottom:1px solid #e5ded2;z-index:1}button{font:inherit;font-size:14px;padding:8px 14px;border:1px solid #ded5c8;background:white;border-radius:8px;cursor:pointer}button[aria-pressed=true]{background:#314d3f;color:white;border-color:#314d3f}main{max-width:980px;margin:auto;padding:12px 28px 60px}article[hidden]{display:none}h2{font-size:26px}h3{font-size:21px;margin-top:32px}h4{font-size:18px}p{overflow-wrap:anywhere}pre{background:#f0ece4;border-radius:10px;padding:18px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}code{font-family:ui-monospace,monospace}.table{overflow:auto}table{border-collapse:collapse;min-width:100%;font-size:14px}td{border:1px solid #dfd7ca;padding:10px;min-width:100px;vertical-align:top}tr:first-child{font-weight:700;background:#f0ece4}.meta{font-size:13px;color:#756b60}@media(max-width:600px){main{padding:8px 16px 40px}nav{padding:10px;gap:6px}button{padding:8px;font-size:13px}}
</style><nav aria-label="需求文档">${docs.map(([id,title],i)=>`<button data-doc="${id}" aria-pressed="${!i}">${title}</button>`).join('')}</nav><main>${docs.map(([id,title,file],i)=>`<article id="${id}" ${i?'hidden':''}><p class="meta">当前文档：${file} · 与原型同版交付</p>${render(fs.readFileSync(path.join(__dirname,file),'utf8'))}</article>`).join('')}</main><script>document.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>{document.querySelectorAll('article').forEach(a=>a.hidden=a.id!==b.dataset.doc);document.querySelectorAll('[data-doc]').forEach(x=>x.setAttribute('aria-pressed',x===b));window.scrollTo(0,0)});</script></html>`;
const dest=path.join(__dirname,'requirements.html');
if(process.argv.includes('--check')){if(fs.readFileSync(dest,'utf8')!==output)throw Error('Requirements reader is stale');console.log('PASS requirements reader matches three source documents');}else{fs.writeFileSync(dest,output);console.log('Built requirements reader');}
