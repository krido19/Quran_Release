import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eyofomyeewyoiwcmcjjt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5b2ZvbXllZXd5b2l3Y21jamp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MTE4ODAsImV4cCI6MjA4MDI4Nzg4MH0.GJ8m6nB5o9SwXg9SoRjlmWgpGNL4hI-RXbNu4Oso2ls';
// "kidtoiba49@gmail.com supabase nya al quran release"
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
