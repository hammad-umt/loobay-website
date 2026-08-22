create table public.download_counts (
  platform text primary key,
  count bigint not null default 0,

  constraint download_counts_platform_value check (platform in ('android', 'ios')),
  constraint download_counts_count_nonnegative check (count >= 0)
);

insert into public.download_counts (platform, count)
values ('android', 0), ('ios', 0)
on conflict (platform) do nothing;

alter table public.download_counts enable row level security;

revoke all on table public.download_counts from public, anon, authenticated;
grant select on table public.download_counts to service_role;

create or replace function public.increment_download_count(target_platform text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count bigint;
begin
  if target_platform not in ('android', 'ios') then
    raise exception 'Invalid download platform';
  end if;

  insert into public.download_counts (platform, count)
  values (target_platform, 1)
  on conflict (platform) do update
    set count = public.download_counts.count + 1
  returning count into updated_count;

  return updated_count;
end;
$$;

revoke all on function public.increment_download_count(text) from public, anon, authenticated;
grant execute on function public.increment_download_count(text) to service_role;