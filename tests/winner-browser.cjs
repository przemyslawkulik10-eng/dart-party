const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1180,height:820}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.audioNotes=0;const original=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...args){window.audioNotes++;return original.apply(this,args);};});
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');
for(const mode of ['201','cricket']){
 await page.evaluate(async mode=>{
 const e=await import('/src/engine.js');const storage=await import('/src/storage.js');let m=e.createMatch(['MACIEK','PRZEMEK'],mode);
 const hit=(n,x=1)=>m=e.recordDart(m,n,x);const next=()=>m=e.nextPlayer(m);const other=()=>{next();hit(0);hit(0);hit(0);next();};
 if(mode==='201'){hit(20,3);hit(20,3);hit(20,3);other();hit(20);}
 else{hit(20,3);hit(19,3);hit(18,3);other();hit(17,3);hit(16,3);hit(15,3);other();hit(25);}
 localStorage.removeItem('dart-party-matches-v1');storage.saveMatch(m);
 },mode);
 await page.reload();await page.locator('#resume').click();
 await page.locator(mode==='201'?'[data-hit="1"]':'[data-special="50"]').click();
 assert.equal(await page.locator('.announcement-name').innerText(),'MACIEK');assert.equal(await page.locator('.announcement-label').innerText(),'WYGRYWA!');
 await page.waitForFunction(()=>window.audioNotes===4);await page.screenshot({path:'/private/tmp/dart-winner.png'});
 await page.locator('.player-announcement').waitFor({state:'detached',timeout:5000});assert.equal(await page.locator('#rematch').count(),1);
 await page.locator('#sound-toggle').click();await page.locator('#undo-win').click();
 await page.locator(mode==='201'?'[data-hit="1"]':'[data-special="50"]').click();assert.equal(await page.evaluate(()=>window.audioNotes),4);
 await page.locator('.player-announcement').waitFor({state:'detached',timeout:5000});await page.locator('#sound-toggle').click();
}
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: X01/Cricket victory overlay, automatic close, fanfare nodes and mute');
})().catch(e=>{console.error(e);process.exit(1)});
