import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

supabase
  .from('projects')
  .select('*')
  .then(({ data, error }) => {
    console.log('Supabase projects:', data)
    console.log('Supabase error:', error)
  })