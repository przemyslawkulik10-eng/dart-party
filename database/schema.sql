-- DART PARTY only: run in its dedicated Supabase project.
begin;
create table if not exists public.dart_matches (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint dart_match_object check (jsonb_typeof(state) = 'object'),
  constraint dart_match_version check ((state->>'version')::integer = 1),
  constraint dart_match_id check (state->>'id' = id::text),
  constraint dart_match_size check (octet_length(state::text) <= 3000000)
);
alter table public.dart_matches enable row level security;
revoke all on public.dart_matches from anon, authenticated;
grant select, insert, update on public.dart_matches to authenticated;
create index if not exists dart_matches_owner_updated_idx on public.dart_matches(owner_id, updated_at desc);
create policy "Read own games" on public.dart_matches for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Create own games" on public.dart_matches for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Update own games" on public.dart_matches for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
commit;

-- Supabase's optional automatic-RLS event trigger is administrative only.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
