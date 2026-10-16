const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage();await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');
for(const count of [2,6]){
 await page.evaluate(async count=>{const e=await import('/src/engine.js');localStorage.removeItem('dart-party-matches-v1');(await import('/src/storage.js')).saveMatch(e.createMatch(e.DEFAULT_PLAYERS.slice(0,count),'301',false,'standard','standard',3));},count);
 await page.reload();await page.locator('#resume').click();
 for(const [width,height] of [[1920,1080],[1440,900],[1180,820],[1024,768],[820,1180]]){
 await page.setViewportSize({width,height});await page.screenshot({path:`/private/tmp/x01-large-${count}-${width}.png`,fullPage:true});
 const metrics=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));assert(metrics.w<=width+1,JSON.stringify({count,width,height,metrics}));assert(metrics.h<=height+1,JSON.stringify({count,width,height,metrics}));
 const panel=await page.locator('.play-grid').boundingBox();assert(panel.width>width*.94);assert(panel.y+panel.height>=height-20);
 const next=await page.locator('#next').boundingBox();assert(next.y+next.height<=height);
 assert(await page.locator('.giant-score').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=100));
 }
 await page.locator('[data-hit="20"]').click();await page.locator('#undo').click();assert.equal(await page.locator('.player-card.active .player-score').innerText(),'301');
}
await browser.close();console.log('PASS: full width/height X01, 2/6 players,1920/1440/1180/1024/820, all controls visible and undo');})().catch(e=>{console.error(e);process.exit(1)});
