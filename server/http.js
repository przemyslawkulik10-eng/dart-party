import {readFile,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {CoachError,coachConfigured,generateCoach} from './coach.js';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
export function publicPath(pathname){
 if(pathname==='/'||pathname==='/index.html')return 'index.html';
 if(pathname==='/styles.css')return 'styles.css';
 if(!/^\/(src|public)\/[a-zA-Z0-9_./-]+$/.test(pathname)||pathname.split('/').some(x=>x.startsWith('.')))return null;
 if(!types[extname(pathname)])return null;
 return pathname.slice(1);
}
export function createHandler({root=resolve('.'),env=process.env,fetchImpl=fetch,now=Date.now,allowedHosts=[]}={}){
 let busy=false,lastRequest=-Infinity;
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 return async(req,res)=>{
  try{
   const host=req.headers.host||'';
   if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)&&!allowedHosts.includes(host))return send(res,403,{error:'Serwer jest przeznaczony wyłącznie do lokalnego użytku.'});
   const path=new URL(req.url,`http://${host}`).pathname;
   if(path.startsWith('/api/')){
    if((req.headers.origin!==`http://${host}` && !(req.method==='GET'&&!req.headers.origin))||req.headers['x-dart-party']!=='coach')return send(res,403,{error:'Nieprawidłowe źródło żądania.'});
    if(path==='/api/coach/status'&&req.method==='GET')return send(res,200,{available:coachConfigured(env)});
    if(path!=='/api/coach'||req.method!=='POST')return send(res,405,{error:'Niedozwolona operacja.'});
    if(!coachConfigured(env))return send(res,503,{error:'Trener AI nie jest jeszcze skonfigurowany.'});
    if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'Wymagany JSON.'});
    if(busy||now()-lastRequest<30000)return send(res,429,{error:'Poczekaj 30 sekund przed kolejną analizą.'});
    busy=true;lastRequest=now();
    try{
     let body='',bytes=0;for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>256000)throw new CoachError(413,'Za dużo danych do jednej analizy.');body+=chunk;}
     let data;try{data=JSON.parse(body);}catch{throw new CoachError(400,'Nieprawidłowy JSON.');}
     return send(res,200,await generateCoach(data,{env,fetchImpl}));
    }finally{busy=false;}
   }
   if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Niedozwolona operacja.'});
   const safe=publicPath(decodeURIComponent(path));if(!safe)return send(res,404,{error:'Nie znaleziono'});
   const file=await realpath(resolve(root,safe));const realRoot=await realpath(root);if(!file.startsWith(realRoot+sep))return send(res,404,{error:'Nie znaleziono'});
   const body=await readFile(file);res.writeHead(200,{'Content-Type':`${types[extname(file)]}; charset=utf-8`,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
  }catch(e){send(res,e instanceof CoachError?e.status:404,{error:e instanceof CoachError?e.message:'Nie znaleziono'});}
 };
}
