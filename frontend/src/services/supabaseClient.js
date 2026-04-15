import { createClient } from '@supabase/supabase-js';

// Grab the environment variables from your Vite .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fpqdrkcslzvpqbancmql.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcWRya2NzbHp2cHFiYW5jbXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzQ1NzQsImV4cCI6MjA4ODA1MDU3NH0.roV9JD1rqj-db7ot-kpB4zJfaZkRqnE0FpUvt1JyqNI';

// IMPORTANT: This 'export const supabase' is exactly what Login.jsx is looking for!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);