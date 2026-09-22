-- Add Webform-Technical module to oracle_modules table
INSERT INTO oracle_modules (name) 
VALUES ('Webform-Technical')
ON CONFLICT (name) DO NOTHING;
