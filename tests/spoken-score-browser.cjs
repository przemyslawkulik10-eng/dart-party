const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage();
await page.addInitScript(()=>{window.spoken=[];speechSynthesis.speak=u=>window.spoken.push(u.text);speechSynthesis.cancel=()=>{};});
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');
await page.evaluate(async()=>{
 const e=await import('/src/engine.js');let m=e.createMatch(['PRZEMEK','MACIEK'],'301');
 for(const n of [25,25,25])m=e.recordDart(m,n,1);
 m=e.nextPlayer(m);for(let i=0;i<3;i++)m=e.recordDart(m,0,1);
 (await import('/src/storage.js')).saveMatch(m);
});
await page.reload();await page.locator('#resume').click();await page.locator('#next').click();
assert.equal(await page.evaluate(()=>window.spoken.at(-1)),'Teraz rzuca przemek. Do zwycięstwa zostało 226 punktów.');
await page.locator('.player-announcement').waitFor({state:'detached',timeout:5000});
assert.equal(await page.locator('.player-card.active .player-score').innerText(),'226');
const phrases=await page.evaluate(async()=>{const {speakPlayer}=await import('/src/sound.js');window.spoken=[];for(const n of [1,2,12,22,101])speakPlayer('MACIEK',false,n);speakPlayer('MACIEK',true,226);speakPlayer('MACIEK');return window.spoken;});
assert.match(phrases[0],/został 1 punkt/);assert.match(phrases[1],/zostały 2 punkty/);assert.match(phrases[2],/zostało 12 punktów/);assert.match(phrases[3],/zostały 22 punkty/);assert.match(phrases[4],/zostało 101 punktów/);assert.equal(phrases[5],'Wygrywa maciek! Brawo!');assert.equal(phrases[6],'Teraz rzuca maciek.');
await browser.close();console.log('PASS: next player actual 226 score, automatic close, Polish declensions, winner and no-score announcements');
})().catch(e=>{console.error(e);process.exit(1)});
