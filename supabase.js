// Only public Supabase credentials. Never add secret/service-role keys here.
const URL=(import.meta.env.VITE_SUPABASE_URL||'').trim().replace(/\/+$/,'');
const KEY=(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'').trim();
const STORE='omd-beta08-test-cloud-session';
if(!URL||!KEY||URL==='https://uvjcqttowwubuxjkbbcv.supabase.co') {
  throw new Error('Beta 0.8 TEST: укажи отдельный тестовый Supabase URL и publishable key в Netlify. Рабочий Supabase запрещён.');
}
export const cloudEnabled=true;
async function request(path,{method='GET',token,body,prefer}={}){
 const res=await fetch(URL+path,{method,headers:{'apikey':KEY,'Content-Type':'application/json',...(prefer?{'Prefer':prefer}:{}),...(token?{'Authorization':'Bearer '+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const text=await res.text();let data;try{data=text?JSON.parse(text):null}catch{data=null}
 if(!res.ok)throw Error(data?.msg||data?.message||data?.error_description||data?.error||`HTTP ${res.status}`);
 return data;
}
export const cloud={
 async restore(){const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(!saved)return null;if(saved.expires_at>Date.now()/1000+60)return saved;try{const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:saved.refresh_token}});const s={...next,expires_at:Math.floor(Date.now()/1000)+next.expires_in};localStorage.setItem(STORE,JSON.stringify(s));return s}catch{localStorage.removeItem(STORE);return null}},
 async authenticate(mode,email,password){const signup=mode==='signup';const data=await request(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});if(data.access_token){const s={...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in};localStorage.setItem(STORE,JSON.stringify(s));return s}return null},
 async logout(){const s=JSON.parse(localStorage.getItem(STORE)||'null');if(s?.access_token){try{await request('/auth/v1/logout',{method:'POST',token:s.access_token})}catch{}}localStorage.removeItem(STORE)},
 async uploadPhoto(token,objectId,file){
  const user=await request('/auth/v1/user',{token});
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,6)||'jpg';
  const path=user.id+'/'+encodeURIComponent(objectId)+'/'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+ext;
  const response=await fetch(URL+'/storage/v1/object/omd-property-photos/'+path,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':file.type||'image/jpeg','x-upsert':'false'},body:file});
  if(!response.ok){let data={};try{data=await response.json()}catch{}throw Error(data.message||data.error||'HTTP '+response.status)}
  return URL+'/storage/v1/object/authenticated/omd-property-photos/'+path;
 },
 async photoUrl(token,url){const path=url.split('/omd-property-photos/')[1];if(!path)return url;const r=await request('/storage/v1/object/sign/omd-property-photos/'+path,{method:'POST',token,body:{expiresIn:3600}});return URL+'/storage/v1'+r.signedURL},
 async myAgentProfile(token){const u=await request('/auth/v1/user',{token});const rows=await request('/rest/v1/omd_agent_profiles?select=*&user_id=eq.'+u.id,{token});return rows[0]||{user_id:u.id,verified:false}},
 async saveAgentProfile(token,p){const u=await request('/auth/v1/user',{token});return request('/rest/v1/omd_agent_profiles?on_conflict=user_id',{method:'POST',token,prefer:'resolution=merge-duplicates,return=minimal',body:{user_id:u.id,display_name:p.display_name||'',phone:p.phone||'',telegram:p.telegram||''}})},
 async agentContact(token,id){const r=await request('/rest/v1/omd_agent_profiles?select=display_name,phone,telegram&user_id=eq.'+encodeURIComponent(id),{token});return r[0]||null},
 async sharedListings(token){return request('/rest/v1/omd_shared_listings?select=*&order=updated_at.desc&limit=300',{token})},
 async publishListing(token,o){const u=await request('/auth/v1/user',{token});const body={agent_id:u.id,local_id:String(o.id),title:o.title,price:Number(o.price),area:Number(o.area)||null,location:o.location||'',floor:String(o.floor||''),rooms:o.rooms||'',description:o.description||'',sale_status:o.saleStatus||'В продаже',visibility:o.visibility,commission_mode:o.commissionMode||'percent',commission_value:o.commissionValue===''?null:(Number.isFinite(Number(o.commissionValue??o.commission))?Number(o.commissionValue??o.commission):null),partner_mode:o.partnerMode||'percent',partner_value:o.partnerValue===''?null:(Number.isFinite(Number(o.partnerValue??o.partnerShare))?Number(o.partnerValue??o.partnerShare):null),updated_at:new Date().toISOString()};return request('/rest/v1/omd_shared_listings?on_conflict=agent_id,local_id',{method:'POST',token,body,prefer:'resolution=merge-duplicates,return=minimal'})},
 async unpublishListing(token,id){const u=await request('/auth/v1/user',{token});return request('/rest/v1/omd_shared_listings?agent_id=eq.'+encodeURIComponent(u.id)+'&local_id=eq.'+encodeURIComponent(id),{method:'DELETE',token})},
 async read(token){const user=await request('/auth/v1/user',{token});const rows=await request('/rest/v1/omd_user_data?select=payload&user_id=eq.'+encodeURIComponent(user.id),{token});return rows[0]?.payload||null},
 async write(token,payload){const user=await request('/auth/v1/user',{token});return request('/rest/v1/omd_user_data?on_conflict=user_id',{method:'POST',token,body:{user_id:user.id,payload},prefer:'resolution=merge-duplicates,return=minimal'})}
};
