-- handle_new_user: auto-create Profile + UserRole after Supabase Auth signs up a user.
-- Must run AFTER the init migration (which creates Profile, UserRole, and AppRole enum).
-- All table/type references are schema-qualified because GoTrue uses search_path=auth.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id TEXT PRIMARY KEY,
  email TEXT,
  raw_user_meta_data JSONB
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."Profile" (id, name, email, department, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'department',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  INSERT INTO public."UserRole" (id, "userId", role)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::public."AppRole"
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
