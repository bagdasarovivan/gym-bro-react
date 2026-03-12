import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://bnvcvgsmexounbbornyh.supabase.co'
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_qUwnw7DYXLqF4nZVa9PPZg_QBO-oScg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
