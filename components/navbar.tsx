'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Search, Menu, Bell, MessageSquare, User, LogOut, Home,
  Briefcase, FileText, LayoutDashboard, ChevronDown, Hammer,
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
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
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/search', label: 'البحث', icon: Search },
    { href: '/jobs', label: 'الوظائف', icon: Briefcase },
  ];

  const isActive = (href: string) => pathname === href;
  const initials = profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '؟';

  return (
    <nav className={`sticky top-0 z-40 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border' : 'bg-white border-b border-border'}`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary shrink-0">
          <Hammer className="h-6 w-6" />
          <span>حرفتي</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/messages" className="relative hidden md:flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
              <Link href="/notifications" className="relative hidden md:flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground">{profile?.role === 'worker' ? 'حرفي' : 'صاحب عمل'}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      لوحة التحكم
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      الملف الشخصي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contracts" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      العقود
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
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
              <Button size="sm" asChild>
                <Link href="/auth?tab=register">إنشاء حساب</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="text-right">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-primary font-bold text-lg">
                  <Hammer className="h-5 w-5" />
                  حرفتي
                </Link>
              </SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                      isActive(link.href) ? 'text-primary bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link href="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-muted">
                      <MessageSquare className="h-4 w-4" />
                      الرسائل
                      {unreadMessages > 0 && <Badge className="mr-auto text-xs">{unreadMessages}</Badge>}
                    </Link>
                    <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-muted">
                      <Bell className="h-4 w-4" />
                      الإشعارات
                      {unreadNotifs > 0 && <Badge className="mr-auto text-xs">{unreadNotifs}</Badge>}
                    </Link>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-muted">
                      <LayoutDashboard className="h-4 w-4" />
                      لوحة التحكم
                    </Link>
                    <Link href="/contracts" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-muted">
                      <FileText className="h-4 w-4" />
                      العقود
                    </Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-muted w-full text-right mt-2">
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button variant="outline" asChild>
                      <Link href="/auth" onClick={() => setMobileOpen(false)}>تسجيل الدخول</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth?tab=register" onClick={() => setMobileOpen(false)}>إنشاء حساب</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
