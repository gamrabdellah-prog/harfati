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
import { Search, MapPin, Star, Users, Briefcase, SlidersHorizontal, X, DollarSign, Clock } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };

export default function SearchPage() {
  const sp = useSearchParams();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'workers' | 'jobs'>('workers');
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(sp.get('q') || '');
  const [wilaya, setWilaya] = useState(sp.get('wilaya') || '');
  const [specialty, setSpecialty] = useState(sp.get('specialty') || '');
  const [avail, setAvail] = useState('');
  const [sort, setSort] = useState('rating');

  const fetch = useCallback(async () => {
    setLoading(true);
    let wq = supabase.from('profiles').select('*').eq('role', 'worker');
    let jq = supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status', 'open');
    if (q) { wq = wq.or(`full_name.ilike.%${q}%,specialty.ilike.%${q}%,bio.ilike.%${q}%`); jq = jq.or(`title.ilike.%${q}%,description.ilike.%${q}%`); }
    if (wilaya) { wq = wq.eq('wilaya_id', wilaya); jq = jq.eq('wilaya_id', wilaya); }
    if (specialty) { wq = wq.eq('specialty', specialty); jq = jq.eq('specialty', specialty); }
    if (avail) wq = wq.eq('availability', avail);
    if (sort === 'rating') wq = wq.order('avg_rating', { ascending: false });
    else if (sort === 'rate_asc') wq = wq.order('hourly_rate', { ascending: true });
    else if (sort === 'rate_desc') wq = wq.order('hourly_rate', { ascending: false });
    const [{ data: w }, { data: j }, { data: wil }] = await Promise.all([wq, jq.order('created_at', { ascending: false }), supabase.from('wilayas').select('*').order('id')]);
    setWorkers(w || []); setJobs((j as Job[]) || []); setWilayas(wil || []); setLoading(false);
  }, [q, wilaya, specialty, avail, sort]);

  useEffect(() => { fetch(); }, [fetch]);
  const clearFilters = () => { setQ(''); setWilaya(''); setSpecialty(''); setAvail(''); setSort('rating'); };
  const hasFilters = q || wilaya || specialty || avail;
  const wName = (id: number | null) => wilayas.find(w => w.id === id)?.name || 'الجزائر';

  const SelectBase = ({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
    <select
      className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm focus:outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/12 transition-all"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {children}
    </select>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Sticky search header */}
      <div className="bg-white/95 backdrop-blur border-b sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث عن حرفي، تخصص أو وظيفة..." className="pr-12 rounded-2xl" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetch()} />
            </div>
            <Button variant={hasFilters ? 'default' : 'outline'} onClick={() => setShowFilters(!showFilters)} className={cn('gap-2 rounded-2xl shrink-0', hasFilters && 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500')}>
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">فلاتر</span>
              {hasFilters && <span className="h-2 w-2 rounded-full bg-white/70" />}
            </Button>
            <Button variant="premium" onClick={fetch} className="rounded-2xl shrink-0">بحث</Button>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SelectBase value={wilaya} onChange={setWilaya}>
                  <option value="">كل الولايات</option>
                  {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </SelectBase>
                <SelectBase value={specialty} onChange={setSpecialty}>
                  <option value="">كل التخصصات</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </SelectBase>
                <SelectBase value={avail} onChange={setAvail}>
                  <option value="">كل الحالات</option>
                  <option value="available">متاح الآن</option>
                  <option value="busy">مشغول</option>
                </SelectBase>
                <SelectBase value={sort} onChange={setSort}>
                  <option value="rating">الأعلى تقييماً</option>
                  <option value="rate_asc">الأقل سعراً</option>
                  <option value="rate_desc">الأعلى سعراً</option>
                </SelectBase>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-orange-600 mt-3 transition-colors">
                  <X className="h-3.5 w-3.5" />مسح الفلاتر
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab switcher */}
        <div className="flex gap-3 mb-8">
          {([['workers', 'الحرفيون', workers.length, Users], ['jobs', 'الوظائف', jobs.length, Briefcase]] as const).map(([key, label, count, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn('flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-sm transition-all border',
                tab === key ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-orange' : 'bg-white border-border text-muted-foreground hover:text-foreground hover:border-orange-200')}>
              <Icon className="h-4 w-4" />
              {label}
              <span className={cn('px-2 py-0.5 rounded-lg text-xs font-black', tab === key ? 'bg-white/20' : 'bg-muted')}>{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white border p-6 space-y-4">
                <div className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'workers' && (
              workers.length === 0
                ? (
                  <div className="text-center py-24 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-15" />
                    <h3 className="text-xl font-bold mb-2">لا يوجد حرفيون مطابقون</h3>
                    <p className="text-sm mb-6">جرّب تغيير معايير البحث</p>
                    {hasFilters && <Button variant="orange-outline" onClick={clearFilters} className="rounded-2xl">مسح الفلاتر</Button>}
                  </div>
                )
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {workers.map(w => (
                      <Link key={w.id} href={`/profile/${w.id}`} className="group block h-full">
                        <div className="card-premium rounded-3xl p-6 h-full flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-13 w-13 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
                                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black text-lg h-13 w-13">{w.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                {w.availability === 'available' && <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" /></span>}
                              </div>
                              <div>
                                <h3 className="font-bold leading-tight group-hover:text-orange-600 transition-colors">{w.full_name || 'حرفي'}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{w.specialty || 'عامل عام'}</p>
                              </div>
                            </div>
                            <span className={cn('text-xs px-2.5 py-1 rounded-full shrink-0', w.availability === 'available' ? 'badge-available' : 'badge-busy')}>
                              {w.availability === 'available' ? 'متاح' : 'مشغول'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-3.5 w-3.5', i < Math.round(w.avg_rating) ? 'star-fill' : 'star-empty')} />)}</div>
                            <span className="text-sm font-semibold">{w.avg_rating > 0 ? w.avg_rating.toFixed(1) : '—'}</span>
                            {w.review_count > 0 && <span className="text-xs text-muted-foreground">({w.review_count})</span>}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-dashed">
                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-400" />{wName(w.wilaya_id)}</span>
                            {w.hourly_rate && <span className="font-black text-base text-orange-600">{formatNumber(w.hourly_rate)} <span className="text-xs font-normal text-muted-foreground">دج/س</span></span>}
                          </div>
                          {w.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {w.skills.slice(0, 3).map(s => <span key={s} className="text-[11px] bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-full font-medium">{s}</span>)}
                              {w.skills.length > 3 && <span className="text-[11px] text-muted-foreground py-1">+{w.skills.length - 3}</span>}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )
            )}
            {tab === 'jobs' && (
              jobs.length === 0
                ? (
                  <div className="text-center py-24 text-muted-foreground">
                    <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-15" />
                    <h3 className="text-xl font-bold mb-2">لا توجد وظائف مطابقة</h3>
                  </div>
                )
                : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {jobs.map(j => (
                      <Link key={j.id} href={`/jobs/${j.id}`} className="group block h-full">
                        <div className="card-premium rounded-3xl p-6 h-full flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-bold leading-snug group-hover:text-orange-600 transition-colors">{j.title}</h3>
                            {j.budget && (
                              <div className="shrink-0 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-3 py-2 text-center">
                                <p className="text-xs text-orange-500">الميزانية</p>
                                <p className="font-black text-orange-700">{formatNumber(j.budget)} <span className="text-xs font-normal">دج</span></p>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">{j.description}</p>
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed">
                            <Badge variant="secondary" className="text-xs gap-1 rounded-full"><MapPin className="h-3 w-3" />{wName(j.wilaya_id)}</Badge>
                            {j.specialty && <Badge variant="orange" className="text-xs rounded-full">{j.specialty}</Badge>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
            )}
          </>
        )}
      </div>
    </div>
  );
}
