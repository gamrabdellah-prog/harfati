'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTIES } from '@/lib/specialties';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, Users, Briefcase, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles']|null };

export default function SearchPage() {
  const sp = useSearchParams();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'workers'|'jobs'>('workers');
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(sp.get('q')||'');
  const [wilaya, setWilaya] = useState(sp.get('wilaya')||'');
  const [specialty, setSpecialty] = useState(sp.get('specialty')||'');
  const [avail, setAvail] = useState('');
  const [sort, setSort] = useState('rating');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    let wq = supabase.from('profiles').select('*').eq('role','worker');
    let jq = supabase.from('jobs').select('*,employer:profiles!jobs_employer_id_fkey(*)').eq('status','open');
    if (q) { wq = wq.or(`full_name.ilike.%${q}%,specialty.ilike.%${q}%,bio.ilike.%${q}%`); jq = jq.or(`title.ilike.%${q}%,description.ilike.%${q}%`); }
    if (wilaya) { wq = wq.eq('wilaya_id', wilaya); jq = jq.eq('wilaya_id', wilaya); }
    if (specialty) { wq = wq.eq('specialty', specialty); jq = jq.eq('specialty', specialty); }
    if (avail) wq = wq.eq('availability', avail);
    if (sort === 'rating') wq = wq.order('avg_rating',{ascending:false});
    else if (sort === 'rate_asc') wq = wq.order('hourly_rate',{ascending:true});
    else if (sort === 'rate_desc') wq = wq.order('hourly_rate',{ascending:false});
    const [{ data: w }, { data: j }, { data: wil }] = await Promise.all([wq, jq.order('created_at',{ascending:false}), supabase.from('wilayas').select('*').order('id')]);
    setWorkers(w||[]); setJobs((j as Job[])||[]); setWilayas(wil||[]); setLoading(false);
  }, [q, wilaya, specialty, avail, sort]);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  const clear = () => { setQ(''); setWilaya(''); setSpecialty(''); setAvail(''); setSort('rating'); };
  const hasFilters = q||wilaya||specialty||avail;
  const wName = (id: number|null) => wilayas.find(w=>w.id===id)?.name||'الجزائر';

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Search bar */}
      <div className="bg-white border-b sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl py-4">
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث عن حرفي، تخصص أو وظيفة..." className="pr-10" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&fetchResults()} />
            </div>
            <Button variant="outline" onClick={()=>setShowFilters(!showFilters)} className={cn('gap-2', hasFilters&&'border-orange-500 text-orange-600')}>
              <SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">فلاتر</span>
              {hasFilters&&<span className="h-2 w-2 rounded-full bg-orange-500"/>}
            </Button>
            <Button variant="premium" onClick={fetchResults}>بحث</Button>
          </div>
          {showFilters&&(
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
              {[
                <select key="wil" className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={wilaya} onChange={e=>setWilaya(e.target.value)}><option value="">كل الولايات</option>{wilayas.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>,
                <select key="spe" className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={specialty} onChange={e=>setSpecialty(e.target.value)}><option value="">كل التخصصات</option>{SPECIALTIES.map(s=><option key={s} value={s}>{s}</option>)}</select>,
                <select key="av" className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={avail} onChange={e=>setAvail(e.target.value)}><option value="">كل الحالات</option><option value="available">متاح</option><option value="busy">مشغول</option></select>,
                <select key="sort" className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={sort} onChange={e=>setSort(e.target.value)}><option value="rating">الأعلى تقييماً</option><option value="rate_asc">الأقل سعراً</option><option value="rate_desc">الأعلى سعراً</option></select>
              ]}
              {hasFilters&&<button onClick={clear} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors col-span-2 md:col-span-4 mt-1"><X className="h-3.5 w-3.5"/>مسح الفلاتر</button>}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Tab switcher */}
        <div className="flex gap-3 mb-8">
          {([['workers','الحرفيون',workers.length,Users],['jobs','الوظائف',jobs.length,Briefcase]] as [string,string,number,React.ElementType][]).map(([key,label,count,Icon])=>(
            <button key={key} onClick={()=>setTab(key as 'workers'|'jobs')}
              className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border',
                tab===key ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-white border-border text-muted-foreground hover:text-foreground hover:border-orange-200')}>
              <Icon className="h-4 w-4"/>{label}
              <span className={cn('px-1.5 py-0.5 rounded-lg text-xs font-bold', tab===key?'bg-white/20':'bg-muted')}>{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="rounded-2xl bg-white border p-5 space-y-3">
                <div className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-full"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4"/><Skeleton className="h-3 w-1/2"/></div></div>
                <Skeleton className="h-3 w-full"/><Skeleton className="h-3 w-2/3"/>
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab==='workers'&&(
              workers.length===0
                ? <div className="text-center py-20 text-muted-foreground"><Users className="h-14 w-14 mx-auto mb-4 opacity-20"/><p className="text-lg font-medium">لا يوجد حرفيون مطابقون</p>{hasFilters&&<Button variant="outline" onClick={clear} className="mt-4">مسح الفلاتر</Button>}</div>
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {workers.map(w=>(
                    <Link key={w.id} href={`/profile/${w.id}`} className="group">
                      <div className="card-premium card-glow rounded-2xl p-5 h-full bg-white">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="relative">
                            <Avatar className="h-14 w-14 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
                              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-xl">{w.full_name?.charAt(0)||'?'}</AvatarFallback>
                            </Avatar>
                            {w.availability==='available'&&<span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate group-hover:text-orange-600 transition-colors">{w.full_name||'حرفي'}</h3>
                            <p className="text-sm text-muted-foreground">{w.specialty||'عامل عام'}</p>
                          </div>
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold shrink-0', w.availability==='available'?'badge-available':'badge-busy')}>
                            {w.availability==='available'?'متاح':'مشغول'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-3">
                          {Array.from({length:5}).map((_,i)=><Star key={i} className={cn('h-4 w-4',i<Math.round(w.avg_rating)?'text-amber-400 fill-amber-400':'text-gray-200 fill-gray-200')}/>)}
                          <span className="text-sm text-muted-foreground mr-1">{w.avg_rating>0?w.avg_rating.toFixed(1):'جديد'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{wName(w.wilaya_id)}</span>
                          {w.hourly_rate&&<span className="mr-auto font-bold text-orange-600 text-sm">{w.hourly_rate.toLocaleString()} دج/س</span>}
                        </div>
                        {w.skills?.length>0&&<div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-dashed">{w.skills.slice(0,3).map(s=><span key={s} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg font-medium">{s}</span>)}{w.skills.length>3&&<span className="text-xs text-muted-foreground">+{w.skills.length-3}</span>}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
            )}
            {tab==='jobs'&&(
              jobs.length===0
                ? <div className="text-center py-20 text-muted-foreground"><Briefcase className="h-14 w-14 mx-auto mb-4 opacity-20"/><p className="text-lg font-medium">لا توجد وظائف مطابقة</p></div>
                : <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobs.map(j=>(
                    <Link key={j.id} href={`/jobs/${j.id}`} className="group">
                      <div className="card-premium card-glow rounded-2xl p-6 h-full bg-white">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-bold group-hover:text-orange-600 transition-colors">{j.title}</h3>
                          {j.budget&&<span className="shrink-0 text-orange-600 font-black bg-orange-50 px-3 py-1 rounded-xl text-sm border border-orange-100">{j.budget.toLocaleString()} دج</span>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{j.description}</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="secondary" className="text-xs gap-1"><MapPin className="h-3 w-3"/>{wName(j.wilaya_id)}</Badge>
                          {j.specialty&&<Badge variant="outline" className="text-xs">{j.specialty}</Badge>}
                          <span className="mr-auto text-xs text-muted-foreground">{j.employer?.full_name}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
