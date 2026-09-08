"""Generate the V21-owned memoir runtime from the frozen, user-confirmed V17.

Preserves every screen, overlay, inline handler and business function. Only
isolates styling, storage and document-level routing from the new mobile shell.
"""
from pathlib import Path
import re, hashlib, json
ROOT=Path(__file__).resolve().parents[2]
source=(ROOT/'prototype-v17.html').read_text()
sha=hashlib.sha256((ROOT/'prototype-v17.html').read_bytes()).hexdigest()
assert sha=='45b990dcf86031bfdb8c317f7783f6ba992461e00d7c7e75d116031e7ebfb651'
css=re.search(r'<style>(.*?)</style>',source,re.S).group(1)
css=css.replace(':root{',':scope{')
css=re.sub(r'(?<![.\w-])body(?=[\s:{,.#])',':scope',css)
# CSS URLs move one directory down; markup and script URLs remain root-relative.
css=re.sub(r'url\(([\"\']?)(?!data:|https?:|/|#)([^)]+)\)',lambda m:'url('+m[1]+'../'+m[2]+')',css)
(ROOT/'v21/memoir.css').write_text('/* Generated from canonical V17; do not hand-edit. */\n@scope (#memoir-runtime) {\n'+css+'\n}\n')
body=source[source.index('<div class="phone"><div class="screens">'):source.index('<script>',source.index('<body>'))]
script=re.search(r'<script>(.*?)</script>',source,re.S).group(1)
script=script.replace("document.addEventListener('click',function(e){\n  var g=", "document.addEventListener('click',function(e){\n  if(!e.target.closest('#memoir-runtime'))return;\n  var g=")
script=script.replace("key:'huiyilu.avatar.v1'","key:'yunyi.v21.avatar'").replace("'huiyilu.persona.source.v1'","'yunyi.v21.persona.source'").replace("'huiyilu.persona.generated.v1'","'yunyi.v21.persona.generated'")
(ROOT/'v21/memoir.js').write_text('// Generated from canonical V17. Product adaptations are in memoir-bridge.js.\n'+script)
entry=(ROOT/'prototype-v21.html').read_text()
if '<!-- MEMOIR-RUNTIME:START -->' in entry:
    entry=re.sub(r'<!-- MEMOIR-RUNTIME:START -->.*?<!-- MEMOIR-RUNTIME:END -->','',entry,flags=re.S)
else:
    entry=entry.replace('<link rel="stylesheet" href="v21/style.css">','<link rel="stylesheet" href="v21/style.css"><link rel="stylesheet" href="v21/memoir.css"><link rel="stylesheet" href="v21/memoir-theme.css">')
    entry=entry.replace('<script type="module" src="v21/app.js"></script>','<script src="v21/memoir.js"></script><script src="v21/memoir-bridge.js"></script><script type="module" src="v21/app.js"></script>')
entry=entry.replace('<main id="app"></main>','<main id="app"></main><!-- MEMOIR-RUNTIME:START --><div id="memoir-runtime" hidden>'+body+'</div><!-- MEMOIR-RUNTIME:END -->')
(ROOT/'prototype-v21.html').write_text(entry)
for f in ['prototype-v21.html','v21/memoir.js','v21/memoir.css']:
    p=ROOT/f;p.write_text('\n'.join(x.rstrip() for x in p.read_text().splitlines())+'\n')
print(json.dumps({'source_sha256':sha,'screens':len(re.findall(r'<section class="screen(?: on)?"',body)),'runtime_bytes':len(body.encode())}))
