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
import {
  Search, MapPin, Star, Filter, X, Briefcase, Wrench,
  ChevronDown, SlidersHorizontal, Users, Clock,
  ArrowUpDown, CheckCircle
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'rate_asc', label: 'السعر: من الأقل' },
  { value: 'rate_desc', label: 'السعر: من الأعلى' },
  { value: 'experience', label: 'الأكثر خبرة' },
];

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };
type Wilaya = Tables['wilayas'];

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
    if (selectedWilaya) {
      wQuery = wQuery.eq('wilaya_id', selectedWilaya);
      jQuery = jQuery.eq('wilaya_id', selectedWilaya);
    }
    if (selectedSpecialty) {
      wQuery = wQuery.eq('specialty', selectedSpecialty);
      jQuery = jQuery.eq('specialty', selectedSpecialty);
    }
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
    setJobs(jData || []);
    setWilayas(wilData || []);
    setLoading(false);
  }, [query, selectedWilaya, selectedSpecialty, availability, minRating, maxRate, minExperience, sortBy]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const clearFilters = () => {
    setQuery('');
    setSelectedWilaya('');
    setSelectedSpecialty('');
    setAvailability('');
    setMinRating('');
    setMaxRate('');
    setMinExperience('');
    setSortBy('rating');
  };

  const hasFilters = query || selectedWilaya || selectedSpecialty || availability || minRating || maxRate || minExperience;
  const activeFilterCount = [query, selectedWilaya, selectedSpecialty, availability, minRating, maxRate, minExperience].filter(Boolean).length;

  const wilayaName = (id: number | null) => wilayas.find(w => w.id === id)?.name || 'الجزائر';

  const availabilityConfig = {
    available: { label: 'متاح', color: 'bg-green-100 text-green-700' },
    busy: { label: 'مشغول', color: 'bg-amber-100 text-amber-700' },
    unavailable: { label: 'غير متاح', color: 'bg-red-100 text-red-600' },
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero Search Bar */}
      <div className="bg-white border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن حرفي أو تخصص..."
                  className="pr-10 h-10 bg-gray-50 border-gray-200"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
                />
              </div>

              <div className="relative hidden md:block">
                <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <select
                  className="h-10 rounded-md border border-input bg-gray-50 pr-10 pl-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-w-[180px]"
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                >
                  <option value="">كل الولايات</option>
                  {wilayas.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <Button
                onClick={fetchResults}
                className="h-10 bg-primary-500 hover:bg-primary-600 text-white px-5 shrink-0"
              >
                بحث
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 px-3 gap-2 relative shrink-0 ${showFilters ? 'border-primary-500 text-primary-600' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">فلاتر</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border">
                {/* Mobile wilaya */}
                <div className="md:hidden mb-4">
                  <label className="text-sm font-medium mb-1.5 block text-gray-700">الولاية</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <select
                      className="w-full h-10 rounded-md border border-input bg-white pr-10 pl-3 py-2 text-sm outline-none"
                      value={selectedWilaya}
                      onChange={(e) => setSelectedWilaya(e.target.value)}
                    >
                      <option value="">كل الولايات</option>
                      {wilayas.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-600">التخصص</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm outline-none"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                    >
                      <option value="">الكل</option>
                      {SPECIALTY_CATEGORIES.map((cat) => (
                        <optgroup key={cat.name} label={cat.name}>
                          {cat.specialties.map((s) => (
                            <option key={s.label} value={s.label}>{s.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-600">الحالة</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm outline-none"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    >
                      <option value="">الكل</option>
                      <option value="available">متاح</option>
                      <option value="busy">مشغول</option>
                      <option value="unavailable">غير متاح</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-600">الحد الأقصى للسعر/س</label>
                    <Input
                      type="number"
                      placeholder="مثال: 2000"
                      className="h-9 text-sm"
                      value={maxRate}
                      onChange={(e) => setMaxRate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-600">أدنى تقييم</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm outline-none"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                    >
                      <option value="">أي تقييم</option>
                      <option value="4">4+ نجوم</option>
                      <option value="3">3+ نجوم</option>
                      <option value="2">2+ نجوم</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-600">أدنى خبرة (سنوات)</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm outline-none"
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                    >
                      <option value="">أي خبرة</option>
                      <option value="1">1+ سنة</option>
                      <option value="3">3+ سنوات</option>
                      <option value="5">5+ سنوات</option>
                      <option value="10">10+ سنوات</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-gray-600">ترتيب حسب</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-sm outline-none"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {hasFilters && (
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 text-xs gap-1"
                    >
                      <X className="w-3 h-3" />
                      مسح كل الفلاتر
                    </Button>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSpecialty && (
                        <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full border border-primary-200">
                          {selectedSpecialty}
                          <button onClick={() => setSelectedSpecialty('')}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {selectedWilaya && (
                        <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full border border-primary-200">
                          {wilayaName(parseInt(selectedWilaya))}
                          <button onClick={() => setSelectedWilaya('')}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {availability && (
                        <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full border border-primary-200">
                          {availability === 'available' ? 'متاح' : availability === 'busy' ? 'مشغول' : 'غير متاح'}
                          <button onClick={() => setAvailability('')}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {minRating && (
                        <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full border border-primary-200">
                          {minRating}+ نجوم
                          <button onClick={() => setMinRating('')}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">

          {/* Specialty Quick-Filter Pills */}
          <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-2 w-max">
              <button
                onClick={() => setSelectedSpecialty('')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  !selectedSpecialty
                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                الكل
              </button>
              {ALL_SPECIALTIES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === s.label ? '' : s.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                    selectedSpecialty === s.label
                      ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                  }`}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs & Results Count */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
              <button
                onClick={() => setTab('workers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'workers'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                الحرفيون
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'workers' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {workers.length}
                </span>
              </button>
              <button
                onClick={() => setTab('jobs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'jobs'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                الوظائف
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'jobs' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {jobs.length}
                </span>
              </button>
            </div>

            {tab === 'workers' && !loading && workers.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <span>{workers.filter(w => w.availability === 'available').length} حرفي متاح</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>من {wilayas.length} ولاية</span>
              </div>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {tab === 'workers' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workers.length === 0 ? (
                    <div className="col-span-3 text-center py-16">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">لا يوجد حرفيون مطابقون للبحث</p>
                      <p className="text-sm text-gray-400 mt-1">جرب تغيير الفلاتر أو البحث بكلمات مختلفة</p>
                      {hasFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                          مسح الفلاتر
                        </Button>
                      )}
                    </div>
                  ) : (
                    workers.map((worker) => {
                      const avail = availabilityConfig[worker.availability] || availabilityConfig.unavailable;
                      return (
                        <Link key={worker.id} href={`/profile/${worker.id}`}>
                          <Card className="h-full hover:shadow-lg transition-all duration-200 border-border/60 cursor-pointer group hover:-translate-y-0.5">
                            <CardContent className="p-5">
                              <div className="flex items-start gap-3">
                                <div className="relative shrink-0">
                                  <Avatar className="w-14 h-14 border-2 border-primary-100 group-hover:border-primary-300 transition-colors">
                                    <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 font-bold text-lg">
                                      {worker.full_name?.charAt(0) || '؟'}
                                    </AvatarFallback>
                                  </Avatar>
                                  {worker.availability === 'available' && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white" title="متاح" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h3 className="font-bold text-gray-900 leading-tight truncate">{worker.full_name || 'حرفي'}</h3>
                                      <p className="text-sm text-primary-600 font-medium">{worker.specialty || 'عامل عام'}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${avail.color}`}>
                                      {avail.label}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 mt-1.5">
                                    {renderStars(worker.avg_rating)}
                                    <span className="text-xs text-gray-500 mr-1">
                                      {worker.avg_rating > 0 ? worker.avg_rating.toFixed(1) : 'جديد'}
                                      {worker.review_count > 0 && ` (${worker.review_count})`}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-gray-400" />
                                      {wilayaName(worker.wilaya_id)}
                                    </span>
                                    {worker.years_experience && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        {worker.years_experience} سنة خبرة
                                      </span>
                                    )}
                                    {worker.hourly_rate && (
                                      <span className="flex items-center gap-1 font-semibold text-gray-700">
                                        {worker.hourly_rate.toLocaleString()} دج/س
                                      </span>
                                    )}
                                  </div>

                                  {worker.skills && worker.skills.length > 0 && (
                                    <div className="mt-2.5 flex flex-wrap gap-1">
                                      {worker.skills.slice(0, 3).map((skill) => (
                                        <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                          {skill}
                                        </span>
                                      ))}
                                      {worker.skills.length > 3 && (
                                        <span className="text-xs text-gray-400">+{worker.skills.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}

              {tab === 'jobs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.length === 0 ? (
                    <div className="col-span-2 text-center py-16">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">لا توجد وظائف مطابقة للبحث</p>
                      <p className="text-sm text-gray-400 mt-1">جرب تغيير الفلاتر أو البحث بكلمات مختلفة</p>
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <Link key={job.id} href={`/jobs/${job.id}`}>
                        <Card className="h-full hover:shadow-lg transition-all duration-200 border-border/60 cursor-pointer group hover:-translate-y-0.5">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <h3 className="font-bold text-gray-900 leading-tight">{job.title}</h3>
                              {job.specialty && (
                                <Badge variant="outline" className="shrink-0 text-xs border-primary-200 text-primary-600">
                                  {job.specialty}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{job.description}</p>

                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {wilayaName(job.wilaya_id)}
                              </span>
                              {job.budget && (
                                <span className="flex items-center gap-1 font-semibold text-primary-600">
                                  {job.budget.toLocaleString()} دج
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {job.employer?.full_name || 'صاحب عمل'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
