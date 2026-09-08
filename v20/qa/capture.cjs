const {launchBrowser,closeBrowser}=require('/Users/xinwei/weiran-env/projects/ai-huiyilu-prototype-v19/render-browser.js');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await launchBrowser();try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.setViewport({width:1400,height:1060,deviceScaleFactor:1});
 await p.goto('http://127.0.0.1:8880/prototype-v20.html',{waitUntil:'networkidle2'});
 for(const id of ['session','praise','shelf','mine']){
  await p.evaluate(id=>go(id),id);await sleep(400);
  await (await p.$('.phone')).screenshot({path:`v20/qa/${id}-desktop-phone.png`});
 }
 await p.evaluate(()=>go('praise'));await sleep(300);await p.screenshot({path:'v20/qa/praise-desktop.png'});
 await p.setViewport({width:390,height:844,deviceScaleFactor:1});
 for(const id of ['praise','session','shelf','mine']){await p.evaluate(id=>go(id),id);await sleep(400);await p.screenshot({path:`v20/qa/${id}-mobile.png`});}
 await p.evaluate(()=>go('praise'));await p.click('#kk-example');await p.click('#kk-generate');await p.waitForSelector('#praise-result.on #kk-save');await sleep(400);await p.screenshot({path:'v20/qa/result-mobile.png'});

 await p.evaluate(()=>go('summary'));await sleep(400);await p.$eval('#kk-memoir-consent',e=>e.scrollIntoView({block:'center'}));await sleep(200);await p.screenshot({path:'v20/qa/memoir-consent-mobile.png'});
 await p.setViewport({width:1400,height:1060,deviceScaleFactor:1});
 await p.goto('http://127.0.0.1:8880/prototype-v17.html',{waitUntil:'networkidle2'});await sleep(400);
 await (await p.$('.phone')).screenshot({path:'v20/qa/baseline-final-v17.png'});
 await p.goto('http://127.0.0.1:8880/v20/versions.html',{waitUntil:'networkidle2'});
 if(!await p.$$eval('img',es=>es.every(e=>e.complete && e.naturalWidth>0)))throw Error('Version comparison has missing images');
 await p.screenshot({path:'v20/qa/versions-desktop.png',fullPage:true});
 console.log(JSON.stringify({pageErrors:errors,versionComparisonImages:'loaded'},null,2));
 fs.writeFileSync('v20/qa/capture-report.json',JSON.stringify({pageErrors:errors},null,2));
 if(errors.length)process.exitCode=1;
}finally{await closeBrowser(b);}})().catch(e=>{console.error(e);process.exitCode=1});
