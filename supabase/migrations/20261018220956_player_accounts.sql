-- Private snapshots for registered players. Guest/device matches remain separate.
create table public.dart_player_accounts (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 1 check (revision > 0),
 payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 5000000),
 updated_at timestamptz not null default now()
);
alter table public.dart_player_accounts enable row level security;
revoke all on public.dart_player_accounts from anon, authenticated;
grant select, insert, update on public.dart_player_accounts to authenticated;
create policy player_account_read on public.dart_player_accounts for select to authenticated using (
 owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true') = 'false'
);
create policy player_account_insert on public.dart_player_accounts for insert to authenticated with check (
 owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true') = 'false'
);
create policy player_account_update on public.dart_player_accounts for update to authenticated using (
 owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true') = 'false'
) with check (
 owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'true') = 'false'
);
create function public.save_dart_player_account(expected_revision bigint, new_payload jsonb)
returns table(revision bigint) language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null or coalesce(auth.jwt()->>'is_anonymous','true') <> 'false' then
  raise exception 'Registered account required';
 end if;
 if expected_revision = 0 then
  return query insert into public.dart_player_accounts as a(owner_id,payload)
   values(auth.uid(),new_payload) on conflict(owner_id) do nothing returning a.revision;
 else
  return query update public.dart_player_accounts as a set payload=new_payload,revision=a.revision+1,updated_at=now()
   where a.owner_id=auth.uid() and a.revision=expected_revision returning a.revision;
 end if;
end $$;
revoke all on function public.save_dart_player_account(bigint,jsonb) from public;
grant execute on function public.save_dart_player_account(bigint,jsonb) to authenticated;
