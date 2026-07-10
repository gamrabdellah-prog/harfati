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
import { Search, MapPin, Star, ArrowLeft, Users, Briefcase, Shield } from 'lucide-react';

type Worker = Tables['profiles'];
type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };

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
        supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status', 'open').order('created_at', { ascending: false }).limit(4),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setWorkers(w || []);
      setJobs((j as Job[]) || []);
      setWilayas(wil || []);
      setLoading(false);
    })();
  }, []);

  const wilayaName = (id: number | null) =>
    wilayas.find((w) => w.id === id)?.name || 'الجزائر';

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            ابحث عن حرفي متخصص
          </h1>
          <p className="text-lg text-orange-100 mb-8 max-w-xl mx-auto">
            منصة حرفتي تربطك بأفضل الحرفيين والعمال المهرة في كل ولايات الجزائر
          </p>

          <div className="flex max-w-xl mx-auto gap-2 bg-white rounded-xl p-2 shadow-lg">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن تخصص، نجار، كهربائي..."
                className="pr-9 border-0 focus-visible:ring-0 text-gray-900"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${search}`)}
              />
            </div>
            <Button
              className="bg-orange-500 hover:bg-orange-600 shrink-0"
              onClick={() => router.push(`/search?q=${search}`)}
            >
              بحث
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { icon: Users, value: '+1000', label: 'حرفي مسجل' },
              { icon: MapPin, value: '48', label: 'ولاية' },
              { icon: Shield, value: '+500', label: 'عقد منجز' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-orange-100 text-sm">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">تصفح حسب التخصص</h2>
            <p className="text-gray-500">اختر التخصص الذي تبحث عنه</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SPECIALTY_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/search?specialty=${encodeURIComponent(cat.specialties[0])}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700 text-center group-hover:text-orange-600">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Workers */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">حرفيون متميزون</h2>
              <p className="text-gray-500 mt-1">الأعلى تقييماً على المنصة</p>
            </div>
            <Button variant="ghost" className="text-orange-600 hover:text-orange-700" asChild>
              <Link href="/search" className="flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              : workers.map((w) => (
                  <Link key={w.id} href={`/profile/${w.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-lg">
                              {w.full_name?.charAt(0) || '؟'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{w.full_name || 'حرفي'}</h3>
                            <p className="text-sm text-gray-500">{w.specialty || 'عامل'}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${
                              w.availability === 'available'
                                ? 'border-green-200 text-green-700 bg-green-50'
                                : 'border-amber-200 text-amber-700 bg-amber-50'
                            }`}
                          >
                            {w.availability === 'available' ? 'متاح' : 'مشغول'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < Math.round(w.avg_rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200 fill-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-500 mr-1">
                            {w.avg_rating > 0 ? w.avg_rating.toFixed(1) : 'جديد'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {wilayaName(w.wilaya_id)}
                          </span>
                          {w.hourly_rate && (
                            <span className="font-semibold text-orange-600">
                              {w.hourly_rate.toLocaleString()} دج/س
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">آخر الوظائف</h2>
              <p className="text-gray-500 mt-1">فرص عمل منشورة حديثاً</p>
            </div>
            <Button variant="ghost" className="text-orange-600 hover:text-orange-700" asChild>
              <Link href="/jobs" className="flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              : jobs.length === 0
              ? (
                  <div className="col-span-2 text-center py-12 text-gray-400">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد وظائف متاحة حالياً</p>
                  </div>
                )
              : jobs.map((j) => (
                  <Link key={j.id} href={`/jobs/${j.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold">{j.title}</h3>
                          {j.budget && (
                            <span className="text-orange-600 font-bold text-sm shrink-0">
                              {j.budget.toLocaleString()} دج
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{j.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {wilayaName(j.wilaya_id)}
                          </Badge>
                          {j.specialty && (
                            <Badge variant="outline" className="text-xs">{j.specialty}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-700 text-white text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-extrabold mb-4">هل أنت حرفي؟</h2>
          <p className="text-orange-100 text-lg mb-8">
            سجّل مجاناً وابدأ في تلقي طلبات العمل من عملاء في كل الجزائر
          </p>
          <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8" asChild>
            <Link href="/auth?tab=register">انضم الآن مجاناً</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-white font-bold text-xl mb-3">
            <span>🔨</span> حرفتي
          </div>
          <p className="text-sm mb-4">منصة جزائرية تربط الحرفيين بأصحاب العمل</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <Link href="/search" className="hover:text-white transition-colors">البحث</Link>
            <Link href="/jobs" className="hover:text-white transition-colors">الوظائف</Link>
            <Link href="/auth" className="hover:text-white transition-colors">تسجيل الدخول</Link>
          </div>
          <p className="text-xs mt-6">© 2026 حرفتي. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
