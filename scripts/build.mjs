import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
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
