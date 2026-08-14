begin;

-- Single-document catalog: area → sellers[{ seller_code, sales_person, team }].
create table if not exists public.sellers_by_area (
  id integer primary key default 1 check (id = 1),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.sellers_by_area is
  'Single-row Power BI sellers catalog keyed by area. payload is Record<area, SellerInfo[]>.';

commit;
