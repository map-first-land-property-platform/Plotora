-- V3__create_properties.sql

CREATE TABLE properties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code      VARCHAR(20)  NOT NULL UNIQUE,          -- e.g. PLT-2026-0001
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    category            VARCHAR(20)  NOT NULL,                  -- LAND | HOUSE | APARTMENT | COMMERCIAL
    listing_type        VARCHAR(10)  NOT NULL,                  -- SALE | RENT
    status              VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',  -- DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED | SOLD

    price               NUMERIC(14, 2) NOT NULL,
    currency            VARCHAR(3)   NOT NULL DEFAULT 'LKR',

    -- Location
    address             VARCHAR(300) NOT NULL,
    district            VARCHAR(100) NOT NULL,
    latitude            DOUBLE PRECISION NOT NULL,
    longitude           DOUBLE PRECISION NOT NULL,
    location            GEOGRAPHY(POINT, 4326),                 -- PostGIS point, filled by trigger below

    -- Land details (null for pure buildings)
    extent_perches      NUMERIC(10, 2),
    price_per_perch     NUMERIC(12, 2),
    deed_type           VARCHAR(50),
    road_access_ft      NUMERIC(8, 2),
    facing              VARCHAR(30),

    -- Building details (null for pure land)
    bedrooms            INTEGER,
    bathrooms           INTEGER,
    floor_area_sqft     NUMERIC(10, 2),
    floors              INTEGER,

    -- Rental details (only when listing_type = RENT)
    monthly_rent        NUMERIC(12, 2),
    deposit_amount      NUMERIC(12, 2),
    available_from      DATE,
    furnishing          VARCHAR(20),                            -- FURNISHED | SEMI_FURNISHED | UNFURNISHED

    features            TEXT[],                                 -- array of feature tags

    -- Ownership (will link to users table once Auth is ready)
    owner_id            UUID,                                   -- temporary: nullable until users table exists
    -- owner_id         UUID NOT NULL REFERENCES users(id),   -- switch to this later

    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Spatial index for map discovery
CREATE INDEX idx_properties_location ON properties USING GIST (location);

-- Useful indexes
CREATE INDEX idx_properties_status ON properties (status);
CREATE INDEX idx_properties_category ON properties (category);
CREATE INDEX idx_properties_owner ON properties (owner_id);
CREATE INDEX idx_properties_district ON properties (district);

-- Keep the PostGIS location in sync with latitude/longitude
CREATE OR REPLACE FUNCTION set_property_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON properties
    FOR EACH ROW
    EXECUTE FUNCTION set_property_location();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Property images
CREATE TABLE property_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    alt             VARCHAR(200),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_images_property ON property_images (property_id);

