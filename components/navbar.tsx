'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Menu,
  Bell,
  MessageSquare,
  User,
  LogOut,
  Home,
  Briefcase,
  FileText,
  LayoutDashboard,
  ChevronDown,
  Hammer,
} from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/search', label: 'البحث', icon: Search },
    { href: '/jobs', label: 'الوظائف', icon: Briefcase },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary-600 tracking-tight">حرفتي</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive(link.href)
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/messages" className="hidden md:flex">
                <Button variant="ghost" size="icon" className="relative rounded-lg">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </Button>
              </Link>
              <Link href="/notifications" className="hidden md:flex">
                <Button variant="ghost" size="icon" className="relative rounded-lg">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-lg px-2">
                    <Avatar className="w-8 h-8 border border-border">
                      <AvatarFallback className="bg-primary-100 text-primary-600 text-sm font-semibold">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      لوحة التحكم
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      الملف الشخصي
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/contracts" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      العقود
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-error-500 flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth" className="hidden md:block">
                <Button variant="ghost" className="text-sm font-medium">تسجيل الدخول</Button>
              </Link>
              <Link href="/auth" className="hidden md:block">
                <Button className="bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium">إنشاء حساب</Button>
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-lg">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">القائمة</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                      <Hammer className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-primary-600">حرفتي</span>
                  </Link>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                        isActive(link.href)
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <LayoutDashboard className="w-5 h-5" />
                        لوحة التحكم
                      </Link>
                      <Link href="/messages" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <MessageSquare className="w-5 h-5" />
                        الرسائل
                      </Link>
                      <Link href="/notifications" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Bell className="w-5 h-5" />
                        الإشعارات
                      </Link>
                      <Link href="/contracts" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <FileText className="w-5 h-5" />
                        العقود
                      </Link>
                      <Link href={`/profile/${user.id}`} onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <User className="w-5 h-5" />
                        الملف الشخصي
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setMobileOpen(false);
                        }}
                        className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 text-error-500 hover:bg-error-50 text-right w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        تسجيل الخروج
                      </button>
                    </>
                  )}
                  {!user && (
                    <>
                      <Link href="/auth" onClick={() => setMobileOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <User className="w-5 h-5" />
                        تسجيل الدخول
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
