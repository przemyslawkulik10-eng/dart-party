const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage();await page.addInitScript(()=>{window.spoken=[];speechSynthesis.speak=u=>window.spoken.push(u.text);speechSynthesis.cancel=()=>{};});
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4173');
for(const scenario of ['201','cricket','bust','zero']){
 await page.evaluate(async scenario=>{
 const e=await import('/src/engine.js');let m=e.createMatch(['MACIEK','PRZEMEK'],scenario==='cricket'?'cricket':'201');
 if(scenario==='bust'){for(let i=0;i<3;i++)m=e.recordDart(m,20,3);m=e.nextPlayer(m);for(let i=0;i<3;i++)m=e.recordDart(m,0,1);m=e.nextPlayer(m);}
 localStorage.removeItem('dart-party-matches-v1');(await import('/src/storage.js')).saveMatch(m);
 },scenario);
 await page.reload();await page.locator('#resume').click();
 if(scenario==='bust'){
 await page.locator('[data-hit="20"]').click();assert.equal(await page.evaluate(()=>window.spoken.length),0);await page.locator('[data-hit="2"]').click();
 assert.equal(await page.evaluate(()=>window.spoken.at(-1)),'maciek. Przekroczony wynik. Kolejka za zero punktów.');
 }else{
 for(let i=0;i<3;i++){
 if(scenario==='zero')await page.locator('[data-special="0"]').click();else{await page.locator('[data-mult="3"]').click();await page.locator('[data-hit="20"]').click();}
 if(i<2)assert.equal(await page.evaluate(()=>window.spoken.length),0);
 }
 const points=scenario==='201'?180:scenario==='cricket'?120:0;
 assert.deepEqual(await page.evaluate(()=>window.spoken),[`maciek. Wynik kolejki: ${points} punktów.`]);
 await page.locator('#sound-toggle').click();await page.locator('#undo').click();await page.locator('[data-special="0"]').click();assert.equal(await page.evaluate(()=>window.spoken.length),1);await page.locator('#sound-toggle').click();
 }
}
await browser.close();console.log('PASS: only completed turns announced, 180 X01, 120 Cricket, zero, early bust, mute');
})().catch(e=>{console.error(e);process.exit(1)});
