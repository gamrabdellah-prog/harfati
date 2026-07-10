'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTIES } from '@/lib/specialties';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, Users, Briefcase, Filter, X } from 'lucide-react';

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
  const [query, setQuery] = useState(sp.get('q') || '');
  const [wilaya, setWilaya] = useState(sp.get('wilaya') || '');
  const [specialty, setSpecialty] = useState(sp.get('specialty') || '');
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    let wq = supabase.from('profiles').select('*').eq('role', 'worker');
    let jq = supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status', 'open');

    if (query) {
      wq = wq.or(`full_name.ilike.%${query}%,specialty.ilike.%${query}%,bio.ilike.%${query}%`);
      jq = jq.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (wilaya) { wq = wq.eq('wilaya_id', wilaya); jq = jq.eq('wilaya_id', wilaya); }
    if (specialty) { wq = wq.eq('specialty', specialty); jq = jq.eq('specialty', specialty); }
    if (availability) wq = wq.eq('availability', availability);

    if (sortBy === 'rating') wq = wq.order('avg_rating', { ascending: false });
    else if (sortBy === 'rate_asc') wq = wq.order('hourly_rate', { ascending: true });
    else if (sortBy === 'rate_desc') wq = wq.order('hourly_rate', { ascending: false });

    const [{ data: w }, { data: j }, { data: wil }] = await Promise.all([
      wq,
      jq.order('created_at', { ascending: false }),
      supabase.from('wilayas').select('*').order('id'),
    ]);
    setWorkers(w || []);
    setJobs((j as Job[]) || []);
    setWilayas(wil || []);
    setLoading(false);
  }, [query, wilaya, specialty, availability, sortBy]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const clearFilters = () => {
    setQuery(''); setWilaya(''); setSpecialty(''); setAvailability(''); setSortBy('rating');
  };
  const hasFilters = query || wilaya || specialty || availability;
  const wName = (id: number | null) => wilayas.find((w) => w.id === id)?.name || 'الجزائر';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search header */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن حرفي أو وظيفة..."
                className="pr-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 ${hasFilters ? 'border-orange-500 text-orange-600' : ''}`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">فلاتر</span>
              {hasFilters && <span className="h-2 w-2 rounded-full bg-orange-500" />}
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={fetchResults}>
              بحث
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
              >
                <option value="">كل الولايات</option>
                {wilayas.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">كل التخصصات</option>
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="">كل الحالات</option>
                <option value="available">متاح</option>
                <option value="busy">مشغول</option>
              </select>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">الأعلى تقييماً</option>
                <option value="rate_asc">السعر: من الأقل</option>
                <option value="rate_desc">السعر: من الأعلى</option>
              </select>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" /> مسح الفلاتر
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTab('workers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tab === 'workers' ? 'bg-orange-500 text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <Users className="h-4 w-4" />
            الحرفيون ({workers.length})
          </button>
          <button
            onClick={() => setTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              tab === 'jobs' ? 'bg-orange-500 text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            الوظائف ({jobs.length})
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white border p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'workers' && (
              workers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا يوجد حرفيون مطابقون للبحث</p>
                  {hasFilters && <Button variant="outline" onClick={clearFilters} className="mt-4">مسح الفلاتر</Button>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {workers.map((w) => (
                    <Link key={w.id} href={`/profile/${w.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-lg">
                                {w.full_name?.charAt(0) || '؟'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{w.full_name || 'حرفي'}</h3>
                              <p className="text-sm text-gray-500">{w.specialty || 'عامل عام'}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                              w.availability === 'available' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {w.availability === 'available' ? 'متاح' : 'مشغول'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(w.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                            ))}
                            <span className="text-xs text-gray-500 mr-1">
                              {w.avg_rating > 0 ? w.avg_rating.toFixed(1) : 'جديد'}
                              {w.review_count > 0 && ` (${w.review_count})`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{wName(w.wilaya_id)}</span>
                            {w.hourly_rate && <span className="font-semibold text-orange-600">{w.hourly_rate.toLocaleString()} دج/س</span>}
                          </div>
                          {w.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {w.skills.slice(0, 3).map((s) => (
                                <span key={s} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{s}</span>
                              ))}
                              {w.skills.length > 3 && <span className="text-xs text-gray-400">+{w.skills.length - 3}</span>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )
            )}
            {tab === 'jobs' && (
              jobs.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد وظائف مطابقة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {jobs.map((j) => (
                    <Link key={j.id} href={`/jobs/${j.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full bg-white">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold">{j.title}</h3>
                            {j.budget && <span className="text-orange-600 font-bold text-sm shrink-0">{j.budget.toLocaleString()} دج</span>}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{j.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{wName(j.wilaya_id)}</Badge>
                            {j.specialty && <Badge variant="outline" className="text-xs">{j.specialty}</Badge>}
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
