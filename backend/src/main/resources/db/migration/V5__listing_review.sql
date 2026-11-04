-- Admin review of listings: who reviewed a listing, when, and why it was rejected.
ALTER TABLE properties
    ADD COLUMN rejection_reason TEXT,
    ADD COLUMN reviewed_at      TIMESTAMPTZ,
    ADD COLUMN reviewed_by      UUID REFERENCES users (id) ON DELETE SET NULL;

-- Admins list listings by status (e.g. everything waiting for review), oldest first.
CREATE INDEX IF NOT EXISTS idx_properties_status_created ON properties (status, created_at);
