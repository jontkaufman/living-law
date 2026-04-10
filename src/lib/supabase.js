import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://msgvoboqmegpuioqgscp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zZ3ZvYm9xbWVncHVpb3Fnc2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzYyMTcsImV4cCI6MjA5MTM1MjIxN30.X0RJ-2kKxPxN1iZIumyr3w4QIMMvG9tJNISKleUvnHo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
