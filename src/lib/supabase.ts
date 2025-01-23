import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mivslglanxzpcyhkzspc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdnNsZ2xhbnh6cGN5aGt6c3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NTgxMDAsImV4cCI6MjA1MjMzNDEwMH0.cF-ycL3aX2d5sd6VQF8MDdM_lZ4T3JSXOMLTyqQEPDo';

export const supabase = createClient(supabaseUrl, supabaseKey);