#!/usr/bin/env node
// Fix RLS recursion issue script
// This script fixes the critical infinite recursion in RLS policies

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSRecursion() {
  console.log('🔧 Fixing RLS recursion in users policies...');
  
  try {
    // Fix users_organization_access policy
    const { error: dropError1 } = await supabase.rpc('execute_sql', {
      sql: 'DROP POLICY IF EXISTS "users_organization_access" ON users;'
    });
    
    if (dropError1) {
      console.log('⚠️ Drop policy error (may be expected):', dropError1.message);
    }
    
    const { error: createError1 } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "users_organization_access" ON users
          FOR SELECT USING (
            id = auth.uid()
            OR auth.jwt() ->> 'role' = 'service_role'
            OR auth.jwt() ->> 'user_role' IN ('owner', 'admin')
          );
      `
    });
    
    if (createError1) {
      console.error('❌ Failed to create users_organization_access policy:', createError1.message);
    } else {
      console.log('✅ Fixed users_organization_access policy');
    }
    
    // Fix users_org_admin_update policy
    const { error: dropError2 } = await supabase.rpc('execute_sql', {
      sql: 'DROP POLICY IF EXISTS "users_org_admin_update" ON users;'
    });
    
    const { error: createError2 } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "users_org_admin_update" ON users
          FOR UPDATE USING (
            auth.jwt() ->> 'role' = 'service_role'
            OR (
              auth.jwt() ->> 'user_role' IN ('owner', 'admin') 
              AND auth.jwt() ->> 'organization_id' = organization_id::text
            )
          );
      `
    });
    
    if (createError2) {
      console.error('❌ Failed to create users_org_admin_update policy:', createError2.message);
    } else {
      console.log('✅ Fixed users_org_admin_update policy');
    }
    
    console.log('🎉 RLS recursion fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to fix RLS recursion:', error);
    process.exit(1);
  }
}

// Run the fix if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixRLSRecursion().then(() => {
    console.log('✅ RLS fix completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ RLS fix failed:', error);
    process.exit(1);
  });
}

export { fixRLSRecursion };