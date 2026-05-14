-- Create auth schema required by GoTrue (Supabase Auth)
CREATE SCHEMA IF NOT EXISTS auth;
GRANT ALL ON SCHEMA auth TO postgres;
