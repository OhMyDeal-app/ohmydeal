// Only public Supabase credentials. Never add secret/service-role keys here.
const URL='https://uvjcqttowwubuxjkbbcv.supabase.co';
const KEY='sb_publishable_DO0JIxEVY8zlV2IsE_xo7w_Wqfzv_fg';
const STORE='omd-cloud-session';
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
 async read(token){const user=await request('/auth/v1/user',{token});const rows=await request('/rest/v1/omd_user_data?select=payload&user_id=eq.'+encodeURIComponent(user.id),{token});return rows[0]?.payload||null},
 async write(token,payload){const user=await request('/auth/v1/user',{token});return request('/rest/v1/omd_user_data?on_conflict=user_id',{method:'POST',token,body:{user_id:user.id,payload},prefer:'resolution=merge-duplicates,return=minimal'})}
};
