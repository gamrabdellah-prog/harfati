import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let _client: SupabaseClient | null = null;
function get(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zxbmcylkudvcstewudhk.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Ym1jeWxrdWR2Y3N0ZXd1ZGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1ODAxMTMsImV4cCI6MjA5ODE1NjExM30.JWZxsYnfU_Rr46mrTfRgBSAqsvNjln48i6Y0NyiNShg';
  _client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return _client;
}
export const supabase = new Proxy({} as SupabaseClient, { get(_t, p) { return Reflect.get(get(), p); } });
export type Tables = {
  profiles: { id: string; role: 'worker'|'employer'; full_name: string|null; phone: string|null; bio: string|null; avatar_url: string|null; wilaya_id: number|null; address: string|null; specialty: string|null; hourly_rate: number|null; skills: string[]; availability: 'available'|'busy'|'unavailable'; years_experience: number|null; company_name: string|null; facebook_url: string|null; instagram_url: string|null; linkedin_url: string|null; identity_doc_url: string|null; certificates_urls: string[]; cv_url: string|null; avg_rating: number; review_count: number; created_at: string; updated_at: string; };
  wilayas: { id: number; name: string; code: number };
  jobs: { id: string; employer_id: string; title: string; description: string; budget: number|null; wilaya_id: number|null; specialty: string|null; status: 'open'|'in_progress'|'completed'|'cancelled'; assigned_worker_id: string|null; created_at: string; updated_at: string; };
  contracts: { id: string; employer_id: string; worker_id: string; job_id: string|null; title: string; description: string|null; amount: number; status: 'pending'|'accepted'|'rejected'|'completed'|'cancelled'; start_date: string|null; end_date: string|null; terms: string|null; created_at: string; updated_at: string; };
  messages: { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string; };
  reviews: { id: string; reviewer_id: string; reviewed_id: string; job_id: string|null; contract_id: string|null; rating: number; comment: string|null; created_at: string; };
  notifications: { id: string; user_id: string; type: 'contract'|'message'|'review'|'job'|'system'; title: string; content: string|null; is_read: boolean; link: string|null; related_id: string|null; created_at: string; };
};
