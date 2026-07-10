'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Search, Menu, Bell, MessageSquare, LogOut, Home, Briefcase, FileText, LayoutDashboard, ChevronDown, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/search', label: 'البحث', icon: Search },
  { href: '/jobs', label: 'الوظائف', icon: Briefcase },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(0);
  const [notifs, setNotifs] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!user) { setMsgs(0); setNotifs(0); return; }
    const fetch = async () => {
      const [{ count: m }, { count: n }] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ]);
      setMsgs(m || 0); setNotifs(n || 0);
    };
    fetch();
    const id = setInterval(fetch, 20000);
    return () => clearInterval(id);
  }, [user]);

  const active = (href: string) => pathname === href;
  const initials = (profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase();

  const NotifDot = ({ count }: { count: number }) => count > 0 ? (
    <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-[9px] font-black text-white flex items-center justify-center px-1 ring-2 ring-white shadow-sm animate-scale-up">
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled ? 'glass-nav' : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">

        {/* ── Logo ── */}
        <Link href="/" className="group flex items-center gap-3">
          <div className={cn(
            'relative h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-300',
            'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700',
            'shadow-orange group-hover:shadow-glow-sm group-hover:scale-105'
          )}>
            <span className="text-lg">🔨</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="leading-none">
            <div className="font-black text-xl tracking-tight">
              <span className="text-gradient-orange">حرف</span>
              <span className="text-foreground">تي</span>
            </div>
            <div className="text-[9px] font-medium text-muted-foreground tracking-widest uppercase opacity-70">منصة الحرفيين</div>
          </div>
        </Link>

        {/* ── Desktop nav pill ── */}
        <nav className="hidden md:flex items-center gap-1 rounded-2xl bg-muted/50 border border-border/50 p-1.5">
          {NAV.map(l => (
            <Link key={l.href} href={l.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                active(l.href)
                  ? 'bg-white text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
              )}>
              <l.icon className="h-3.5 w-3.5" />
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              {/* Icon buttons */}
              {[
                { href: '/messages', Icon: MessageSquare, count: msgs },
                { href: '/notifications', Icon: Bell, count: notifs },
              ].map(({ href, Icon, count }) => (
                <Link key={href} href={href}
                  className="relative hidden md:flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted transition-colors">
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                  <NotifDot count={count} />
                </Link>
              ))}

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2.5 rounded-2xl px-3 py-1.5 hover:bg-muted transition-all group ml-1">
                    <div className="relative">
                      <Avatar className="h-8 w-8 ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>
                    <div className="hidden lg:block text-right">
                      <p className="text-xs font-bold leading-none">{profile?.full_name?.split(' ')[0] || 'حسابي'}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{profile?.role === 'worker' ? '🔨 حرفي' : '🏢 صاحب عمل'}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden lg:block transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3 p-1">
                      <Avatar className="h-10 w-10 ring-2 ring-orange-100">
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{profile?.full_name || user.email}</p>
                        <p className="text-xs text-muted-foreground font-normal">{profile?.role === 'worker' ? 'حرفي / عامل' : 'صاحب عمل'}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="h-4 w-4" />لوحة التحكم</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href={`/profile/${user.id}`}><Avatar className="h-4 w-4"><AvatarFallback className="text-[8px] bg-orange-50 text-orange-600">{initials}</AvatarFallback></Avatar>ملفي الشخصي</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/contracts"><FileText className="h-4 w-4" />العقود</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="h-4 w-4" />تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild><Link href="/auth">دخول</Link></Button>
              <Button variant="premium" size="sm" className="gap-2 rounded-2xl" asChild>
                <Link href="/auth?tab=register"><Sparkles className="h-3.5 w-3.5" />انضم الآن</Link>
              </Button>
            </div>
          )}

          {/* Mobile trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              {/* Sidebar header */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 px-6 pt-12 pb-8">
                <SheetHeader>
                  <SheetTitle>
                    <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                      <span className="text-2xl">🔨</span>
                      <span className="font-black text-xl text-white">حرفتي</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                {user && (
                  <div className="flex items-center gap-3 mt-6">
                    <Avatar className="h-12 w-12 ring-2 ring-white/30">
                      <AvatarFallback className="bg-white/20 text-white font-black text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white text-sm">{profile?.full_name || user.email}</p>
                      <p className="text-white/70 text-xs">{profile?.role === 'worker' ? '🔨 حرفي' : '🏢 صاحب عمل'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-1">
                {NAV.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      active(l.href) ? 'bg-orange-50 text-orange-700 font-bold' : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                    )}>
                    <l.icon className="h-4.5 w-4.5" />{l.label}
                  </Link>
                ))}

                {user ? (
                  <>
                    <div className="h-px bg-border my-2" />
                    {[
                      { href: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
                      { href: '/messages', icon: MessageSquare, label: 'الرسائل', count: msgs },
                      { href: '/notifications', icon: Bell, label: 'الإشعارات', count: notifs },
                      { href: '/contracts', icon: FileText, label: 'العقود' },
                    ].map(l => (
                      <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-all font-medium">
                        <l.icon className="h-4.5 w-4.5" />
                        {l.label}
                        {!!l.count && l.count > 0 && (
                          <span className="mr-auto h-5 min-w-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1">{l.count}</span>
                        )}
                      </Link>
                    ))}
                    <div className="h-px bg-border my-2" />
                    <button onClick={() => { signOut(); setOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all font-medium w-full text-right">
                      <LogOut className="h-4.5 w-4.5" />تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full" asChild><Link href="/auth" onClick={() => setOpen(false)}>تسجيل الدخول</Link></Button>
                    <Button variant="premium" className="w-full gap-2" asChild>
                      <Link href="/auth?tab=register" onClick={() => setOpen(false)}><Sparkles className="h-4 w-4" />إنشاء حساب مجاناً</Link>
                    </Button>
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
