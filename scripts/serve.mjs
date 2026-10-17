import http from 'node:http';
import {resolve} from 'node:path';
import {createHandler} from '../server/http.js';
try{process.loadEnvFile('.env.local');}catch(e){if(e.code!=='ENOENT')throw e;}
const port=Number(process.env.PORT||4173);
const server=http.createServer(createHandler({root:resolve(process.env.SERVE_DIR||'.')}));
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} jest zajęty. Zatrzymaj poprzedni serwer w jego terminalu (Ctrl+C), potem uruchom npm run dev.`:`Nie udało się uruchomić serwera: ${e.code}`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`DART PARTY: http://127.0.0.1:${port}`));
