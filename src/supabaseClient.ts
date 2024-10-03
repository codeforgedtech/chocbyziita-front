import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ocvucsxitvcbsuqjoeqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdnVjc3hpdHZjYnN1cWpvZXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNjI3ODgsImV4cCI6MjA0MjkzODc4OH0.82mvqXDwktC_BklYohxmiRObSicq01jvw_JsRSkx0dE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);