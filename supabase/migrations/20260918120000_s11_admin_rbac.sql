-- Migration: s11_admin_rbac
-- Description: Harden admin database by introducing admin_members table and 
-- scoping all existing TO authenticated policies behind is_admin(). 
-- Then add auth_user_id to customers table for storefront login.

-- 1. Create admin_members table
CREATE TABLE IF NOT EXISTS public.admin_members (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_members ENABLE ROW LEVEL SECURITY;

-- 2. Seed admin_members from existing profiles (assuming all existing are admins)
INSERT INTO public.admin_members (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create is_admin() helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_members WHERE user_id = auth.uid()
  );
$$;

-- Only admins can see admins
CREATE POLICY "admin_members_select" ON public.admin_members 
FOR SELECT TO authenticated 
USING (public.is_admin());

-- 4. Dynamically harden all existing `TO authenticated` policies
DO $$ 
DECLARE 
  pol RECORD;
  cmd text;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE 'authenticated' = ANY(roles) 
      AND schemaname = 'public'
      AND tablename != 'admin_members'
  LOOP
    -- Drop the existing policy
    EXECUTE format('DROP POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    
    -- Build new policy string
    cmd := format('CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR %s TO authenticated', 
                   pol.policyname, pol.schemaname, pol.tablename, pol.cmd);
                   
    IF pol.qual IS NOT NULL THEN
      cmd := cmd || format(' USING (public.is_admin() AND (%s))', pol.qual);
    ELSE
      cmd := cmd || ' USING (public.is_admin())';
    END IF;

    IF pol.with_check IS NOT NULL THEN
      cmd := cmd || format(' WITH CHECK (public.is_admin() AND (%s))', pol.with_check);
    ELSIF pol.cmd IN ('ALL', 'INSERT', 'UPDATE') THEN
      IF pol.qual IS NOT NULL THEN
        cmd := cmd || format(' WITH CHECK (public.is_admin() AND (%s))', pol.qual);
      ELSE
        cmd := cmd || ' WITH CHECK (public.is_admin())';
      END IF;
    END IF;

    EXECUTE cmd;
  END LOOP;
END $$;

-- 5. Add auth_user_id to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
DROP INDEX IF EXISTS idx_customers_auth_user_id;
CREATE UNIQUE INDEX idx_customers_auth_user_id ON public.customers(auth_user_id);

-- 6. Add specific policies for customers (additive to the hardened admin ones)
CREATE POLICY "customers_read_own" ON public.customers 
FOR SELECT TO authenticated 
USING (auth_user_id = auth.uid());

CREATE POLICY "customers_update_own" ON public.customers 
FOR UPDATE TO authenticated 
USING (auth_user_id = auth.uid()) 
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "orders_read_own" ON public.orders 
FOR SELECT TO authenticated 
USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));
