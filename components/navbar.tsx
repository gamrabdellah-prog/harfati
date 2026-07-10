'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Search, Menu, Bell, MessageSquare, LogOut, Home, Briefcase, FileText, LayoutDashboard, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/search', label: 'البحث', icon: Search },
  { href: '/jobs', label: 'الوظائف', icon: Briefcase },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!user) { setUnreadMsg(0); setUnreadNotif(0); return; }
    const fetch = async () => {
      const [{ count: m }, { count: n }] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ]);
      setUnreadMsg(m || 0); setUnreadNotif(n || 0);
    };
    fetch();
    const id = setInterval(fetch, 20000);
    return () => clearInterval(id);
  }, [user]);

  const isActive = (href: string) => pathname === href;
  const initials = (profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase();

  const IconBadge = ({ count, children }: { count: number; children: React.ReactNode }) => (
    <div className="relative">
      {children}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full transition-all duration-300',
      scrolled
        ? 'bg-white/90 backdrop-blur-xl border-b border-border/50 shadow-sm'
        : 'bg-white border-b border-border/30'
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
            <span className="text-lg">🔨</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            <span className="text-gradient">حرف</span><span className="text-foreground">تي</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/40 rounded-2xl px-2 py-1.5">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive(l.href)
                  ? 'bg-white text-orange-600 shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/60')}>
              <l.icon className="h-3.5 w-3.5" />{l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/messages" className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
                <IconBadge count={unreadMsg}><MessageSquare className="h-4.5 w-4.5 text-muted-foreground" /></IconBadge>
              </Link>
              <Link href="/notifications" className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
                <IconBadge count={unreadNotif}><Bell className="h-4.5 w-4.5 text-muted-foreground" /></IconBadge>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-muted transition-colors group">
                    <Avatar className="h-8 w-8 ring-2 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="text-right hidden lg:block">
                      <p className="text-xs font-semibold leading-none">{profile?.full_name?.split(' ')[0] || 'حسابي'}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{profile?.role === 'worker' ? 'حرفي' : 'صاحب عمل'}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-semibold">{profile?.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">{profile?.role === 'worker' ? '🔨 حرفي / عامل' : '🏢 صاحب عمل'}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer"><LayoutDashboard className="h-4 w-4 text-muted-foreground" />لوحة التحكم</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href={`/profile/${user.id}`} className="flex items-center gap-2.5 cursor-pointer"><Avatar className="h-4 w-4"><AvatarFallback className="text-[8px] bg-orange-100 text-orange-700">{initials}</AvatarFallback></Avatar>ملفي الشخصي</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/contracts" className="flex items-center gap-2.5 cursor-pointer"><FileText className="h-4 w-4 text-muted-foreground" />العقود</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2.5 cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50"><LogOut className="h-4 w-4" />تسجيل الخروج</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild><Link href="/auth">دخول</Link></Button>
              <Button variant="premium" size="sm" asChild><Link href="/auth?tab=register">إنشاء حساب</Link></Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-xl"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center"><span>🔨</span></div>
                    <span className="font-extrabold text-lg"><span className="text-gradient">حرف</span><span>تي</span></span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                    className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive(l.href) ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-600 hover:bg-gray-50')}>
                    <l.icon className="h-4 w-4" />{l.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <div className="my-2 h-px bg-border" />
                    {[
                      { href: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
                      { href: '/messages', icon: MessageSquare, label: 'الرسائل', count: unreadMsg },
                      { href: '/notifications', icon: Bell, label: 'الإشعارات', count: unreadNotif },
                      { href: '/contracts', icon: FileText, label: 'العقود' },
                    ].map((l) => (
                      <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                        <l.icon className="h-4 w-4 text-muted-foreground" />{l.label}
                        {!!l.count && l.count > 0 && <span className="mr-auto h-5 min-w-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center px-1">{l.count}</span>}
                      </Link>
                    ))}
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors mt-2 w-full text-right">
                      <LogOut className="h-4 w-4" />تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button variant="outline" asChild><Link href="/auth" onClick={() => setMobileOpen(false)}>تسجيل الدخول</Link></Button>
                    <Button variant="premium" asChild><Link href="/auth?tab=register" onClick={() => setMobileOpen(false)}>إنشاء حساب مجاناً</Link></Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
