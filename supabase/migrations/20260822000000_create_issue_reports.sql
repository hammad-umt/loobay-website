create table public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text,
  email text not null,
  category text not null,
  message text not null,
  status text not null default 'received',
  consent boolean not null,
  consent_notice_version text not null,
  created_at timestamptz not null default now(),

  constraint issue_reports_reference_format
    check (reference ~ '^LBY-[0-9]{8}-[A-F0-9]{8}$'),
  constraint issue_reports_name_length
    check (
      name is null or
      (name = btrim(name) and char_length(name) between 1 and 100)
    ),
  constraint issue_reports_email_format
    check (
      email = lower(btrim(email)) and
      char_length(email) between 3 and 254 and
      position('@' in email) > 1
    ),
  constraint issue_reports_category_value
    check (
      category in (
        'bug',
        'account',
        'download',
        'game',
        'team',
        'marketplace',
        'safety',
        'privacy',
        'feedback',
        'other'
      )
    ),
  constraint issue_reports_message_length
    check (
      message = btrim(message) and
      char_length(message) between 10 and 4000
    ),
  constraint issue_reports_status_value
    check (
      status in (
        'received',
        'triaged',
        'in_progress',
        'resolved',
        'closed',
        'spam'
      )
    ),
  constraint issue_reports_consent_required check (consent is true),
  constraint issue_reports_consent_notice_version_length
    check (char_length(consent_notice_version) between 1 and 50)
);

comment on table public.issue_reports is
  'Private support issues submitted through the Loobay website.';
comment on column public.issue_reports.email is
  'Personal data: restrict staff access and apply the documented retention policy.';

alter table public.issue_reports enable row level security;

revoke all on table public.issue_reports from public, anon, authenticated;
grant insert, select on table public.issue_reports to service_role;

create index issue_reports_status_created_at_idx
  on public.issue_reports (status, created_at desc);
