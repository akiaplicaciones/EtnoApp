import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
  {
    auth: {
      persistSession: false, //antes todo esto estaba en true, pero se pone en false para manejar la local session y no supabase
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);