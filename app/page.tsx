'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTY_CATEGORIES } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Star, ArrowLeft, Users, Briefcase, Shield, TrendingUp, Zap, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles']|null };

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return count;
}

function StatCard({ icon: Icon, value, label, suffix = '' }: { icon: React.ElementType; value: number; label: string; suffix?: string }) {
  const count = useCountUp(value);
  return (
    <div className="glass rounded-2xl px-6 py-4 flex items-center gap-4 border border-white/20 hover:border-white/40 transition-all">
      <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{count.toLocaleString()}{suffix}</p>
        <p className="text-xs text-orange-100 font-medium">{label}</p>
      </div>
    </div>
  );
}

function WorkerCard({ worker, wilayaName }: { worker: Worker; wilayaName: (id: number|null) => string }) {
  return (
    <Link href={`/profile/${worker.id}`} className="group block">
      <div className="card-premium card-glow rounded-2xl p-5 h-full bg-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-xl">
                {worker.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {worker.availability === 'available' && (
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate group-hover:text-orange-600 transition-colors">{worker.full_name || 'حرفي'}</h3>
            <p className="text-sm text-muted-foreground">{worker.specialty || 'عامل عام'}</p>
          </div>
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold shrink-0',
            worker.availability === 'available' ? 'badge-available' : 'badge-busy')}>
            {worker.availability === 'available' ? 'متاح' : 'مشغول'}
          </span>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn('h-4 w-4', i < Math.round(worker.avg_rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
          ))}
          <span className="text-sm text-muted-foreground mr-1 font-medium">
            {worker.avg_rating > 0 ? worker.avg_rating.toFixed(1) : 'جديد'}
            {worker.review_count > 0 && <span className="text-xs text-muted-foreground/70"> ({worker.review_count})</span>}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{wilayaName(worker.wilaya_id)}</span>
          {worker.hourly_rate && (
            <span className="mr-auto font-bold text-orange-600 text-sm">{worker.hourly_rate.toLocaleString()} دج/س</span>
          )}
        </div>

        {worker.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-dashed">
            {worker.skills.slice(0, 3).map((s) => (
              <span key={s} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-lg font-medium">{s}</span>
            ))}
            {worker.skills.length > 3 && <span className="text-xs text-muted-foreground">+{worker.skills.length - 3}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: w }, { data: j }, { data: wil }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role','worker').order('avg_rating',{ascending:false}).limit(6),
        supabase.from('jobs').select('*,employer:profiles!jobs_employer_id_fkey(*)').eq('status','open').order('created_at',{ascending:false}).limit(4),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setWorkers(w||[]); setJobs((j as Job[])||[]); setWilayas(wil||[]); setLoading(false);
    })();
  }, []);

  const wilayaName = (id: number|null) => wilayas.find(w => w.id===id)?.name || 'الجزائر';

  return (
    <div className="min-h-screen">
      {/* ─── HERO ─── */}
      <section className="hero-gradient noise relative overflow-hidden pt-20 pb-32">
        {/* Animated blobs */}
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-orange-500/20 animate-blob blur-3xl" />
        <div className="absolute bottom-10 right-20 h-80 w-80 rounded-full bg-orange-700/15 animate-blob delay-300 blur-3xl" />
        <div className="absolute top-40 right-1/3 h-48 w-48 rounded-full bg-orange-400/20 animate-blob delay-600 blur-3xl" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm text-white/90 font-medium animate-fade-up">
              <Zap className="h-4 w-4 text-orange-300" />
              المنصة الأولى للحرفيين في الجزائر
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1] animate-fade-up delay-100">
              ابحث عن
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-orange-300 via-amber-200 to-orange-300 bg-clip-text text-transparent">
                  حرفي متخصص
                </span>
                <svg className="absolute -bottom-2 left-0 right-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path d="M1 5.5C50 2 100 7 150 4.5C200 2 250 6.5 299 4" stroke="url(#u)" strokeWidth="3" strokeLinecap="round"/>
                  <defs><linearGradient id="u" x1="0" y1="0" x2="300" y2="0"><stop stopColor="#fb923c"/><stop offset="1" stopColor="#f97316"/></linearGradient></defs>
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
              تواصل مع أفضل الكفاءات في كل ولايات الجزائر — نجارة، كهرباء، سباكة، تقنية وأكثر
            </p>

            {/* Search */}
            <div className="glass rounded-2xl p-3 max-w-2xl mx-auto flex gap-3 animate-fade-up delay-300">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-12 w-full rounded-xl border border-white/60 bg-white/90 px-4 pr-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                  placeholder="نجار، كهربائي، مطور ويب..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${search}`)}
                />
              </div>
              <Button variant="premium" size="lg" className="shrink-0 rounded-xl" onClick={() => router.push(`/search?q=${search}`)}>
                <Search className="h-4 w-4 ml-2" /> بحث
              </Button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap justify-center gap-2 mt-5 animate-fade-up delay-400">
              {['نجارة','كهرباء','سباكة','مطور ويب','تصوير'].map((s) => (
                <button key={s} onClick={() => router.push(`/search?specialty=${s}`)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 hover:text-white transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-3 mt-16 animate-fade-up delay-500">
            <StatCard icon={Users} value={1200} suffix="+" label="حرفي مسجّل" />
            <StatCard icon={MapPin} value={48} label="ولاية مغطاة" />
            <StatCard icon={Shield} value={650} suffix="+" label="عقد منجز" />
            <StatCard icon={TrendingUp} value={98} suffix="%" label="رضا العملاء" />
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 leading-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 0C480 0 240 80 0 40L0 80Z" fill="hsl(30 20% 98%)" />
          </svg>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">التخصصات</span>
            <h2 className="text-3xl md:text-4xl font-black mb-3">تصفح حسب المجال</h2>
            <p className="text-muted-foreground max-w-md mx-auto">اختر من بين مئات التخصصات الحرفية والمهنية</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SPECIALTY_CATEGORIES.map((cat) => (
              <Link key={cat.name} href={`/search?specialty=${encodeURIComponent(cat.specialties[0])}`}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-white hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-md transition-transform group-hover:scale-110 bg-gradient-to-br', cat.color)}>
                  {cat.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground group-hover:text-orange-600 transition-colors">{cat.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.specialties.length} تخصص</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 section-dots bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">كيف يعمل</span>
            <h2 className="text-3xl md:text-4xl font-black">ثلاث خطوات بسيطة</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🔍', title: 'ابحث وتصفح', desc: 'ابحث عن الحرفي المناسب حسب التخصص، الولاية، والتقييم' },
              { step: '02', icon: '💬', title: 'تواصل وتفاوض', desc: 'راسل الحرفي مباشرة وناقش تفاصيل العمل والميزانية' },
              { step: '03', icon: '✅', title: 'وقّع العقد واستلم', desc: 'وقّع عقداً رقمياً آمناً واستلم عملك بضمان الجودة' },
            ].map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-8 border border-border hover:border-orange-200 hover:shadow-lg transition-all duration-300 group">
                <div className="text-5xl mb-4">{s.icon}</div>
                <span className="absolute top-5 left-5 text-6xl font-black text-orange-500/8 select-none group-hover:text-orange-500/15 transition-colors">{s.step}</span>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-orange-500 rounded-full items-center justify-center shadow-lg shadow-orange-500/30">
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED WORKERS ─── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">الأفضل</span>
              <h2 className="text-3xl md:text-4xl font-black">حرفيون متميزون</h2>
              <p className="text-muted-foreground mt-1">الأعلى تقييماً هذا الشهر</p>
            </div>
            <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-2" asChild>
              <Link href="/search">عرض الكل <ArrowLeft className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border p-5 bg-white space-y-3">
                    <div className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                    <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
                  </div>
                ))
              : workers.map((w) => <WorkerCard key={w.id} worker={w} wilayaName={wilayaName} />)
            }
          </div>
        </div>
      </section>

      {/* ─── JOBS ─── */}
      <section className="py-20 bg-muted/30 section-dots">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">فرص العمل</span>
              <h2 className="text-3xl md:text-4xl font-black">أحدث الوظائف</h2>
            </div>
            <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-2" asChild>
              <Link href="/jobs">عرض الكل <ArrowLeft className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border p-5 bg-white space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/3" /></div>)
              : jobs.length === 0
              ? <div className="col-span-2 text-center py-16 text-muted-foreground"><Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>لا توجد وظائف حالياً</p></div>
              : jobs.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="group">
                    <div className="card-premium card-glow rounded-2xl p-6 h-full bg-white">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-base group-hover:text-orange-600 transition-colors">{j.title}</h3>
                        {j.budget && <span className="shrink-0 text-orange-600 font-black bg-orange-50 px-3 py-1 rounded-xl text-sm border border-orange-100">{j.budget.toLocaleString()} دج</span>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{j.description}</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className="text-xs gap-1 font-medium"><MapPin className="h-3 w-3" />{wilayaName(j.wilaya_id)}</Badge>
                        {j.specialty && <Badge variant="outline" className="text-xs">{j.specialty}</Badge>}
                        <span className="mr-auto text-xs text-muted-foreground">{new Date(j.created_at).toLocaleDateString('ar-DZ')}</span>
                      </div>
                    </div>
                  </Link>
                ))
            }
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 hero-gradient noise relative overflow-hidden">
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-orange-400/20 animate-blob blur-2xl" />
        <div className="absolute bottom-10 left-10 h-60 w-60 rounded-full bg-orange-600/15 animate-blob delay-400 blur-2xl" />
        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <div className="text-5xl mb-6">🔨</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            هل أنت حرفي؟<br />
            <span className="text-gradient-gold">انضم مجاناً اليوم</span>
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">عرض مهاراتك لآلاف العملاء، احصل على عقود، وابنِ سمعة مهنية قوية</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="xl" className="bg-white text-orange-700 hover:bg-orange-50 font-bold shadow-xl" asChild>
              <Link href="/auth?tab=register">إنشاء حساب مجاناً</Link>
            </Button>
            <Button size="xl" variant="ghost" className="text-white hover:bg-white/10 border-2 border-white/30" asChild>
              <Link href="/search">تصفح الحرفيين</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center"><span className="text-lg">🔨</span></div>
                <span className="font-extrabold text-xl text-white"><span className="text-orange-400">حرف</span>تي</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs">منصة جزائرية رائدة تربط الحرفيين المهرة بأصحاب العمل في كل أنحاء الوطن.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5 text-sm">
                {[['/', 'الرئيسية'], ['/search', 'البحث'], ['/jobs', 'الوظائف'], ['/auth', 'تسجيل الدخول']].map(([h, l]) => (
                  <li key={h}><Link href={h} className="hover:text-orange-400 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">تواصل</h4>
              <ul className="space-y-2.5 text-sm">
                <li>📧 info@harfati.dz</li>
                <li>📍 الجزائر العاصمة</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© 2026 حرفتي. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>جميع الخدمات تعمل</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
