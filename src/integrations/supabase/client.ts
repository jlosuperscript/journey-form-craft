// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cxjfnurujjkmbkioqcdx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4amZudXJ1amprbWJraW9xY2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTIxNzYsImV4cCI6MjA2MDM4ODE3Nn0.ADoTbyhutXduUoBs-5AyWJvAe6kt-4jnRIC6jE8P_uY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);