create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null default 'support',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint admin_users_username_format
    check (username = lower(btrim(username)) and username ~ '^[a-z0-9._-]{3,64}$'),
  constraint admin_users_password_hash_format
    check (char_length(password_hash) between 80 and 300),
  constraint admin_users_role_value
    check (role in ('admin', 'support'))
);

comment on table public.admin_users is
  'Private Loobay admin accounts. Passwords are stored as scrypt hashes.';

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to service_role;

create index admin_users_active_username_idx
  on public.admin_users (username)
  where is_active = true;