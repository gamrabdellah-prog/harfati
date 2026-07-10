'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Search, Menu, Bell, MessageSquare, LogOut,
  Home, Briefcase, FileText, LayoutDashboard, ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (!user) { setUnreadMessages(0); setUnreadNotifs(0); return; }
    const fetchCounts = async () => {
      const [{ count: m }, { count: n }] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ]);
      setUnreadMessages(m || 0);
      setUnreadNotifs(n || 0);
    };
    fetchCounts();
    const id = setInterval(fetchCounts, 20000);
    return () => clearInterval(id);
  }, [user]);

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/search', label: 'البحث', icon: Search },
    { href: '/jobs', label: 'الوظائف', icon: Briefcase },
  ];

  const isActive = (href: string) => pathname === href;
  const initials = profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm' : 'bg-white'}`}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-orange-500">
          <span className="text-2xl">🔨</span>
          <span>حرفتي</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/messages"
                className="relative hidden md:flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
              >
                <MessageSquare className="h-5 w-5 text-gray-600" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                href="/notifications"
                className="relative hidden md:flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-orange-500 text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-500 text-white text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <p className="font-medium text-sm">{profile?.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground font-normal">
                      {profile?.role === 'worker' ? 'حرفي' : 'صاحب عمل'}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      لوحة التحكم
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
                      </Avatar>
                      ملفي الشخصي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contracts" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      العقود
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">تسجيل الدخول</Link>
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600" asChild>
                <Link href="/auth?tab=register">إنشاء حساب</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-right">
                  <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-orange-500 font-bold text-lg">
                    <span>🔨</span> حرفتي
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                      isActive(l.href) ? 'text-orange-600 bg-orange-50' : 'hover:bg-gray-100'
                    }`}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-gray-100">
                      <LayoutDashboard className="h-4 w-4" /> لوحة التحكم
                    </Link>
                    <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-gray-100">
                      <MessageSquare className="h-4 w-4" /> الرسائل
                      {unreadMessages > 0 && <Badge className="mr-auto bg-orange-500 text-xs">{unreadMessages}</Badge>}
                    </Link>
                    <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-gray-100">
                      <Bell className="h-4 w-4" /> الإشعارات
                      {unreadNotifs > 0 && <Badge className="mr-auto bg-orange-500 text-xs">{unreadNotifs}</Badge>}
                    </Link>
                    <Link href="/contracts" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-gray-100">
                      <FileText className="h-4 w-4" /> العقود
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-red-600 hover:bg-red-50 w-full text-right mt-2"
                    >
                      <LogOut className="h-4 w-4" /> تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4 px-3">
                    <Button variant="outline" asChild>
                      <Link href="/auth" onClick={() => setMobileOpen(false)}>تسجيل الدخول</Link>
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600" asChild>
                      <Link href="/auth?tab=register" onClick={() => setMobileOpen(false)}>إنشاء حساب</Link>
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
