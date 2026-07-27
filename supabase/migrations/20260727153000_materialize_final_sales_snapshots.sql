begin;

-- sales_snapshots now stores final seller-matrix values, not monthly Power BI
-- facts. Existing rows use the legacy contract and cannot be read as final
-- values, so a fresh snapshot is required after this migration.
delete from public.sales_snapshots;

alter table public.sales_snapshots
  add column if not exists calculation_version text not null default 'matrix-v1',
  add column if not exists row_kind text not null default 'detail',
  add column if not exists row_key text,
  add column if not exists parent_key text,
  add column if not exists child_count integer,
  add column if not exists is_total boolean not null default false,
  add column if not exists has_closed_month_status boolean not null default false,
  add column if not exists open_month_tcy_by_month jsonb not null default '{}'::jsonb,
  add column if not exists previous_target numeric,
  add column if not exists previous_result numeric,
  add column if not exists previous_cover numeric,
  add column if not exists previous_difference numeric,
  add column if not exists year_result numeric,
  add column if not exists year_comparison numeric,
  add column if not exists year_difference numeric,
  add column if not exists previous_year_result_all numeric,
  add column if not exists current_target numeric,
  add column if not exists current_result numeric,
  add column if not exists current_trend numeric,
  add column if not exists current_cover numeric,
  add column if not exists current_difference numeric,
  add column if not exists monthly_target numeric,
  add column if not exists extra_monthly_target numeric,
  add column if not exists new_monthly_target numeric,
  add column if not exists display_values jsonb not null default '{}'::jsonb,
  add column if not exists cell_tones jsonb;

alter table public.sales_snapshots
  alter column row_key set not null,
  alter column previous_target set not null,
  alter column previous_result set not null,
  alter column previous_year_result_all set not null,
  alter column current_target set not null,
  alter column current_result set not null,
  alter column current_trend set not null;

alter table public.sales_snapshots
  drop constraint if exists sales_snapshots_row_kind_check,
  add constraint sales_snapshots_row_kind_check
    check (row_kind in ('detail', 'team', 'category', 'group2', 'group3', 'total'));

create unique index if not exists sales_snapshots_final_row_key
  on public.sales_snapshots (snapshot_date, area, page_code, year, row_key);

comment on table public.sales_snapshots is
  'Materialized final report-matrix values. Legacy pbi_query_calc_* and react_calc_* columns are retained only for backwards-compatible schema access and are not populated.';

commit;
