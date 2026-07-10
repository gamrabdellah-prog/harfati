'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase'; import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button'; import { Badge } from '@/components/ui/badge'; import { Skeleton } from '@/components/ui/skeleton';
import { Bell, FileText, MessageSquare, Star, Briefcase, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
const ICONS: Record<string, React.ElementType> = { contract: FileText, message: MessageSquare, review: Star, job: Briefcase };
export default function NotificationsPage() {
  const { user, loading: al } = useAuth(); const router = useRouter();
  const [notifications, setNotifications] = useState<Tables['notifications'][]>([]);
  const [loading, setLoading] = useState(true); const [markingAll, setMarkingAll] = useState(false);
  useEffect(() => { if (!al && !user) router.push('/auth'); }, [al, user, router]);
  useEffect(() => {
    if (!user) return;
    const fn = async () => { const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at',{ascending:false}); setNotifications(data||[]); setLoading(false); };
    fn(); const id = setInterval(fn, 10000); return () => clearInterval(id);
  }, [user]);
  const markRead = async (id: string) => { await supabase.from('notifications').update({is_read:true}).eq('id',id); setNotifications(prev => prev.map(n => n.id===id?{...n,is_read:true}:n)); };
  const markAll = async () => {
    if (!user) return; setMarkingAll(true);
    const { error } = await supabase.from('notifications').update({is_read:true}).eq('user_id',user.id).eq('is_read',false);
    setMarkingAll(false);
    if (error) toast.error('فشل التحديث');
    else { setNotifications(prev => prev.map(n => ({...n,is_read:true}))); toast.success('تم تحديد جميع الإشعارات كمقروءة'); }
  };
  const getLink = (n: Tables['notifications']) => n.link || ({contract:'/contracts',message:'/messages',review:'/dashboard',job:'/jobs'} as Record<string,string>)[n.type] || '/';
  if (al) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;
  const unread = notifications.filter(n => !n.is_read).length;
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">الإشعارات</h1>{unread>0&&<Badge>{unread} جديد</Badge>}</div>
        {unread>0&&<Button variant="outline" size="sm" onClick={markAll} disabled={markingAll}>{markingAll?<Loader2 className="h-4 w-4 animate-spin" />:<Check className="h-4 w-4 ml-1.5" />}تحديد الكل كمقروء</Button>}
      </div>
      {loading ? <div className="space-y-3">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      : notifications.length===0 ? <div className="text-center py-20 text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="text-lg">لا توجد إشعارات</p></div>
      : <div className="space-y-2">{notifications.map(n => {
        const Icon = ICONS[n.type]||Bell;
        return (
          <Link key={n.id} href={getLink(n)} onClick={() => !n.is_read && markRead(n.id)} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors hover:bg-muted/50 ${!n.is_read?'bg-primary/5 border-primary/20':'bg-white border-border'}`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${!n.is_read?'bg-primary text-white':'bg-muted text-muted-foreground'}`}><Icon className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2"><p className={`text-sm font-medium ${!n.is_read?'text-foreground':'text-muted-foreground'}`}>{n.title}</p>{!n.is_read&&<span className="h-2 w-2 rounded-full bg-primary shrink-0" />}</div>
              {n.content&&<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.content}</p>}
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}</p>
            </div>
          </Link>
        );
      })}</div>}
    </div>
  );
}
