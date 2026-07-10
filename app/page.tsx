'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTY_CATEGORIES } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Hammer, Search, MapPin, Star, ArrowLeft,
  Users, Briefcase, FileCheck, Wrench, Building2, Zap, PaintRoller, Car, Sparkles,
} from 'lucide-react';

const categoryGradients = ['cat-grad-1', 'cat-grad-2', 'cat-grad-3', 'cat-grad-4', 'cat-grad-5', 'cat-grad-6'];
const categoryIcons = [Wrench, Building2, Zap, PaintRoller, Car, Sparkles];

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };
type Wilaya = Tables['wilayas'];

export default function HomePage() {
  const router = useRouter();
  const [featuredWorkers, setFeaturedWorkers] = useState<Worker[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: workers }, { data: jobs }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'worker').eq('availability', 'available').order('avg_rating', { ascending: false }).limit(6),
        supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status', 'open').order('created_at', { ascending: false }).limit(4),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setFeaturedWorkers(workers || []);
      setLatestJobs((jobs as Job[]) || []);
      setWilayas(w || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedWilaya) params.set('wilaya', selectedWilaya);
    router.push(`/search?${params.toString()}`);
  };

  const wilayaName = (id: number | null) => wilayas.find((w) => w.id === id)?.name || 'الجزائر';

  return (
    <div className="min-h-screen">
      {/* ===== Hero ===== */}
      <section className="hero-gradient hero-pattern relative overflow-hidden py-20 md:py-32">
        {/* Decorative blobs */}
        <div className="absolute top-12 left-8 w-32 h-32 rounded-full bg-white/10 animate-float" />
        <div className="absolute bottom-8 right-12 w-20 h-20 rounded-full bg-white/10 animate-float stagger-3" />
        <div className="absolute top-1/2 left-1/4 w-12 h-12 rounded-full bg-white/5 animate-pulse" />

        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm mb-6 animate-fade-in-up">
            <Hammer className="h-4 w-4" />
            <span>منصة الحرفيين الجزائرية الأولى</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-balance animate-fade-in-up stagger-1">
            ابحث عن وظيفة أو حرفة<br className="hidden md:block" /> في كل ولايات الجزائر
          </h1>
          <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl mx-auto animate-fade-in-up stagger-2">
            حرفتي تربطك بأفضل الكفاءات في كل التخصصات. ابحث عن وظيفة، اعرض مهاراتك، أو وظف العمال المناسبين لك.
          </p>

          {/* Search */}
          <div className="glass rounded-2xl p-4 max-w-2xl mx-auto animate-fade-in-up stagger-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن تخصص أو مهنة..."
                  className="pr-9 bg-white/90 border-white/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <select
                className="h-10 rounded-md border border-white/60 bg-white/90 px-3 text-sm text-foreground focus:outline-none"
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
              >
                <option value="">كل الولايات</option>
                {wilayas.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <Button onClick={handleSearch} className="bg-white text-primary hover:bg-white/90 font-bold">
                بحث
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 animate-fade-in-up stagger-4">
            {[
              { icon: Users, value: '+1000', label: 'حرفي مسجل' },
              { icon: MapPin, value: '48', label: 'ولاية' },
              { icon: FileCheck, value: '+500', label: 'عقد منجز' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 glass rounded-xl px-4 py-2">
                <stat.icon className="h-5 w-5" />
                <span className="font-bold text-lg">{stat.value}</span>
                <span className="text-white/80 text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 48L1440 48L1440 24C1200 48 960 0 720 0C480 0 240 48 0 24L0 48Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ===== Specialties ===== */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">كل التخصصات</h2>
            <p className="text-muted-foreground">اختر التخصص الذي تبحث عنه من بين فئاتنا المتنوعة</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SPECIALTY_CATEGORIES.map((cat, idx) => {
              const Icon = categoryIcons[idx % categoryIcons.length];
              const gradClass = categoryGradients[idx % categoryGradients.length];
              return (
                <Link
                  key={cat.name}
                  href={`/search?specialty=${encodeURIComponent(cat.specialties[0]?.label || '')}`}
                  className="card-hover group flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 bg-white cursor-pointer"
                >
                  <div className={`h-12 w-12 rounded-xl ${gradClass} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-center text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.specialties.length} تخصص</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Featured Workers ===== */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">حرفيون متميزون</h2>
              <p className="text-muted-foreground">أفضل الحرفيين تقييماً على المنصة</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/search" className="flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))
              : featuredWorkers.map((worker) => (
                  <Link key={worker.id} href={`/profile/${worker.id}`}>
                    <Card className="card-hover h-full cursor-pointer bg-white">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                              {worker.full_name?.charAt(0) || '؟'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{worker.full_name || 'حرفي'}</h3>
                            <p className="text-sm text-muted-foreground">{worker.specialty || 'عامل'}</p>
                          </div>
                          <Badge
                            className={`text-xs shrink-0 ${
                              worker.availability === 'available' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                            variant="outline"
                          >
                            {worker.availability === 'available' ? 'متاح' : 'مشغول'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(worker.avg_rating) ? 'fill-current' : 'fill-none'}`} />
                          ))}
                          <span className="text-sm text-muted-foreground mr-1">{worker.avg_rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {wilayaName(worker.wilaya_id)}
                          </span>
                          {worker.hourly_rate && (
                            <span className="font-medium text-primary">{worker.hourly_rate} دج/س</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* ===== Latest Jobs ===== */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-1">آخر الوظائف</h2>
              <p className="text-muted-foreground">أحدث الوظائف المنشورة على المنصة</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/jobs" className="flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : latestJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="card-hover h-full cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{job.title}</h3>
                          {job.budget && (
                            <span className="text-primary font-bold text-sm shrink-0">{job.budget.toLocaleString()} دج</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {wilayaName(job.wilaya_id)}
                          </Badge>
                          {job.specialty && <Badge variant="secondary" className="text-xs">{job.specialty}</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 hero-gradient text-white text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <Hammer className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">هل أنت حرفي؟ انضم إلينا اليوم</h2>
          <p className="text-white/85 mb-8 text-lg">
            عرض مهاراتك، اكتسب عملاء جدد، وابنِ سمعتك المهنية في منصة حرفتي
          </p>
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold text-base px-8" asChild>
            <Link href="/auth?tab=register">سجّل الآن مجاناً</Link>
          </Button>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-3">
                <Hammer className="h-6 w-6 text-primary" />
                حرفتي
              </Link>
              <p className="text-sm text-gray-400">منصة جزائرية تربط الحرفيين بأصحاب العمل في كل ولايات الوطن</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">روابط سريعة</h4>
              <ul className="space-y-2 text-sm">
                {[{ href: '/', label: 'الرئيسية' }, { href: '/search', label: 'البحث' }, { href: '/jobs', label: 'الوظائف' }, { href: '/auth', label: 'تسجيل الدخول' }].map((l) => (
                  <li key={l.href}><Link href={l.href} className="hover:text-primary transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">تواصل معنا</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>البريد الإلكتروني: info@harfati.dz</li>
                <li>الجزائر العاصمة، الجزائر</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © 2026 حرفتي. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
