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
const ICONS:Record<string,React.ElementType>={contract:FileText,message:MessageSquare,review:Star,job:Briefcase};
const COLORS:Record<string,string>={contract:'bg-blue-500',message:'bg-orange-500',review:'bg-amber-500',job:'bg-emerald-500',system:'bg-gray-500'};

export default function NotificationsPage() {
  const {user,loading:al}=useAuth(); const router=useRouter();
  const [notifs,setNotifs]=useState<Notif[]>([]);
  const [loading,setLoading]=useState(true);
  const [markingAll,setMarkingAll]=useState(false);
  useEffect(()=>{if(!al&&!user)router.push('/auth');},[al,user,router]);
  useEffect(()=>{
    if(!user)return;
    const fn=async()=>{const {data}=await supabase.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false});setNotifs(data||[]);setLoading(false);};
    fn(); const id=setInterval(fn,10000); return()=>clearInterval(id);
  },[user]);
  const markRead=async(id:string)=>{await supabase.from('notifications').update({is_read:true}).eq('id',id);setNotifs(p=>p.map(n=>n.id===id?{...n,is_read:true}:n));};
  const markAll=async()=>{if(!user)return;setMarkingAll(true);const {error}=await supabase.from('notifications').update({is_read:true}).eq('user_id',user.id).eq('is_read',false);setMarkingAll(false);if(error)toast.error('فشل');else{setNotifs(p=>p.map(n=>({...n,is_read:true})));toast.success('تم تحديد الكل كمقروء');}};
  const getLink=(n:Notif)=>n.link||({contract:'/contracts',message:'/messages',review:'/dashboard',job:'/jobs'} as Record<string,string>)[n.type]||'/';
  if(al)return<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500"/></div>;
  if(!user)return null;
  const unread=notifs.filter(n=>!n.is_read).length;

  return(
    <div className="min-h-screen bg-muted/20">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 max-w-2xl py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black">الإشعارات</h1>
            {unread>0&&<Badge className="bg-orange-500 text-white">{unread} جديد</Badge>}
          </div>
          {unread>0&&<Button variant="outline" size="sm" onClick={markAll} disabled={markingAll} className="gap-1.5">{markingAll?<Loader2 className="h-4 w-4 animate-spin"/>:<CheckCheck className="h-4 w-4"/>}تحديد الكل</Button>}
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-2xl py-8">
        {loading?(
          <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-20 w-full rounded-2xl"/>)}</div>
        ):notifs.length===0?(
          <div className="text-center py-24 text-muted-foreground"><Bell className="h-16 w-16 mx-auto mb-4 opacity-20"/><h3 className="text-xl font-bold mb-2">لا توجد إشعارات</h3><p className="text-sm">ستظهر هنا إشعاراتك عند وصولها</p></div>
        ):(
          <div className="space-y-2">
            {notifs.map(n=>{
              const Icon=ICONS[n.type]||Bell;
              const iconBg=COLORS[n.type]||'bg-gray-500';
              return(
                <Link key={n.id} href={getLink(n)} onClick={()=>!n.is_read&&markRead(n.id)}
                  className={cn('flex items-start gap-4 p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer',
                    !n.is_read?'bg-orange-50/80 border-orange-100 hover:bg-orange-50':'bg-white border-border hover:bg-muted/20')}>
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm',iconBg)}>
                    <Icon className="h-4 w-4 text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-semibold leading-snug',!n.is_read?'text-foreground':'text-muted-foreground')}>{n.title}</p>
                      {!n.is_read&&<span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0 mt-1 animate-pulse"/>}
                    </div>
                    {n.content&&<p className="text-xs text-muted-foreground mt-1 line-clamp-1">{n.content}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-1.5">{new Date(n.created_at).toLocaleDateString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
