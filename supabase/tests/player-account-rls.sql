-- Run after the pending account migration, in the SAME rollback-only transaction.
insert into auth.users(id) values ('d47a0000-0000-4000-8000-000000000001'), ('d47a0000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"d47a0000-0000-4000-8000-000000000001","is_anonymous":false}',true);
do $$ begin
 if (select revision from public.save_dart_player_account(0,'{"test":"A"}')) <> 1 then raise exception 'initial save failed'; end if;
 if (select count(*) from public.save_dart_player_account(0,'{}')) <> 0 then raise exception 'duplicate accepted'; end if;
 if (select revision from public.save_dart_player_account(1,'{"test":"A2"}')) <> 2 then raise exception 'update failed'; end if;
 if (select count(*) from public.save_dart_player_account(1,'{}')) <> 0 then raise exception 'stale revision accepted'; end if;
 begin
  update public.dart_player_accounts set owner_id='d47a0000-0000-4000-8000-000000000002';
  raise exception 'ownership transfer accepted';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"d47a0000-0000-4000-8000-000000000002","is_anonymous":false}',true);
do $$ declare n integer; begin
 if (select count(*) from public.dart_player_accounts) <> 0 then raise exception 'B can read A'; end if;
 update public.dart_player_accounts set payload='{}'; get diagnostics n = row_count;
 if n <> 0 then raise exception 'B can update A'; end if;
 begin
  insert into public.dart_player_accounts(owner_id) values ('d47a0000-0000-4000-8000-000000000001');
  raise exception 'B can insert as A';
 exception when insufficient_privilege then null; end;
 if (select revision from public.save_dart_player_account(0,'{"test":"B"}')) <> 1 then raise exception 'B save failed'; end if;
 if (select count(*) from public.dart_player_accounts) <> 1 then raise exception 'B visibility failed'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"d47a0000-0000-4000-8000-000000000001","is_anonymous":true}',true);
do $$ begin
 if (select count(*) from public.dart_player_accounts) <> 0 then raise exception 'anonymous user reads account'; end if;
 begin
  perform public.save_dart_player_account(2,'{}');
  raise exception 'anonymous user writes account';
 exception when raise_exception then
  if sqlerrm <> 'Registered account required' then raise; end if;
 end;
end $$;
set local role anon;
do $$ begin
 begin
  perform * from public.dart_player_accounts;
  raise exception 'signed-out read accepted';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_dart_player_account(0,'{}');
  raise exception 'signed-out RPC accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: A/B ownership, anonymous and signed-out denial, duplicate and stale revision rejection' as result;
