CREATE TABLE IF NOT EXISTS refueling_records (
 id uuid PRIMARY KEY,
 vehicle_id text NOT NULL REFERENCES fleet_records(id),
 driver_id text NOT NULL REFERENCES fleet_records(id),
 recorded_by uuid NOT NULL REFERENCES app_users(id),
 occurred_at timestamptz NOT NULL,
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 void_reason text,
 voided_by uuid REFERENCES app_users(id),
 voided_at timestamptz
);
CREATE INDEX IF NOT EXISTS refueling_vehicle_history ON refueling_records(vehicle_id,occurred_at);
