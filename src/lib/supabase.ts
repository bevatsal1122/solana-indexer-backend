import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Database } from './database.types';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase; 