import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bnvcvgsmexounbbornyh.supabase.co'
const SUPABASE_KEY = 'sb_publishable_qUwnw7DYXLqF4nZVa9PPZg_QBO-oScg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)