const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:1180,height:820}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');
for(const count of [2,6]){
 await page.evaluate(async count=>{const e=await import('/src/engine.js');let m=e.createMatch(e.DEFAULT_PLAYERS.slice(0,count),'cricket');for(const n of [17,17])m=e.recordDart(m,n,3);localStorage.removeItem('dart-party-matches-v1');(await import('/src/storage.js')).saveMatch(m);},count);
 await page.reload();await page.locator('#resume').click();
 const saved=await page.evaluate(()=>localStorage.getItem('dart-party-matches-v1'));
 for(const [width,height] of [[1180,820],[1024,768],[820,1180],[390,844]]){
 await page.setViewportSize({width,height});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.equal(await page.locator('.cricket-controls .player-card').count(),count);
 const table=await page.locator('.current-panel').boundingBox(),score=await page.locator('.scoreboard').boundingBox(),keys=await page.locator('.keypad-panel').boundingBox();
 if(width>height || width<=740)assert(score.y+score.height<=keys.y+1);else assert(score.x+score.width<=keys.x+1);
 if(width>height && width>740)assert(score.x>=table.x+table.width);
 if(width>740){assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));assert(await page.locator('.cricket-board').evaluate(el=>el.scrollWidth<=el.clientWidth+1));}
 const nameSize=await page.locator('.cricket-board th').nth(1).evaluate(el=>parseFloat(getComputedStyle(el).fontSize));assert(nameSize>=(count===6?11:17));
 await page.screenshot({path:`/private/tmp/cricket-layout-${count}-${width}.png`,fullPage:true});
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('dart-party-matches-v1')),saved);
 await page.locator('[data-special="0"]').click();await page.locator('#undo').click();assert.equal(await page.locator('.player-score').first().innerText(),'51');
 await page.locator('#new-game').click();assert.equal(await page.locator('#app.cricket-game').count(),0);
}
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: scores right above keypad; large table headers; 2/6 players at 1180,1024,820,390; state preserved; scoring/undo');})().catch(e=>{console.error(e);process.exit(1)});
