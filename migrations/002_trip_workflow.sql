CREATE TABLE IF NOT EXISTS trip_links (
 return_id text PRIMARY KEY REFERENCES fleet_records(id),
 departure_id text NOT NULL UNIQUE REFERENCES fleet_records(id),
 note text NOT NULL,
 actor_id uuid REFERENCES app_users(id),
 corrected boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(return_id<>departure_id)
);
CREATE TABLE IF NOT EXISTS finding_events (
 id uuid PRIMARY KEY,
 sequence bigserial NOT NULL UNIQUE,
 inspection_id text NOT NULL REFERENCES fleet_records(id),
 finding_id text NOT NULL,
 status text NOT NULL CHECK(status IN ('identified','assessment','referred','repairing','repaired','closed')),
 note text NOT NULL,
 actor_id uuid NOT NULL REFERENCES app_users(id),
 legacy boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finding_events_history ON finding_events(inspection_id,finding_id,sequence);
INSERT INTO finding_events(id,inspection_id,finding_id,status,note,actor_id,legacy,created_at)
SELECT r.id,r.inspection_id,r.finding_id,'closed',r.note,r.resolved_by,true,r.created_at
FROM finding_resolutions r
WHERE NOT EXISTS(SELECT 1 FROM finding_events e WHERE e.inspection_id=r.inspection_id AND e.finding_id=r.finding_id)
ON CONFLICT(id) DO NOTHING;
