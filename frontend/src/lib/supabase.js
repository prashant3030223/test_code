import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase credentials. Auth might not work.");
}

console.log("Supabase Client Initializing with URL:", supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
