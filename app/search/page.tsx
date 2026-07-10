'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { ALL_SPECIALTIES, SPECIALTY_CATEGORIES } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, Briefcase, Wrench, SlidersHorizontal, X, Users } from 'lucide-react';
import { Button as Btn } from '@/components/ui/button';

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };
const availCfg: Record<string, { label: string; color: string }> = {
  available: { label: 'متاح', color: 'bg-green-100 text-green-700' },
  busy: { label: 'مشغول', color: 'bg-amber-100 text-amber-700' },
  unavailable: { label: 'غير متاح', color: 'bg-red-100 text-red-600' },
};

export default function SearchPage() {
  const sp = useSearchParams();
  const [workers, setWorkers] = useState<Worker[]>([]); const [jobs, setJobs] = useState<Job[]>([]); const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true); const [tab, setTab] = useState<'workers'|'jobs'>('workers');
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(sp.get('q')||''); const [wilaya, setWilaya] = useState(sp.get('wilaya')||'');
  const [specialty, setSpecialty] = useState(sp.get('specialty')||''); const [avail, setAvail] = useState('');
  const [minRating, setMinRating] = useState(''); const [maxRate, setMaxRate] = useState(''); const [minExp, setMinExp] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const fetch = useCallback(async () => {
    setLoading(true);
    let wq = supabase.from('profiles').select('*').eq('role','worker');
    let jq = supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status','open');
    if (query) { wq = wq.or(`full_name.ilike.%${query}%,specialty.ilike.%${query}%,bio.ilike.%${query}%`); jq = jq.or(`title.ilike.%${query}%,specialty.ilike.%${query}%,description.ilike.%${query}%`); }
    if (wilaya) { wq = wq.eq('wilaya_id', wilaya); jq = jq.eq('wilaya_id', wilaya); }
    if (specialty) { wq = wq.eq('specialty', specialty); jq = jq.eq('specialty', specialty); }
    if (avail) wq = wq.eq('availability', avail);
    if (minRating) wq = wq.gte('avg_rating', parseFloat(minRating));
    if (maxRate) wq = wq.lte('hourly_rate', parseFloat(maxRate));
    if (minExp) wq = wq.gte('years_experience', parseInt(minExp));
    if (sortBy==='rating') wq = wq.order('avg_rating',{ascending:false});
    else if (sortBy==='rate_asc') wq = wq.order('hourly_rate',{ascending:true});
    else if (sortBy==='rate_desc') wq = wq.order('hourly_rate',{ascending:false});
    else if (sortBy==='experience') wq = wq.order('years_experience',{ascending:false});
    const [{ data: w }, { data: j }, { data: wil }] = await Promise.all([wq, jq.order('created_at',{ascending:false}), supabase.from('wilayas').select('*').order('id')]);
    setWorkers(w||[]); setJobs((j as Job[])||[]); setWilayas(wil||[]); setLoading(false);
  }, [query, wilaya, specialty, avail, minRating, maxRate, minExp, sortBy]);

  useEffect(() => { fetch(); }, [fetch]);

  const clear = () => { setQuery(''); setWilaya(''); setSpecialty(''); setAvail(''); setMinRating(''); setMaxRate(''); setMinExp(''); setSortBy('rating'); };
  const wName = (id: number | null) => wilayas.find(w => w.id === id)?.name || 'الجزائر';
  const hasFilters = query || wilaya || specialty || avail || minRating || maxRate || minExp;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="bg-white border-b py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث عن حرفي أو وظيفة..." className="pr-9" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && fetch()} />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">فلاتر</span>{hasFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
            </Button>
            <Button onClick={fetch}>بحث</Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={wilaya} onChange={e => setWilaya(e.target.value)}>
                <option value="">كل الولايات</option>{wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={specialty} onChange={e => setSpecialty(e.target.value)}>
                <option value="">كل التخصصات</option>{ALL_SPECIALTIES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={avail} onChange={e => setAvail(e.target.value)}>
                <option value="">كل الحالات</option><option value="available">متاح</option><option value="busy">مشغول</option><option value="unavailable">غير متاح</option>
              </select>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="rating">الأعلى تقييماً</option><option value="rate_asc">السعر: من الأقل</option><option value="rate_desc">السعر: من الأعلى</option><option value="experience">الأكثر خبرة</option>
              </select>
              <Input type="number" placeholder="تقييم أدنى (1-5)" value={minRating} onChange={e => setMinRating(e.target.value)} min="1" max="5" />
              <Input type="number" placeholder="سعر أقصى (دج/س)" value={maxRate} onChange={e => setMaxRate(e.target.value)} />
              <Input type="number" placeholder="خبرة أدنى (سنوات)" value={minExp} onChange={e => setMinExp(e.target.value)} />
              {hasFilters && <Button variant="ghost" onClick={clear} className="flex items-center gap-2 text-muted-foreground"><X className="h-4 w-4" />مسح الفلاتر</Button>}
            </div>
          )}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {SPECIALTY_CATEGORIES.slice(0,4).map(cat => cat.specialties.slice(0,3).map(s => (
              <button key={s.label} onClick={() => setSpecialty(specialty===s.label?'':s.label)} className={`flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${specialty===s.label?'bg-primary text-white border-primary':'border-border hover:border-primary/50 bg-white'}`}>
                <span>{s.icon}</span>{s.label}
              </button>
            )))}
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setTab('workers')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab==='workers'?'bg-primary text-white':'bg-white border hover:bg-muted'}`}>
            <Users className="h-4 w-4" />الحرفيون ({workers.length})
          </button>
          <button onClick={() => setTab('jobs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab==='jobs'?'bg-primary text-white':'bg-white border hover:bg-muted'}`}>
            <Briefcase className="h-4 w-4" />الوظائف ({jobs.length})
          </button>
        </div>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i) => <div key={i} className="rounded-xl border bg-white p-5 space-y-3"><div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div><Skeleton className="h-3 w-full" /></div>)}</div>
        : <>
          {tab==='workers' && (workers.length===0 ? <div className="text-center py-20 text-muted-foreground"><Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="text-lg">لا يوجد حرفيون مطابقون للبحث</p>{hasFilters && <Button variant="outline" onClick={clear} className="mt-4">مسح الفلاتر</Button>}</div>
            : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{workers.map(w => {
              const a = availCfg[w.availability]||availCfg.unavailable;
              return <Link key={w.id} href={`/profile/${w.id}`}><Card className="card-hover h-full cursor-pointer bg-white"><CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative"><Avatar className="h-12 w-12"><AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{w.full_name?.charAt(0)||'؟'}</AvatarFallback></Avatar>{w.availability==='available'&&<span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />}</div>
                  <div className="flex-1 min-w-0"><h3 className="font-semibold truncate">{w.full_name||'حرفي'}</h3><p className="text-sm text-muted-foreground">{w.specialty||'عامل عام'}</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${a.color}`}>{a.label}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 mb-2">{Array.from({length:5}).map((_,i) => <Star key={i} className={`h-3.5 w-3.5 ${i<Math.round(w.avg_rating)?'fill-current':'fill-none'}`} />)}<span className="text-xs text-muted-foreground mr-1">{w.avg_rating>0?w.avg_rating.toFixed(1):'جديد'}{w.review_count>0&&` (${w.review_count})`}</span></div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{wName(w.wilaya_id)}</span>{w.years_experience&&<span>{w.years_experience} سنة خبرة</span>}{w.hourly_rate&&<span className="font-medium text-primary mr-auto">{w.hourly_rate.toLocaleString()} دج/س</span>}</div>
                {w.skills&&w.skills.length>0&&<div className="flex flex-wrap gap-1 mt-3">{w.skills.slice(0,3).map(s=><span key={s} className="text-xs bg-muted px-2 py-0.5 rounded-full">{s}</span>)}{w.skills.length>3&&<span className="text-xs text-muted-foreground">+{w.skills.length-3}</span>}</div>}
              </CardContent></Card></Link>;
            })}</div>
          )}
          {tab==='jobs' && (jobs.length===0 ? <div className="text-center py-20 text-muted-foreground"><Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="text-lg">لا توجد وظائف مطابقة للبحث</p></div>
            : <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{jobs.map(j => (
              <Link key={j.id} href={`/jobs/${j.id}`}><Card className="card-hover h-full cursor-pointer bg-white"><CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2"><h3 className="font-semibold">{j.title}</h3>{j.budget&&<span className="text-primary font-bold text-sm shrink-0">{j.budget.toLocaleString()} دج</span>}</div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{j.description}</p>
                <div className="flex flex-wrap gap-2"><Badge variant="outline" className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{wName(j.wilaya_id)}</Badge>{j.specialty&&<Badge variant="secondary" className="text-xs">{j.specialty}</Badge>}{j.employer&&<span className="text-xs text-muted-foreground mr-auto">{j.employer.full_name}</span>}</div>
              </CardContent></Card></Link>
            ))}</div>
          )}
        </>}
      </div>
    </div>
  );
}
