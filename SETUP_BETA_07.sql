-- Run once in Supabase SQL Editor, while logged in as project owner.
-- Private storage: users can upload only into their own UID prefix.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('omd-property-photos','omd-property-photos',false,10485760,ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

create policy "omd photos upload own" on storage.objects for insert to authenticated
with check (bucket_id='omd-property-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "omd photos read own" on storage.objects for select to authenticated
using (bucket_id='omd-property-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "omd photos delete own" on storage.objects for delete to authenticated
using (bucket_id='omd-property-photos' and (storage.foldername(name))[1] = auth.uid()::text);
