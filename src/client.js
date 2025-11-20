import { createClient } from '@supabase/supabase-js'

const URL = 'https://kbxectkuovvgjtuzhgoo.supabase.co'
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieGVjdGt1b3Z2Z2p0dXpoZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTc0NTMsImV4cCI6MjA3ODkzMzQ1M30.1x2D7nuS42FzCZnDVcnRff9-ltCEcBG6-MZPmBp9PXQ'

export const supabase = createClient(URL, API_KEY)