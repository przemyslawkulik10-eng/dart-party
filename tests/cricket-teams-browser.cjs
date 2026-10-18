const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');
await page.locator('#enter-competition').click();
await page.locator('[data-mode="cricket"]').click();
while(await page.locator('[data-player-name]').count()>5)await page.locator('[data-remove]').last().click();
await page.locator('#cricket-teams').check();await page.locator('#start').click();
for(let i=0;i<5;i++)await page.locator(`[data-team-player="${i}"]`).selectOption(String([0,0,1,1,2][i]));
await page.locator('[data-team-form] [type="submit"]').click();
await page.evaluate(()=>document.querySelector('.announcement-continue')?.click());
for(let i=0;i<15;i++){await page.evaluate(()=>document.querySelector('.announcement-continue')?.click());await page.locator(`[data-bull="${i===12?50:0}"]`).click();}
await page.evaluate(()=>document.querySelector('.announcement-continue')?.click());await page.locator('#start-match').click();
assert.equal(await page.locator('.player-coloured.player-card').count(),5);
const saved=await page.evaluate(async()=> (await import('/src/storage.js')).loadMatches()[0]);assert.deepEqual(saved.teams,[2,0,0,1,1]);
await page.locator('[data-hit="15"]').click();await page.locator('#undo').click();
const undone=await page.evaluate(async()=> (await import('/src/storage.js')).loadMatches()[0]);assert.equal(undone.events.length,0);
await page.reload();await page.locator('#resume-home').click();assert.equal(await page.locator('.player-coloured.player-card').count(),5);
for(const count of [2,5,6]){
 await page.evaluate(async count=>{const e=await import('/src/engine.js');let m=e.createMatch(['ALEKSANDER BARDZO DŁUGIE IMIĘ','PRZEMEK','MACIEK','MANIEK','DAWID','BEKO'].slice(0,count),'cricket');if(count===5)m=e.configureCricketTeams(m,[0,0,1,1,2]);(await import('/src/storage.js')).saveMatch(m);},count);
 await page.reload();await page.locator('#resume-home').click();
 for(const [width,height] of [[1920,1080],[1180,820],[1024,768],[820,1180]]){await page.setViewportSize({width,height});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${count} ${width}`);assert.equal(await page.locator('.player-coloured.player-card').count(),count);}
}
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: team selection, bull reorder, colors, scoring/undo, reload; 2/5/6 players with long name at four sizes.');})().catch(e=>{console.error(e);process.exit(1)});
