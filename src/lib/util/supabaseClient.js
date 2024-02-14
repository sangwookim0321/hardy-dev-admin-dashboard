import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.SUPABASE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export default supabase
