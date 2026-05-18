import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from './mockSupabase'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function createRealClient() {
  const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan las variables de entorno de Supabase. Revisa el archivo .env')
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = USE_MOCK
  ? (createMockSupabaseClient() as unknown as ReturnType<typeof createClient>)
  : createRealClient()
