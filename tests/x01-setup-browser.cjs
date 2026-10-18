const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
const page=await browser.newPage();await page.route('https://*.supabase.co/**',r=>r.abort());
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.DART_TEST_URL||'http://127.0.0.1:4187');
await page.locator('#enter-competition').click();
while(await page.locator('[data-player-name]').count()>2)await page.locator('[data-remove]').last().click();
await page.locator('[data-player-name="0"]').fill('Aleksander Bardzo Długi');await page.locator('[data-player-name="1"]').fill('Przemysław Kulik');
await page.locator('#legs-to-win').selectOption('2');
for(const mode of ['501','301','201']){
await page.locator(`[data-mode="${mode}"]`).click();assert.equal(await page.locator('#legs-to-win').inputValue(),'2');
await page.locator('#double-out').uncheck();await page.locator('#setup-sound').click();
assert.equal(await page.locator('[data-player-name="0"]').inputValue(),'Aleksander Bardzo Długi');
await page.locator('#start').click();
const contest=await page.evaluate(()=>JSON.parse(localStorage.getItem('dart-party-bull-off')));
assert.equal(contest.mode,mode);assert.equal(contest.doubleOut,false);assert.equal(contest.legsToWin,2);assert.equal(contest.names.length,2);
await page.locator('#cancel-contest').click();await page.locator('#double-out').check();
}
for(const count of [2,6]){
while(await page.locator('[data-player-name]').count()<count){await page.locator('#add-player').click();await page.locator('[data-player-name]').last().fill(`Zawodnik Długie Imię ${await page.locator('[data-player-name]').count()}`);}
for(const [width,height] of [[1920,1080],[1180,820],[1024,768],[820,1180],[390,844]]){
await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width} ${count}`);
await page.screenshot({path:`/private/tmp/x01-setup-${count}-${width}.png`,fullPage:true});
}
}
await page.locator('#start').click();assert.equal(await page.locator('[data-bull="50"]').count(),1);
assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('dart-party-bull-off')))).names.length,6);
assert.deepEqual(errors,[]);console.log('PASS: 3 modes, settings persistence, 2/6 players, 5 viewports, bull-off, no JS errors');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
