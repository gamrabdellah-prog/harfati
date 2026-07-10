'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, FileText, MessageSquare, Star, Briefcase, CheckCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
type Notif = Tables['notifications'];
const ICONS: Record<string, React.ElementType> = { contract: FileText, message: MessageSquare, review: Star, job: Briefcase };
const COLORS: Record<string, string> = { contract: 'bg-blue-500', message: 'bg-orange-500', review: 'bg-amber-500', job: 'bg-emerald-500', system: 'bg-gray-500' };
export default function NotificationsPage() {
  const { user, loading: al } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  useEffect(() => { if (!al && !user) router.push('/auth'); }, [al, user, router]);
  useEffect(() => {
    if (!user) return;
    const fn = async () => { const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }); setNotifs(data || []); setLoading(false); };
    fn(); const id = setInterval(fn, 10000); return () => clearInterval(id);
  }, [user]);
  const markRead = async (id: string) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n)); };
  const markAll = async () => { if (!user) return; setMarkingAll(true); const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false); setMarkingAll(false); if (error) toast.error('فشل'); else { setNotifs(p => p.map(n => ({ ...n, is_read: true }))); toast.success('تم'); } };
  if (al) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!user) return null;
  const unread = notifs.filter(n => !n.is_read).length;
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="bg-white border-b"><div className="max-w-2xl mx-auto px-4 py-10 flex items-center justify-between"><div><span className="section-tag mb-4">الإشعارات</span><div className="flex items-center gap-3 mt-3"><h1 className="text-4xl font-black">الإشعارات</h1>{unread > 0 && <Badge className="bg-orange-500 text-white text-sm px-3 rounded-full">{unread} جديد</Badge>}</div></div>{unread > 0 && <Button variant="outline" size="sm" onClick={markAll} disabled={markingAll} className="gap-1.5 rounded-2xl">{markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}تحديد الكل</Button>}</div></div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (<div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}</div>)
        : notifs.length === 0 ? (<div className="text-center py-28 text-muted-foreground"><Bell className="h-20 w-20 mx-auto mb-5 opacity-10" /><h3 className="text-2xl font-black mb-3">لا توجد إشعارات</h3></div>)
        : (<div className="space-y-2">
            {notifs.map(n => {
              const Icon = ICONS[n.type] || Bell; const iconBg = COLORS[n.type] || 'bg-gray-500';
              return (<Link key={n.id} href={n.link || ({ contract: '/contracts', message: '/messages', review: '/dashboard', job: '/jobs' } as Record<string, string>)[n.type] || '/'} onClick={() => !n.is_read && markRead(n.id)}
                className={cn('flex items-start gap-4 p-5 rounded-3xl border transition-all hover:shadow-card cursor-pointer', !n.is_read ? 'bg-orange-50/80 border-orange-100' : 'bg-white border-border hover:bg-muted/20')}>
                <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm', iconBg)}><Icon className="h-5 w-5 text-white" /></div>
                <div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><p className={cn('text-sm font-bold leading-snug', !n.is_read ? 'text-foreground' : 'text-foreground/70')}>{n.title}</p>{!n.is_read && <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0 mt-1 animate-pulse" />}</div>{n.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.content}</p>}<p className="text-[11px] text-muted-foreground/50 mt-2">{new Date(n.created_at).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div>
              </Link>);
            })}
          </div>)}
      </div>
    </div>
  );
}
