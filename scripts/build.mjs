import {createHash} from 'node:crypto';
import './build-auth.mjs';
import { cp, mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html', 'styles.css', 'src', 'public']) await cp(file, `dist/${file}`, { recursive: true });
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if (supabaseUrl && !/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(supabaseUrl)) throw new Error('Invalid Supabase URL');
if (supabaseKey.startsWith('sb_secret_')) throw new Error('Secret key must not be exposed');
if (supabaseKey.startsWith('eyJ')) {
  const payload = JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('Only a public anon key may be exposed');
}
await writeFile('dist/src/config.js', `export const config = ${JSON.stringify({supabaseUrl, supabaseKey})};\n`);
console.log('DART PARTY: gotowa aplikacja w dist/');

// Fingerprint the exact shipped files, including public configuration.
const digest=createHash('sha256');
async function fingerprint(dir){
 for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const path=`${dir}/${entry.name}`;
  if(entry.isDirectory())await fingerprint(path);
  else {digest.update(path);digest.update(await readFile(path));}
 }
}
await fingerprint('dist');
const version=digest.digest('hex');
await writeFile('dist/index.html',(await readFile('dist/index.html','utf8')).replace('__APP_BUILD__',version));
await writeFile('dist/public/app-version.json',JSON.stringify({version}));
