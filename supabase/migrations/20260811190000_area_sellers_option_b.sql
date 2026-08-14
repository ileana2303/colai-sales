begin;

-- Option B: one row per area, sellers nested as jsonb.
create table if not exists public.area_sellers (
  area text primary key,
  sellers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.area_sellers is
  'Power BI sellers catalog. One row per area; sellers is [{ seller_code, sales_person, team }, ...].';

-- Drop Option A single-document table if it was created.
drop table if exists public.sellers_by_area;

commit;
