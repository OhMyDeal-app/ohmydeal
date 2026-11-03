// Prevent beta test site from accidentally connecting to live user data.
const url=(process.env.VITE_SUPABASE_URL||'').trim().replace(/\/+$/, '');
const key=(process.env.VITE_SUPABASE_PUBLISHABLE_KEY||'').trim();
const productionUrl='https://uvjcqttowwubuxjkbbcv.supabase.co';
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  console.error('TEST BUILD STOPPED: set VITE_SUPABASE_URL to your NEW TEST Supabase URL in Netlify environment variables.');
  process.exit(1);
}
if(!key){
  console.error('TEST BUILD STOPPED: set VITE_SUPABASE_PUBLISHABLE_KEY to the test Supabase publishable key in Netlify.');
  process.exit(1);
}
if(url===productionUrl){
  console.error('TEST BUILD STOPPED: this is the LIVE Supabase project. Create/use a separate test project.');
  process.exit(1);
}
console.log('Beta 0.8: test Supabase configured; live project blocked.');
