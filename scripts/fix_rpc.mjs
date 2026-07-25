import { createClient } from '@supabase/supabase-js';

const url = 'https://ebhjyczbjldqufvxoeqm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaGp5Y3piamxkcXVmdnhvZXFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDYyNjEyOSwiZXhwIjoyMDk2MjAyMTI5fQ.qrOoAwICTcrACdTthDboNsOW505ykDUIw5QvglVUxpM';
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function fix() {
  const { data: def, error: e1 } = await sb.rpc('query', { 
    sql: `
      SELECT pg_get_functiondef(p.oid)
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'update_delivery_order_status'
      AND n.nspname = 'public';
    `
  });
  console.log("OLD DEF:", def?.[0]?.pg_get_functiondef);

  const sql = `
    CREATE OR REPLACE FUNCTION public.update_delivery_order_status(
      p_assignment_id uuid,
      p_new_status text
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      v_order_id uuid;
    BEGIN
      -- Update the delivery assignment
      UPDATE public.delivery_assignments
      SET status = p_new_status::public.delivery_status,
          updated_at = now()
      WHERE id = p_assignment_id
      RETURNING order_id INTO v_order_id;
      
      IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
      END IF;

      -- Sync back to orders table
      UPDATE public.orders
      SET status = p_new_status,
          updated_at = now()
      WHERE id = v_order_id;
    END;
    $$;
  `;
  
  const { data, error } = await sb.rpc('query', { sql });
  if (error) console.error('Error applying fix:', error);
  else console.log('Successfully fixed function!');
}
fix();
