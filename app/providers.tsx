'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
type Profile = Tables['profiles'];
interface AuthCtx { user: User|null; profile: Profile|null; loading: boolean; signIn:(e:string,p:string)=>Promise<{error:AuthError|null}>; signUp:(e:string,p:string,r:'worker'|'employer',n:string)=>Promise<{error:AuthError|null}>; signOut:()=>Promise<void>; refreshProfile:()=>Promise<void>; }
const AuthContext = createContext<AuthCtx|null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User|null>(null);
  const [profile, setProfile] = useState<Profile|null>(null);
  const [loading, setLoading] = useState(true);
  const fetchProfile = useCallback(async (uid: string) => { const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle(); setProfile(data??null); }, []);
  const refreshProfile = useCallback(async () => { if (user) await fetchProfile(user.id); }, [user, fetchProfile]);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => { if (!mounted) return; setUser(session?.user??null); if (session?.user) fetchProfile(session.user.id).finally(() => { if (mounted) setLoading(false); }); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { if (!mounted) return; setUser(s?.user??null); if (s?.user) fetchProfile(s.user.id); else setProfile(null); });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);
  const signIn = async (email: string, password: string) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); return { error }; };
  const signUp = async (email: string, password: string, role: 'worker'|'employer', fullName: string) => { const { data, error } = await supabase.auth.signUp({ email, password }); if (!error && data.user) await supabase.from('profiles').upsert({ id: data.user.id, role, full_name: fullName, skills: [], certificates_urls: [], availability: 'available', avg_rating: 0, review_count: 0 }); return { error }; };
  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); };
  return <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be inside AuthProvider'); return ctx; }
