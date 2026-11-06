CREATE TABLE IF NOT EXISTS fleet_records (
 id text PRIMARY KEY,
 kind text NOT NULL CHECK(kind IN ('vehicle','driver','inspection','meta')),
 payload jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 revision integer NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS fleet_records_kind ON fleet_records(kind);
CREATE INDEX IF NOT EXISTS fleet_inspections_vehicle ON fleet_records((payload->>'vehicleId')) WHERE kind='inspection';
CREATE UNIQUE INDEX IF NOT EXISTS fleet_vehicle_plate ON fleet_records((upper(replace(payload->>'plate','-','')))) WHERE kind='vehicle';
CREATE TABLE IF NOT EXISTS app_users (
 id uuid PRIMARY KEY,
 email text NOT NULL UNIQUE,
 full_name text NOT NULL,
 password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'operator' CHECK(role IN ('admin','operator')),
 active boolean NOT NULL DEFAULT true,
 must_change_password boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_sessions (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_sessions_expiry ON app_sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
 identifier text PRIMARY KEY,
 attempts integer NOT NULL DEFAULT 0,
 window_start timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS uploaded_media (
 id text PRIMARY KEY,
 mime_type text NOT NULL,
 byte_size integer NOT NULL,
 sha256 text NOT NULL,
 uploaded_by uuid REFERENCES app_users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS finding_resolutions (
 id uuid PRIMARY KEY,
 inspection_id text NOT NULL REFERENCES fleet_records(id),
 finding_id text NOT NULL,
 note text NOT NULL,
 resolved_by uuid NOT NULL REFERENCES app_users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(inspection_id,finding_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
 id bigserial PRIMARY KEY,
 actor_id uuid REFERENCES app_users(id),
 action text NOT NULL,
 entity_id text,
 details jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_settings (
 key text PRIMARY KEY,
 value jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
