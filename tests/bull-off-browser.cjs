const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:1024,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');await page.locator('#start').click();assert.equal(await page.locator('.announcement-name').innerText(),'MACIEK');await page.locator('.player-announcement').waitFor({state:'detached',timeout:5000});
for(const v of [50,0,0,25,25,0,...Array(12).fill(0)])await page.locator(`[data-bull="${v}"]`).click();
assert.match(await page.locator('.bull-panel').innerText(),/DOGRYWKA 1/);assert.equal(await page.locator('.announcement-name').innerText(),'MACIEK');await page.locator('.player-announcement').waitFor({state:'detached',timeout:5000});
await page.locator('[data-bull="0"]').click();await page.reload();assert.equal(await page.locator('.dart-slot.filled').count(),1);
await page.locator('#undo-bull').click();assert.equal(await page.locator('.dart-slot.filled').count(),0);
for(const v of [0,0,0,50,25,0])await page.locator(`[data-bull="${v}"]`).click();
assert.match(await page.locator('.bull-panel h2').innerText(),/PRZEMEK zaczyna/);
await page.locator('#undo-bull').click();assert.equal(await page.locator('#start-match').count(),0);await page.locator('[data-bull="0"]').click();
await page.screenshot({path:'/private/tmp/dart-bull-winner.png',fullPage:true});
await page.locator('#start-match').click();assert.equal(await page.locator('.player-card.active .player-name').innerText(),'PRZEMEK');assert.equal(await page.locator('.player-card.active .player-score').innerText(),'501');
await page.locator('#new-game').click();await page.locator('#start').click();assert.equal(await page.locator('.announcement-name').innerText(),'MACIEK');await page.locator('.player-announcement').waitFor({state:'detached',timeout:5000});
await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:'/private/tmp/dart-bull-mobile.png',fullPage:true});assert.deepEqual(errors,[]);await browser.close();console.log('PASS: tie, reload, undo, winner, clean game score, mobile, no JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
