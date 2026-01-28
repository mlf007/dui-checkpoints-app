-- Create a table to store multiple previous locations for a single checkpoint.
-- Assumptions (based on Supabase/PostgREST typical setup):
-- - public."Checkpoints".id is a BIGINT (often returned as string in JS)
-- - City/County are currently stored as text on the checkpoint rows
--
-- If your "Checkpoints".id is NOT bigint (e.g. uuid), change checkpoint_id type below to match.

create table if not exists public.previous_locations (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id bigint not null references public."Checkpoints"(id) on delete cascade,

  -- Referenced/denormalized fields (copied from checkpoint context)
  county text null,
  city text null,

  -- New fields for each previous location
  location text not null,
  mapurl text null,

  created_at timestamptz not null default now()
);

create index if not exists previous_locations_checkpoint_id_idx
  on public.previous_locations (checkpoint_id);

-- Prevent duplicates when migrating (safe to run multiple times)
create unique index if not exists previous_locations_dedupe_idx
  on public.previous_locations (checkpoint_id, location, mapurl);

-- Migrate existing data from Checkpoints -> previous_locations
insert into public.previous_locations (checkpoint_id, county, city, location, mapurl)
select
  c.id as checkpoint_id,
  c."County" as county,
  c."City" as city,
  c."Location" as location,
  c.mapurl as mapurl
from public."Checkpoints" c
where c."Location" is not null
on conflict (checkpoint_id, location, mapurl) do nothing;

