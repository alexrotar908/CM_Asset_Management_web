import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mzdxtgydhrwnycojmhnc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16ZHh0Z3lkaHJ3bnljb2ptaG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzYxNzEsImV4cCI6MjA2ODkxMjE3MX0.3Ok3cylaaw8TR6XARmBYh0rHEQ9B-4uQCEDocnKNCPU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
