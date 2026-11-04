-- Link each listing to the seller account that owns it (users table from V3).
-- NOT VALID: the rule applies to every new or changed listing, while listings that
-- were created during development before login existed (test owner ids) are left as they are.
ALTER TABLE properties
    ADD CONSTRAINT fk_properties_owner
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
    NOT VALID;
