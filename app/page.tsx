'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTY_CATEGORIES } from '@/lib/specialties';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, formatNumber } from '@/lib/utils';
import { Search, MapPin, Star, ArrowLeft, Users, Briefcase, Shield, TrendingUp, Zap, ChevronDown, Check, Building2, Clock, MessageSquare, Award, Rocket, Globe, FileText as FileIcon } from 'lucide-react';

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  const started = useRef(false);
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now: number) => { const p = Math.min((now - start) / 1800, 1); setVal(Math.round((1 - Math.pow(1 - p, 3)) * to)); if (p < 1) raf.current = requestAnimationFrame(step); };
        raf.current = requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (el.current) obs.observe(el.current);
    return () => { obs.disconnect(); cancelAnimationFrame(raf.current); };
  }, [to]);
  return <span ref={el}>{val.toLocaleString('ar-DZ')}{suffix}</span>;
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
        supabase.from('profiles').select('*').eq('role', 'worker').order('avg_rating', { ascending: false }).limit(6),
        supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status', 'open').order('created_at', { ascending: false }).limit(6),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setWorkers(w || []); setJobs((j as Job[]) || []); setWilayas(wil || []); setLoading(false);
    })();
  }, []);

  const wName = (id: number | null) => wilayas.find(w => w.id === id)?.name || 'الجزائر';

  const STATS = [
    { icon: Users, label: 'حرفي مسجّل', value: 1200, suffix: '+', color: 'from-orange-500 to-red-500' },
    { icon: MapPin, label: 'ولاية مغطاة', value: 48, suffix: '', color: 'from-blue-500 to-cyan-500' },
    { icon: Shield, label: 'عقد منجز', value: 650, suffix: '+', color: 'from-emerald-500 to-teal-500' },
    { icon: TrendingUp, label: 'تخصص متاح', value: 130, suffix: '+', color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ═══ HERO ═══ */}
      <section className="relative bg-hero noise pattern-hero overflow-hidden" style={{ minHeight: '100vh' }}>
        <div className="absolute top-1/4 -right-32 h-[600px] w-[600px] rounded-full bg-orange-500/8 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-32 h-[500px] w-[500px] rounded-full bg-orange-700/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-28 pb-32 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-2 text-sm font-semibold text-orange-300 mb-8 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            المنصة الأولى للحرفيين والمهنيين في الجزائر
            <Zap className="h-3.5 w-3.5 text-orange-400" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] mb-6 animate-slide-up">
            اعثر على
            <br />
            <span className="relative inline-block">
              <span className="text-gradient-fire">كفاءة تتقن</span>
              <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 400 12" fill="none" preserveAspectRatio="none">
                <path d="M2 10 C80 2, 160 12, 240 6 S350 2, 398 8" stroke="url(#ug)" strokeWidth="3" strokeLinecap="round" fill="none" />
                <defs><linearGradient id="ug" x1="0" y1="0" x2="400" y2="0"><stop stopColor="#fb923c" /><stop offset="0.5" stopColor="#f97316" /><stop offset="1" stopColor="#ea580c" /></linearGradient></defs>
              </svg>
            </span>
            <br />
            <span className="text-white/40 text-3xl md:text-5xl lg:text-6xl font-light mt-2 block">ما تحتاجه</span>
          </h1>

          <p className="text-lg md:text-xl text-white/55 mb-12 max-w-2xl leading-relaxed animate-slide-up delay-100">
            تواصل مع أفضل الكفاءات في 48 ولاية جزائرية<br className="hidden md:block" />
            أكثر من 130 تخصصاً في كل المجالات
          </p>

          <div className="w-full max-w-3xl animate-slide-up delay-200">
            <div className="relative glass-dark rounded-3xl p-2 shadow-dark-lg border border-white/10">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input className="w-full h-14 bg-transparent border-0 outline-none text-white placeholder-white/30 pr-14 pl-5 text-base" placeholder="ابحث: نجار، طبيب، مهندس، مطور..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && router.push(`/search?q=${search}`)} />
                </div>
                <button onClick={() => router.push(`/search?q=${search}`)} className="btn-premium text-white font-bold px-8 py-4 rounded-2xl text-sm flex items-center gap-2 shrink-0"><Search className="h-4 w-4" />بحث الآن</button>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {['نجارة', 'مطور ويب', 'طبيب', 'مهندس', 'محاسب', 'طباخ'].map(s => (
                <button key={s} onClick={() => router.push(`/search?q=${s}`)} className="text-xs px-4 py-2 rounded-full bg-white/6 text-white/60 border border-white/10 hover:bg-white/12 hover:text-white/90 hover:border-orange-500/40 transition-all">{s}</button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in">
            <span className="text-white/30 text-xs font-medium tracking-widest uppercase">اكتشف</span>
            <ChevronDown className="h-5 w-5 text-white/30 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative -mt-20 z-20 pb-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={s.label} className={cn('glass rounded-2xl p-6 text-center shadow-dark border border-white/80 animate-slide-up', `delay-${i * 100}`)}>
                <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center mx-auto mb-3 shadow-sm', s.color)}><s.icon className="h-5 w-5 text-white" /></div>
                <p className="text-3xl font-black text-foreground tabular-nums"><Counter to={s.value} suffix={s.suffix} /></p>
                <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ALL CATEGORIES ═══ */}
      <section className="py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="section-tag mb-4">التخصصات الكاملة</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-4">كل المجالات المهنية</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">من الحرف اليدوية إلى التقنية والطب والهندسة — نغطي كل مجالات العمل في الجزائر</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SPECIALTY_CATEGORIES.map((cat, i) => (
              <Link key={cat.name} href={`/search?specialty=${encodeURIComponent(cat.specialties[0])}`} className="group block">
                <div className="relative flex flex-col items-center gap-3 p-5 rounded-2xl border bg-white hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300">
                  <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-md bg-gradient-to-br transition-transform duration-300 group-hover:scale-110', cat.gradient)}>{cat.icon}</div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground group-hover:text-orange-600 transition-colors leading-tight">{cat.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{cat.specialties.length} تخصص</p>
                  </div>
                  <div className={cn('absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity', cat.gradient)} />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="orange-outline" size="lg" className="rounded-2xl gap-2" asChild>
              <Link href="/search">تصفح جميع التخصصات <ArrowLeft className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-28 bg-dark-hero relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        <div className="absolute inset-0 pattern-hero pointer-events-none opacity-50" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-2 text-sm font-semibold text-orange-300 mb-6"><Rocket className="h-3.5 w-3.5" />كيف يعمل</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4">ثلاث خطوات بسيطة</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="absolute hidden md:block top-16 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-orange-500/40 via-orange-500 to-orange-500/40" />
            {[
              { n: '01', icon: '🔍', title: 'ابحث وتصفح', desc: 'ابحث بالتخصص أو الولاية من بين أكثر من 130 تخصصاً و1000 كفاءة' },
              { n: '02', icon: '💬', title: 'تواصل وتفاوض', desc: 'راسل الكفاءة مباشرة وناقش تفاصيل العمل والميزانية والمدة' },
              { n: '03', icon: '✅', title: 'وقّع واستلم', desc: 'وقّع عقداً رقمياً آمناً وتابع التقدم وقيّم التجربة' },
            ].map((s, i) => (
              <div key={i} className="card-dark rounded-3xl p-8 relative group">
                <div className="absolute -top-4 -right-4 text-8xl font-black text-orange-500/6 select-none pointer-events-none">{s.n}</div>
                <div className="text-4xl mb-6">{s.icon}</div>
                <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                <p className="text-white/45 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED WORKERS ═══ */}
      <section className="py-28 bg-background pattern-dots-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div><span className="section-tag mb-4">الأفضل</span><h2 className="text-4xl md:text-5xl font-black mt-4 mb-3">كفاءات متميزة</h2><p className="text-muted-foreground text-lg">الأعلى تقييماً هذا الشهر</p></div>
            <Button variant="orange-outline" className="hidden md:flex gap-2 rounded-2xl" asChild><Link href="/search">عرض الكل <ArrowLeft className="h-4 w-4" /></Link></Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border bg-white p-6 space-y-4">
                <div className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
                <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
              </div>
            )) : workers.map(w => (
              <Link key={w.id} href={`/profile/${w.id}`} className="group block h-full">
                <div className="card-premium rounded-3xl p-6 h-full flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-14 w-14 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black text-xl">{w.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        {w.availability === 'available' && <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" /></span>}
                      </div>
                      <div><h3 className="font-bold text-base leading-tight group-hover:text-orange-600 transition-colors">{w.full_name || 'كفاءة'}</h3><p className="text-sm text-muted-foreground mt-0.5">{w.specialty || 'عام'}</p></div>
                    </div>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full shrink-0', w.availability === 'available' ? 'badge-available' : 'badge-busy')}>{w.availability === 'available' ? 'متاح' : 'مشغول'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-4 w-4', i < Math.round(w.avg_rating) ? 'star-fill' : 'star-empty')} />)}</div>
                    <span className="text-sm font-semibold">{w.avg_rating > 0 ? w.avg_rating.toFixed(1) : '—'}</span>
                    {w.review_count > 0 && <span className="text-xs text-muted-foreground">({w.review_count})</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-dashed">
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-400" />{wName(w.wilaya_id)}</span>
                    {w.hourly_rate && <span className="font-black text-base text-orange-600">{formatNumber(w.hourly_rate)} <span className="text-xs font-normal text-muted-foreground">دج/س</span></span>}
                  </div>
                  {w.skills?.length > 0 && <div className="flex flex-wrap gap-1.5">{w.skills.slice(0, 3).map(s => <span key={s} className="text-[11px] bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-full font-medium">{s}</span>)}{w.skills.length > 3 && <span className="text-[11px] text-muted-foreground py-1">+{w.skills.length - 3}</span>}</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ JOBS ═══ */}
      <section className="py-28 bg-muted/30 pattern-dots-light">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div><span className="section-tag mb-4">فرص العمل</span><h2 className="text-4xl md:text-5xl font-black mt-4 mb-3">أحدث الوظائف</h2><p className="text-muted-foreground text-lg">فرص عمل حقيقية من أصحاب عمل موثوقين</p></div>
            <Button variant="orange-outline" className="hidden md:flex gap-2 rounded-2xl" asChild><Link href="/jobs">جميع الوظائف <ArrowLeft className="h-4 w-4" /></Link></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-3xl bg-white border p-6 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>)
              : jobs.length === 0 ? <div className="col-span-3 text-center py-20 text-muted-foreground"><Briefcase className="h-16 w-16 mx-auto mb-4 opacity-20" /><p className="text-lg font-medium">لا توجد وظائف متاحة حالياً</p></div>
              : jobs.map(j => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="group block h-full">
                  <div className="card-premium rounded-3xl p-6 h-full flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-base leading-snug group-hover:text-orange-600 transition-colors">{j.title}</h3>
                      {j.budget && <div className="shrink-0 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-3 py-1.5 text-center"><p className="text-[10px] text-orange-500">الميزانية</p><p className="font-black text-orange-700 text-sm">{formatNumber(j.budget)} دج</p></div>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">{j.description}</p>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed border-border/60">
                      <Badge variant="secondary" className="text-xs gap-1 rounded-full"><MapPin className="h-3 w-3" />{wName(j.wilaya_id)}</Badge>
                      {j.specialty && <Badge variant="orange" className="text-xs rounded-full">{j.specialty}</Badge>}
                      <span className="mr-auto flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{new Date(j.created_at).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="py-8 bg-foreground overflow-hidden">
        <div className="marquee-container">
          <div className="marquee-inner gap-8">
            {[...Array(2)].map((_, r) => SPECIALTY_CATEGORIES.map(cat => (
              <span key={`${r}-${cat.name}`} className="text-white/20 font-black text-2xl whitespace-nowrap px-4">
                {cat.icon} {cat.name} <span className="text-orange-500">•</span>
              </span>
            )))}
          </div>
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <section className="relative py-32 bg-hero noise overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="text-7xl mb-8">🔨</div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">هل أنت كفاءة ماهرة؟<br /><span className="text-gradient-fire">وسّع دخلك اليوم</span></h2>
          <p className="text-white/50 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">سجّل مجاناً وابدأ في استقبال طلبات من آلاف العملاء</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="2xl" className="bg-white text-orange-700 hover:bg-orange-50 font-black rounded-3xl shadow-xl" asChild><Link href="/auth?tab=register">إنشاء حساب مجاني <Rocket className="mr-2 h-5 w-5" /></Link></Button>
            <Button size="2xl" variant="glass-dark" className="rounded-3xl border border-white/15" asChild><Link href="/search">تصفح الكفاءات <ArrowLeft className="mr-2 h-5 w-5" /></Link></Button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-14">
            {[{ icon: Shield, label: 'آمن 100%' }, { icon: Globe, label: '48 ولاية' }, { icon: Users, label: '+1000 كفاءة' }, { icon: Award, label: '130+ تخصص' }].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-white/40 text-sm"><b.icon className="h-4 w-4 text-orange-500/70" />{b.label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#080500] text-white/40 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-5"><div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center shadow-orange"><span className="text-lg">🔨</span></div><span className="font-black text-xl text-white"><span className="text-orange-400">حرف</span>تي</span></Link>
              <p className="text-sm leading-relaxed text-white/35 max-w-sm">المنصة الجزائرية الأولى تربط الكفاءات بأصحاب العمل في جميع أنحاء الوطن — 130+ تخصص، 48 ولاية.</p>
            </div>
            <div><h4 className="text-white font-bold mb-5">روابط سريعة</h4><ul className="space-y-3 text-sm">{[['/', 'الرئيسية'], ['/search', 'البحث'], ['/jobs', 'الوظائف'], ['/auth', 'تسجيل الدخول']].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-orange-400 transition-colors">{l}</Link></li>)}</ul></div>
            <div><h4 className="text-white font-bold mb-5">تواصل</h4><ul className="space-y-3 text-sm"><li>📧 contact@harfati.dz</li><li>📍 الجزائر العاصمة</li><li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />جميع الخدمات تعمل</li></ul></div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
            <p>© 2026 حرفتي. جميع الحقوق محفوظة.</p>
            <div className="flex gap-6"><span className="hover:text-white/50 cursor-pointer transition-colors">سياسة الخصوصية</span><span className="hover:text-white/50 cursor-pointer transition-colors">شروط الاستخدام</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
