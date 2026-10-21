const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:4193/public/coach-frame.html?page=profil&scene=empty';
// Only the separate QA origin: the fixture resets synthetic profiles on each navigation.
for(const [width,height] of [[1920,1080],[1180,820],[1024,768],[820,1180],[390,844]]){
 await page.setViewportSize({width,height});await page.goto(base);await page.locator('[data-warmup]').waitFor();assert(await page.locator('#fullscreen').isVisible());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`evidence/coach-alive/welcome-${width}.png`,fullPage:true});
 await page.locator('[data-warmup]').click();await page.locator('[data-hit]').first().waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`evidence/coach-alive/match-${width}.png`,fullPage:true});
}
await page.setViewportSize({width:1180,height:820});await page.goto(base);await page.locator('[data-warmup]').click();
const hit=async(n,m=1)=>{await page.locator(`[data-mult="${m}"]`).click();await page.locator(`[data-hit="${n}"]`).click();};
for(let i=0;i<3;i++)await hit(20,3);
await page.waitForFunction(()=>document.querySelector('.coach-bot-stage')&&document.querySelector('h1').textContent.includes('Teraz'));
await page.locator('[data-skip-tempo]').click();await page.screenshot({path:'evidence/coach-alive/bot.png',fullPage:true});
await page.locator('[data-back]').click();const saved=await page.evaluate(()=>localStorage.getItem('dart-party-profiles-v1'));await page.waitForTimeout(2200);assert.equal(await page.evaluate(()=>localStorage.getItem('dart-party-profiles-v1')),saved,'timer stops on exit');
await page.locator('[data-resume-match]').first().click();await page.locator('[data-hit]').first().waitFor({timeout:12000});
await page.locator('[data-undo]').click();assert.equal(await page.locator('[data-hit]').count(),20);await hit(20,3);
await page.locator('[data-hit]').first().waitFor({timeout:12000});await hit(20,3);await hit(20,3);await hit(1);
await page.locator('[data-next="warmup"]').waitFor();await page.locator('[data-feeling="warming"]').click();assert.match(await page.locator('[data-feeling-reply]').innerText(),/Nie ma pośpiechu/i);await page.screenshot({path:'evidence/coach-alive/after-leg.png',fullPage:true});
await page.locator('[data-next="warmup"]').click();await page.locator('[data-hit]').first().waitFor();await page.locator('#fullscreen').click();assert(await page.evaluate(()=>!!document.fullscreenElement));await page.locator('#fullscreen').click();assert(!(await page.evaluate(()=>!!document.fullscreenElement)));
assert.deepEqual(errors,[]);console.log('PASS: five viewports, paced bot, pause/resume, undo, full 301 leg, feeling, next warmup, fullscreen; no page errors');await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
