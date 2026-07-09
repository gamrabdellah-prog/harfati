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
import {
  Hammer, Search, MapPin, Star, ArrowLeft,
  Users, Briefcase, FileCheck, Phone, Mail, Facebook, Instagram, Linkedin,
  Wrench, Building2, Zap, PaintRoller, Car, Sparkles,
} from 'lucide-react';

const categoryGradients = ['cat-grad-1', 'cat-grad-2', 'cat-grad-3', 'cat-grad-4', 'cat-grad-5', 'cat-grad-6'];
const categoryIcons = [Wrench, Building2, Zap, PaintRoller, Car, Sparkles];

export default function HomePage() {
  const router = useRouter();
  const [featuredWorkers, setFeaturedWorkers] = useState<Tables['profiles'][]>([]);
  const [latestJobs, setLatestJobs] = useState<(Tables['jobs'] & { employer: Tables['profiles'] | null })[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: workers } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'worker')
        .eq('availability', 'available')
        .order('avg_rating', { ascending: false })
        .limit(6);
      setFeaturedWorkers(workers || []);

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_employer_id_fkey(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(4);
      setLatestJobs(jobs || []);

      const { data: w } = await supabase.from('wilayas').select('*').order('id');
      setWilayas(w || []);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedWilaya) params.set('wilaya', selectedWilaya);
    if (selectedSpecialty) params.set('specialty', selectedSpecialty);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="overflow-x-hidden">
      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 hero-pattern opacity-60" />
        {/* Floating decorative shapes */}
        <div className="absolute top-20 left-10 w-24 h-24 rounded-2xl bg-white/10 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-32 right-16 w-16 h-16 rounded-full bg-white/10 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-12 h-12 rounded-lg bg-white/5 animate-float" style={{ animationDelay: '4s' }} />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-white text-sm font-medium mb-8 animate-fade-in-up opacity-0">
              <Hammer className="w-4 h-4" />
              منصة الحرفيين الجزائرية الأولى
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.15] text-balance animate-fade-in-up opacity-0 stagger-1">
              ابحث عن وظيفة أو حرفة
              <br />
              <span className="text-white/90">في كل ولايات الجزائر</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0 stagger-2">
              حرفتي تربطك بأفضل الكفاءات في كل التخصصات. ابحث عن وظيفة، اعرض مهاراتك، أو وظف العمال المناسبين لك.
            </p>

            {/* Glassmorphism Search Bar */}
            <div className="glass-light rounded-3xl p-4 md:p-6 max-w-4xl mx-auto animate-scale-in opacity-0 stagger-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500" />
                    <Input
                      placeholder="ابحث عن حرفي أو تخصص..."
                      className="pr-12 h-14 text-base border-0 bg-white/70 focus:bg-white focus:ring-2 focus:ring-primary-400 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <div className="md:col-span-4">
                  <div className="relative">
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 pointer-events-none z-10" />
                    <select
                      className="w-full h-14 rounded-xl border-0 bg-white/70 px-12 text-base outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer appearance-none"
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
                <div className="md:col-span-3">
                  <Button
                    onClick={handleSearch}
                    className="w-full h-14 bg-primary-500 hover:bg-primary-600 text-white font-bold text-base rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all"
                  >
                    <Search className="w-5 h-5 ml-2" />
                    بحث
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto mt-14 animate-fade-in-up opacity-0 stagger-4">
              {[
                { icon: Users, value: '+1000', label: 'حرفي مسجل' },
                { icon: MapPin, value: '48', label: 'ولاية' },
                { icon: FileCheck, value: '+500', label: 'عقد منجز' },
              ].map((stat, i) => (
                <div key={i} className="glass rounded-2xl p-4 md:p-6 text-center">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-white/80 mx-auto mb-2" />
                  <div className="text-2xl md:text-4xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs md:text-sm text-white/70 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0,80 C480,0 960,0 1440,80 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* ===== Specialties ===== */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">كل التخصصات</h2>
          <p className="text-muted-foreground text-lg">اختر التخصص الذي تبحث عنه من بين فئاتنا المتنوعة</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALTY_CATEGORIES.map((cat, idx) => {
            const Icon = categoryIcons[idx % categoryIcons.length];
            const gradClass = categoryGradients[idx % categoryGradients.length];
            return (
              <div
                key={cat.name}
                className="bg-white rounded-2xl border border-border/60 p-6 card-hover animate-fade-in-up opacity-0"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${gradClass} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground">{cat.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.specialties.map((s) => (
                    <Link key={s.label} href={`/search?specialty=${encodeURIComponent(s.label)}`}>
                      <Badge
                        variant="secondary"
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary-100 hover:text-primary-600 transition-all hover:scale-105"
                      >
                        <span className="ml-1">{s.icon}</span>
                        {s.label}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Featured Workers ===== */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-muted/40 to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">حرفيون متميزون</h2>
              <p className="text-muted-foreground">أفضل الحرفيين تقييماً على المنصة</p>
            </div>
            <Link href="/search" className="text-primary-500 hover:text-primary-600 text-sm font-bold flex items-center gap-1 shrink-0">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-56 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredWorkers.map((worker, i) => (
                <Link key={worker.id} href={`/profile/${worker.id}`}>
                  <Card
                    className="h-full card-hover border-border/60 cursor-pointer overflow-hidden animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="h-2 bg-gradient-to-l from-primary-400 to-primary-600" />
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16 border-2 border-primary-100 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 font-bold text-xl">
                            {worker.full_name?.charAt(0) || '؟'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-foreground truncate">{worker.full_name || 'حرفي'}</h3>
                          <p className="text-sm text-primary-500 font-semibold">{worker.specialty || 'عامل'}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {wilayas.find(w => w.id === worker.wilaya_id)?.name || 'الجزائر'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              {worker.avg_rating?.toFixed(1) || '0.0'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 flex items-center gap-2">
                        <Badge
                          variant={worker.availability === 'available' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {worker.availability === 'available' ? 'متاح' : worker.availability === 'busy' ? 'مشغول' : 'غير متاح'}
                        </Badge>
                        {worker.hourly_rate && (
                          <span className="text-sm font-semibold text-foreground">{worker.hourly_rate} دج/ساعة</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Latest Jobs ===== */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">آخر الوظائف</h2>
            <p className="text-muted-foreground">أحدث الوظائف المنشورة على المنصة</p>
          </div>
          <Link href="/jobs" className="text-primary-500 hover:text-primary-600 text-sm font-bold flex items-center gap-1 shrink-0">
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-40 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {latestJobs.map((job, i) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card
                  className="h-full card-hover border-border/60 cursor-pointer animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground mb-2">{job.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {wilayas.find(w => w.id === job.wilaya_id)?.name || 'الجزائر'}
                          </span>
                          {job.budget && (
                            <span className="font-bold text-primary-500">{job.budget} دج</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs bg-primary-50 text-primary-600 border-primary-200">
                        {job.specialty || 'عام'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden hero-gradient">
          <div className="absolute inset-0 hero-pattern opacity-50" />
          <div className="relative z-10 p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">هل أنت حرفي؟ انضم إلينا اليوم</h2>
            <p className="text-white/80 mb-10 max-w-xl mx-auto text-lg">
              عرض مهاراتك، اكتسب عملاء جدد، وابنِ سمعتك المهنية في منصة حرفتي
            </p>
            <Link href="/auth">
              <Button
                size="lg"
                className="bg-white text-primary-500 hover:bg-white/90 font-bold px-10 py-6 text-lg rounded-xl shadow-xl hover:scale-105 transition-transform"
              >
                إنشاء حساب حرفي
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Hammer className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">حرفتي</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed">
                منصة جزائرية تربط الحرفيين بأصحاب العمل في كل ولايات الوطن
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/" className="hover:text-primary-400 transition-colors">الرئيسية</Link></li>
                <li><Link href="/search" className="hover:text-primary-400 transition-colors">البحث عن حرفي</Link></li>
                <li><Link href="/jobs" className="hover:text-primary-400 transition-colors">الوظائف</Link></li>
                <li><Link href="/auth" className="hover:text-primary-400 transition-colors">إنشاء حساب</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4">تواصل معنا</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-400" />
                  <span dir="ltr">+213 21 00 00 00</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-400" />
                  <span>contact@harafati.dz</span>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-bold mb-4">تابعنا</h4>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: 'Facebook' },
                  { icon: Instagram, label: 'Instagram' },
                  { icon: Linkedin, label: 'LinkedIn' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-primary-500 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <social.icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-400">
            <p>© 2026 حرفتي. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
