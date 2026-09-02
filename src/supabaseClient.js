import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://xlhbctulwbbhsuoigsvj.supabase.co';
const supabaseAnonKey = 'sb_publishable_8ZodWO1hQRAgcV2OWPUpsw_cG4-nv8i';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
