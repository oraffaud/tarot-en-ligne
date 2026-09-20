-- Applied and verified on the linked production database on 2026-09-20.
-- Idempotent permission-only changes: no stored user data is modified.
-- The translation RPC already validates auth.uid(), ownership and owner role.
REVOKE EXECUTE ON FUNCTION public.cache_message_translation(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cache_message_translation(uuid, text, text) TO authenticated, service_role;

-- Row-level self-update alone must not allow changing an authorization role.
-- User provisioning remains handled by the existing SECURITY DEFINER trigger.
-- Privileged service-role administration retains its existing permissions.
REVOKE UPDATE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (id, email, display_name, role, created_at, updated_at)
  ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT, DELETE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (display_name, updated_at) ON TABLE public.profiles TO authenticated;

-- Verification:
-- has_column_privilege('authenticated','public.profiles','role','UPDATE') = false
-- has_column_privilege('authenticated','public.profiles','display_name','UPDATE') = true
-- has_column_privilege('service_role','public.profiles','role','UPDATE') = true
-- has_function_privilege('anon','public.cache_message_translation(uuid,text,text)','EXECUTE') = false
