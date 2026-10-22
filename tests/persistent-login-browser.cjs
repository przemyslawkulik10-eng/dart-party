const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const {mkdtemp,rm}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const {join,resolve}=require('node:path');
const http=require('node:http');

(async()=>{
 const {createHandler}=await import('../server/http.js');
 const server=http.createServer(createHandler({root:resolve(__dirname,'..'),env:{}}));
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});
 const origin=`http://127.0.0.1:${server.address().port}`,profile=await mkdtemp(join(tmpdir(),'dart-session-qa-'));
 const key='dart-party-player-session',id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
 const user={id,email:'persistent@example.test',is_anonymous:false,aud:'authenticated',role:'authenticated'};
 const enc=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const session=()=>({access_token:enc({alg:'HS256',typ:'JWT'})+'.'+enc({sub:id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})+'.test',refresh_token:'synthetic-refresh',token_type:'bearer',expires_in:3600,user});
 let context,row=null,refreshes=0;const errors=[],unexpected=[];
 async function launch(){
  context=await chromium.launchPersistentContext(profile,{headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',serviceWorkers:'block'});
  context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin===origin){
    if(url.pathname==='/src/config.js')return route.fulfill({contentType:'application/javascript',body:"export const config={supabaseUrl:'https://account-test.supabase.co',supabaseKey:'public-test'};"});
    return route.continue();
   }
   if(url.origin!=='https://account-test.supabase.co'){unexpected.push(url.origin);return route.abort();}
   // Guest cloud sync is unrelated to player login; keep it unavailable here.
   if(url.pathname.endsWith('/signup'))return route.fulfill({status:503,contentType:'application/json',body:'{}'});
   let data={};
   if(url.pathname.endsWith('/token')){if(url.searchParams.get('grant_type')==='refresh_token')refreshes++;data=session();}
   else if(url.pathname.endsWith('/user'))data=user;
   else if(url.pathname.endsWith('/logout')){assert.equal(url.searchParams.get('scope'),'local');}
   else if(url.pathname.includes('/rpc/')){const body=route.request().postDataJSON();row={revision:(row?.revision||0)+1,payload:body.new_payload};data=[{revision:row.revision}];}
   else if(url.pathname.includes('/dart_player_accounts'))data=row?[row]:[];
   else {unexpected.push(url.pathname);return route.abort();}
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  return context.newPage();
 }
 const signedIn=async page=>{await page.goto(origin+'/?page=konto');await page.locator('#account-logout').waitFor();assert.equal(await page.evaluate(async()=>(await import('/src/accounts.js')).accountUser()?.id),id);};
 try{
  let page=await launch();await page.goto(origin+'/?page=konto');
  await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill('synthetic-password');await page.locator('#auth-form [type=submit]').click();
  await page.waitForURL('**/?page=home');await signedIn(page);
  await page.evaluate(async({id,key})=>{
   localStorage.setItem('dart-party-library-v1','guest-result');
   const {appStorage}=await import('/src/account-storage.js');appStorage.setItem('dart-party-library-v1','account-result');
   if(!localStorage.getItem(key)||sessionStorage.getItem(key))throw Error('Session storage incorrect');
  },{id,key});
  await page.locator('#account-sync').click();await page.getByText('Zapisano dane konta w chmurze.',{exact:true}).waitFor();
  await page.close();page=await context.newPage();await signedIn(page);
  console.log('PASS: login survives closing the tab and opening a new tab');
  await context.close();page=await launch();await signedIn(page);
  assert.equal(await page.evaluate(async()=>(await import('/src/account-storage.js')).appStorage.getItem('dart-party-library-v1')),'account-result');
  console.log('PASS: login and account data survive a full browser restart');
  await page.evaluate(key=>{const saved=JSON.parse(localStorage.getItem(key));saved.expires_at=1;localStorage.setItem(key,JSON.stringify(saved));},key);
  await context.close();page=await launch();await signedIn(page);assert(refreshes>0);
  console.log('PASS: expired access token is refreshed on reopening');
  const second=await context.newPage();await signedIn(second);
  await page.locator('#account-logout').click();await second.locator('#auth-form').waitFor();
  assert.equal(await second.evaluate(key=>localStorage.getItem(key),key),null);
  assert.equal(await second.evaluate(async()=>(await import('/src/account-storage.js')).accountOwner()),null);
  await context.close();page=await launch();await page.goto(origin+'/?page=konto');await page.locator('#auth-form').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('dart-party-library-v1')),'guest-result');
  assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('dart-party-account-data:'+id))['dart-party-library-v1'],id),'account-result');
  console.log('PASS: manual logout reaches the other tab, survives restart and preserves guest/account results');
  // An older tab must not resurrect a session after explicit logout.
  await page.evaluate(({key,old})=>sessionStorage.setItem(key,JSON.stringify(old)),{key,old:session()});
  await page.reload();await page.locator('#auth-form').waitFor();assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),key),null);
  // Simulate first upgrade of a still-open legacy session using synthetic data.
  await page.evaluate(({key,old})=>{localStorage.removeItem(key+':persistent-v1');sessionStorage.setItem(key,JSON.stringify({...old,expires_at:Math.floor(Date.now()/1000)+3600}));},{key,old:session()});
  await signedIn(page);await page.close();page=await context.newPage();await signedIn(page);
  console.log('PASS: legacy session migrates, but a stale tab cannot undo logout');
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 }finally{await context?.close();await new Promise(done=>server.close(done));await rm(profile,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
