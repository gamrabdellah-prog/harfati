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
import {
  Search, MapPin, Star, Briefcase, Wrench, SlidersHorizontal,
  X, Users, ArrowUpDown,
} from 'lucide-react';

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };
type Wilaya = Tables['wilayas'];

const SORT_OPTIONS = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'rate_asc', label: 'السعر: من الأقل' },
  { value: 'rate_desc', label: 'السعر: من الأعلى' },
  { value: 'experience', label: 'الأكثر خبرة' },
];

const availabilityConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'متاح', color: 'bg-green-100 text-green-700' },
  busy: { label: 'مشغول', color: 'bg-amber-100 text-amber-700' },
  unavailable: { label: 'غير متاح', color: 'bg-red-100 text-red-600' },
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'workers' | 'jobs'>('workers');
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedWilaya, setSelectedWilaya] = useState(searchParams.get('wilaya') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const [availability, setAvailability] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    let wQuery = supabase.from('profiles').select('*').eq('role', 'worker');
    let jQuery = supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status', 'open');

    if (query) {
      wQuery = wQuery.or(`full_name.ilike.%${query}%,specialty.ilike.%${query}%,bio.ilike.%${query}%`);
      jQuery = jQuery.or(`title.ilike.%${query}%,specialty.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (selectedWilaya) { wQuery = wQuery.eq('wilaya_id', selectedWilaya); jQuery = jQuery.eq('wilaya_id', selectedWilaya); }
    if (selectedSpecialty) { wQuery = wQuery.eq('specialty', selectedSpecialty); jQuery = jQuery.eq('specialty', selectedSpecialty); }
    if (availability) wQuery = wQuery.eq('availability', availability);
    if (minRating) wQuery = wQuery.gte('avg_rating', parseFloat(minRating));
    if (maxRate) wQuery = wQuery.lte('hourly_rate', parseFloat(maxRate));
    if (minExperience) wQuery = wQuery.gte('years_experience', parseInt(minExperience));

    if (sortBy === 'rating') wQuery = wQuery.order('avg_rating', { ascending: false });
    else if (sortBy === 'rate_asc') wQuery = wQuery.order('hourly_rate', { ascending: true });
    else if (sortBy === 'rate_desc') wQuery = wQuery.order('hourly_rate', { ascending: false });
    else if (sortBy === 'experience') wQuery = wQuery.order('years_experience', { ascending: false });

    const [{ data: wData }, { data: jData }, { data: wilData }] = await Promise.all([
      wQuery,
      jQuery.order('created_at', { ascending: false }),
      supabase.from('wilayas').select('*').order('id'),
    ]);
    setWorkers(wData || []);
    setJobs((jData as Job[]) || []);
    setWilayas(wilData || []);
    setLoading(false);
  }, [query, selectedWilaya, selectedSpecialty, availability, minRating, maxRate, minExperience, sortBy]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const clearFilters = () => {
    setQuery(''); setSelectedWilaya(''); setSelectedSpecialty('');
    setAvailability(''); setMinRating(''); setMaxRate(''); setMinExperience('');
    setSortBy('rating');
  };

  const wilayaName = (id: number | null) => wilayas.find((w) => w.id === id)?.name || 'الجزائر';
  const hasFilters = query || selectedWilaya || selectedSpecialty || availability || minRating || maxRate || minExperience;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Search Header */}
      <div className="bg-white border-b py-6">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن حرفي أو وظيفة..."
                className="pr-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">فلاتر</span>
              {hasFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
            </Button>
            <Button onClick={fetchResults}>بحث</Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)}>
                <option value="">كل الولايات</option>
                {wilayas.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={selectedSpecialty} onChange={(e) => setSelectedSpecialty(e.target.value)}>
                <option value="">كل التخصصات</option>
                {ALL_SPECIALTIES.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="busy">مشغول</option>
                <option value="unavailable">غير متاح</option>
              </select>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Input type="number" placeholder="تقييم أدنى (1-5)" value={minRating} onChange={(e) => setMinRating(e.target.value)} min="1" max="5" />
              <Input type="number" placeholder="سعر أقصى (دج/س)" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} />
              <Input type="number" placeholder="خبرة أدنى (سنوات)" value={minExperience} onChange={(e) => setMinExperience(e.target.value)} />
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                </Button>
              )}
            </div>
          )}

          {/* Specialty Quick-pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {SPECIALTY_CATEGORIES.slice(0, 4).map((cat) =>
              cat.specialties.slice(0, 3).map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === s.label ? '' : s.label)}
                  className={`flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedSpecialty === s.label ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary/50 bg-white'}`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Results */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setTab('workers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'workers' ? 'bg-primary text-white' : 'bg-white border hover:bg-muted'}`}
          >
            <Users className="h-4 w-4" />
            الحرفيون ({workers.length})
          </button>
          <button
            onClick={() => setTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === 'jobs' ? 'bg-primary text-white' : 'bg-white border hover:bg-muted'}`}
          >
            <Briefcase className="h-4 w-4" />
            الوظائف ({jobs.length})
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'workers' && (
              workers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">لا يوجد حرفيون مطابقون للبحث</p>
                  {hasFilters && <Button variant="outline" onClick={clearFilters} className="mt-4">مسح الفلاتر</Button>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {workers.map((worker) => {
                    const avail = availabilityConfig[worker.availability] || availabilityConfig.unavailable;
                    return (
                      <Link key={worker.id} href={`/profile/${worker.id}`}>
                        <Card className="card-hover h-full cursor-pointer bg-white">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                    {worker.full_name?.charAt(0) || '؟'}
                                  </AvatarFallback>
                                </Avatar>
                                {worker.availability === 'available' && (
                                  <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{worker.full_name || 'حرفي'}</h3>
                                <p className="text-sm text-muted-foreground">{worker.specialty || 'عامل عام'}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${avail.color}`}>
                                {avail.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(worker.avg_rating) ? 'fill-current' : 'fill-none'}`} />
                              ))}
                              <span className="text-xs text-muted-foreground mr-1">
                                {worker.avg_rating > 0 ? worker.avg_rating.toFixed(1) : 'جديد'}
                                {worker.review_count > 0 && ` (${worker.review_count})`}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{wilayaName(worker.wilaya_id)}</span>
                              {worker.years_experience && <span>{worker.years_experience} سنة خبرة</span>}
                              {worker.hourly_rate && <span className="font-medium text-primary mr-auto">{worker.hourly_rate.toLocaleString()} دج/س</span>}
                            </div>
                            {worker.skills && worker.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {worker.skills.slice(0, 3).map((skill) => (
                                  <span key={skill} className="text-xs bg-muted px-2 py-0.5 rounded-full">{skill}</span>
                                ))}
                                {worker.skills.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{worker.skills.length - 3}</span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )
            )}

            {tab === 'jobs' && (
              jobs.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">لا توجد وظائف مطابقة للبحث</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <Card className="card-hover h-full cursor-pointer bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold">{job.title}</h3>
                            {job.budget && <span className="text-primary font-bold text-sm shrink-0">{job.budget.toLocaleString()} دج</span>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{wilayaName(job.wilaya_id)}</Badge>
                            {job.specialty && <Badge variant="secondary" className="text-xs">{job.specialty}</Badge>}
                            {job.employer && <span className="text-xs text-muted-foreground mr-auto">{job.employer.full_name}</span>}
                          </div>
                        </CardContent>
                      </Card>
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
