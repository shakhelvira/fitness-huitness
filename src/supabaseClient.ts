import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvksthobgvhosnfzovcq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2a3N0aG9iZ3Zob3NuZnpvdmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1MTgwMjAsImV4cCI6MjEwNTA5NDAyMH0.sbWjP9WkEagWemUB6jDPayQ36h_GLajLXuUEPOM6fFc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
