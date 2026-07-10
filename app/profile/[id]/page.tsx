'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Star, MessageSquare, Phone, ExternalLink, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
type Review = Tables['reviews'] & { reviewer: Tables['profiles']|null };

export default function ProfilePage() {
  const {id}=useParams<{id:string}>(); const {user}=useAuth(); const router=useRouter();
  const [profile,setProfile]=useState<Tables['profiles']|null>(null);
  const [reviews,setReviews]=useState<Review[]>([]);
  const [wilayas,setWilayas]=useState<Tables['wilayas'][]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!id)return;
    (async()=>{
      const [{data:p},{data:r},{data:w}]=await Promise.all([supabase.from('profiles').select('*').eq('id',id).maybeSingle(),supabase.from('reviews').select('*,reviewer:profiles!reviews_reviewer_id_fkey(*)').eq('reviewed_id',id).order('created_at',{ascending:false}),supabase.from('wilayas').select('*').order('id')]);
      setProfile(p??null); setReviews((r as Review[])||[]); setWilayas(w||[]); setLoading(false);
    })();
  },[id]);

  if(loading)return<div className="container mx-auto px-4 py-10 max-w-3xl space-y-4"><div className="flex items-center gap-4"><Skeleton className="h-24 w-24 rounded-full"/><div className="space-y-2"><Skeleton className="h-7 w-48"/><Skeleton className="h-4 w-32"/></div></div><Skeleton className="h-40 w-full"/></div>;
  if(!profile)return<div className="container mx-auto px-4 py-24 text-center"><p className="text-muted-foreground mb-4">المستخدم غير موجود</p><Button variant="outline" onClick={()=>router.push('/')}>الرئيسية</Button></div>;

  const isMe=user?.id===profile.id; const isWorker=profile.role==='worker';
  const wName=wilayas.find(w=>w.id===profile.wilaya_id)?.name||'الجزائر';
  const availMap:Record<string,{label:string;cls:string}>={available:{label:'متاح',cls:'badge-available'},busy:{label:'مشغول',cls:'badge-busy'},unavailable:{label:'غير متاح',cls:'badge-unavailable'}};
  const avail=availMap[profile.availability]||availMap.unavailable;

  return(
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 max-w-3xl py-8">
        {/* Profile hero */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 relative">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}/>
          </div>
          <div className="px-8 pb-8 -mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-3xl">{profile.full_name?.charAt(0)||'?'}</AvatarFallback>
              </Avatar>
              <div className="flex gap-2 pb-1">
                {!isMe&&user&&<Button variant="premium" size="sm" className="gap-2" asChild><Link href={`/messages?user=${profile.id}`}><MessageSquare className="h-4 w-4"/>مراسلة</Link></Button>}
                {isMe&&<Button variant="outline" size="sm" asChild><Link href="/dashboard">✏️ تعديل الملف</Link></Button>}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl font-black">{profile.full_name||'مستخدم'}</h1>
                <span className={cn('text-xs px-2.5 py-1 rounded-full border font-semibold',avail.cls)}>{avail.label}</span>
              </div>
              <p className="text-muted-foreground mb-4">{isWorker?(profile.specialty||'حرفي'):(profile.company_name||'صاحب عمل')}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4 text-orange-400"/>{wName}</span>
                {profile.avg_rating>0&&<span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-amber-400 fill-amber-400"/><span className="font-bold">{profile.avg_rating.toFixed(1)}</span><span className="text-muted-foreground">({profile.review_count})</span></span>}
                {profile.phone&&<span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-4 w-4 text-orange-400"/>{profile.phone}</span>}
              </div>
              {profile.bio&&<p className="mt-4 text-muted-foreground leading-relaxed bg-muted/40 rounded-xl p-4">{profile.bio}</p>}
              {(profile.facebook_url||profile.instagram_url||profile.linkedin_url)&&(
                <div className="flex gap-3 mt-4">
                  {profile.facebook_url&&<a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-orange-600 flex items-center gap-1 transition-colors"><ExternalLink className="h-3.5 w-3.5"/>فيسبوك</a>}
                  {profile.instagram_url&&<a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-orange-600 flex items-center gap-1 transition-colors"><ExternalLink className="h-3.5 w-3.5"/>إنستغرام</a>}
                  {profile.linkedin_url&&<a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-orange-600 flex items-center gap-1 transition-colors"><ExternalLink className="h-3.5 w-3.5"/>لينكدإن</a>}
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="mb-5">
            <TabsTrigger value="info">المعلومات</TabsTrigger>
            <TabsTrigger value="reviews">التقييمات ({reviews.length})</TabsTrigger>
            {isWorker&&<TabsTrigger value="skills">المهارات</TabsTrigger>}
          </TabsList>
          <TabsContent value="info">
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              {isWorker?(
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-orange-50 rounded-xl p-5 text-center"><p className="text-xs text-orange-500 font-medium mb-2">الأجر بالساعة</p><p className="text-2xl font-black text-orange-700">{profile.hourly_rate?`${profile.hourly_rate.toLocaleString()} دج`:'—'}</p></div>
                  <div className="bg-blue-50 rounded-xl p-5 text-center"><p className="text-xs text-blue-500 font-medium mb-2">سنوات الخبرة</p><p className="text-2xl font-black text-blue-700">{profile.years_experience?`${profile.years_experience} سنة`:'—'}</p></div>
                </div>
              ):(
                <div><p className="text-xs text-muted-foreground mb-1 font-medium">اسم المؤسسة</p><p className="font-bold text-lg">{profile.company_name||'غير محدد'}</p></div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="reviews">
            {reviews.length===0?(
              <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border shadow-sm"><Star className="h-12 w-12 mx-auto mb-3 opacity-20"/><p className="font-medium">لا توجد تقييمات بعد</p></div>
            ):(
              <div className="space-y-4">
                {reviews.map(r=>(
                  <div key={r.id} className="bg-white rounded-2xl border shadow-sm p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10"><AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold">{r.reviewer?.full_name?.charAt(0)||'?'}</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2"><p className="font-bold">{r.reviewer?.full_name||'مستخدم'}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ar-DZ')}</p></div>
                        <div className="flex gap-0.5 mb-3">{Array.from({length:5}).map((_,i)=><Star key={i} className={cn('h-4 w-4',i<r.rating?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200')}/>)}</div>
                        {r.comment&&<p className="text-sm text-muted-foreground bg-muted/40 rounded-xl p-3 leading-relaxed">{r.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          {isWorker&&(
            <TabsContent value="skills">
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                {profile.skills?.length>0?(
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(s=><span key={s} className="flex items-center gap-1.5 text-sm bg-orange-50 text-orange-700 border border-orange-100 px-4 py-2 rounded-xl font-medium"><Award className="h-3.5 w-3.5"/>{s}</span>)}
                  </div>
                ):<p className="text-muted-foreground text-center py-8">لا توجد مهارات مسجلة</p>}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
