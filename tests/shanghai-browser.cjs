const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage({viewport:{width:1180,height:820}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.spoken=[];speechSynthesis.speak=u=>window.spoken.push({text:u.text,rate:u.rate,pitch:u.pitch});speechSynthesis.cancel=()=>{};});
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');await page.locator('[data-mode="cricket"]').click();await page.locator('[data-scoring="cutthroat"]').click();await page.screenshot({path:'/private/tmp/dart-cricket-choice.png',fullPage:true});
await page.locator('#start').click();await page.locator('.announcement-continue').click();await page.reload();
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dart-party-bull-off')).cricketScoring),'cutthroat');
for(const value of [50,0,0,...Array(15).fill(0)]){if(await page.locator('.announcement-continue').count())await page.locator('.announcement-continue').click();await page.locator(`[data-bull="${value}"]`).click();}
await page.locator('#start-match').click();assert.match(await page.locator('.game-meta').innerText(),/na przeciwników/);
for(const mult of [3,1,2]){await page.locator(`[data-mult="${mult}"]`).click();await page.locator('[data-hit="17"]').click();}
assert.equal(await page.locator('.announcement-label').innerText(),'SZANGHAJ!');assert.match(await page.evaluate(()=>window.spoken.at(-1).text),/Szanghaj!.*255 punktów/);assert((await page.evaluate(()=>window.spoken.at(-1).rate))>1);
assert.deepEqual(await page.locator('.player-score').allTextContents(),['0','51','51','51','51','51']);await page.screenshot({path:'/private/tmp/dart-shanghai.png'});
await page.locator('.player-announcement').waitFor({state:'detached',timeout:5000});await page.locator('#undo').click();assert.deepEqual(await page.locator('.player-score').allTextContents(),['0','17','17','17','17','17']);
await page.reload();await page.locator('#resume').click();assert.match(await page.locator('.game-meta').innerText(),/na przeciwników/);
await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
for(const variant of ['standard','501']){
 await page.evaluate(async variant=>{const e=await import('/src/engine.js');localStorage.removeItem('dart-party-matches-v1');(await import('/src/storage.js')).saveMatch(e.createMatch(e.DEFAULT_PLAYERS,variant==='501'?'501':'cricket'));},variant);
 await page.reload();await page.locator('#resume').click();for(const mult of [3,1,2]){await page.locator(`[data-mult="${mult}"]`).click();await page.locator('[data-hit="17"]').click();}
 assert.equal(await page.locator('.announcement-label').innerText(),'SZANGHAJ!');assert.equal(await page.locator('.player-score').first().innerText(),variant==='501'?'399':'51');await page.locator('.announcement-continue').click();
}
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: variant selection through bull contest/reload, 6-player cutthroat Shanghai, celebration/voice, undo, persistence, standard/X01 Shanghai, mobile');})().catch(e=>{console.error(e);process.exit(1)});
