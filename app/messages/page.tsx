'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Loader2, MessageSquare, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { validateMessage, sanitizeText, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Conv = { other: Tables['profiles'] | null; lastMsg: Tables['messages'] | null; unread: number };

export default function MessagesPage() {
  const { user, loading: al } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selId, setSelId] = useState<string | null>(sp.get('user'));
  const [messages, setMessages] = useState<Tables['messages'][]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<Tables['profiles'] | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!al && !user) router.push('/auth'); }, [al, user, router]);

  const fetchConvs = useCallback(async () => {
    if (!user) return;
    const { data: msgs } = await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false });
    if (!msgs) { setLoadingConvs(false); return; }
    const pidsSet = new Set(msgs.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id));
    const pids = Array.from(pidsSet);
    if (!pids.length) { setConvs([]); setLoadingConvs(false); return; }
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', pids);
    const pmap = new Map((profiles || []).map(p => [p.id, p]));
    setConvs(pids.map(pid => ({
      other: pmap.get(pid) || null,
      lastMsg: msgs.find(m => m.sender_id === pid || m.receiver_id === pid) || null,
      unread: msgs.filter(m => m.receiver_id === user.id && m.sender_id === pid && !m.is_read).length,
    })));
    setLoadingConvs(false);
  }, [user]);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  const fetchMsgs = useCallback(async (pid: string) => {
    if (!user) return;
    setLoadingMsgs(true);
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${pid}),and(sender_id.eq.${pid},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMsgs(false);
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', pid).eq('receiver_id', user.id).eq('is_read', false);
    fetchConvs();
  }, [user, fetchConvs]);

  useEffect(() => {
    if (!selId) return;
    fetchMsgs(selId);
    supabase.from('profiles').select('*').eq('id', selId).maybeSingle().then(({ data }) => setOtherProfile(data));
    inputRef.current?.focus();
  }, [selId, fetchMsgs]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!user || !selId) return;
    const id = setInterval(() => fetchMsgs(selId), 5000);
    return () => clearInterval(id);
  }, [user, selId, fetchMsgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selId) return;
    const err = validateMessage(newMsg); if (err) { toast.error(err); return; }
    setSending(true);
    const { error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selId, content: sanitizeText(newMsg) });
    setSending(false);
    if (error) toast.error(error.message);
    else { setNewMsg(''); fetchMsgs(selId); }
  };

  if (al) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!user) return null;

  return (
    <div className="flex bg-muted/20" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Sidebar ── */}
      <div className={cn('flex flex-col bg-white border-l shadow-sm', selId ? 'hidden md:flex w-80 shrink-0' : 'flex-1 md:w-80 md:flex-none md:shrink-0')}>
        {/* Sidebar header */}
        <div className="p-5 border-b bg-gradient-to-br from-orange-500 to-orange-700">
          <h2 className="font-black text-xl text-white mb-4">الرسائل</h2>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input className="w-full h-10 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 pr-11 pl-4 text-sm focus:outline-none focus:bg-white/15" placeholder="ابحث في المحادثات..." />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loadingConvs ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : convs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-15" />
              <p className="font-bold mb-1">لا توجد محادثات</p>
              <p className="text-xs">تواصل مع حرفي من صفحة ملفه الشخصي</p>
            </div>
          ) : (
            convs.map(c => (
              <button key={c.other?.id} onClick={() => setSelId(c.other?.id || null)}
                className={cn('w-full flex items-center gap-3 p-4 border-b border-border/40 hover:bg-orange-50/50 text-right transition-all',
                  selId === c.other?.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : '')}>
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 ring-2 ring-orange-100">
                    <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black">
                      {c.other?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {c.unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn('text-sm font-bold truncate', selId === c.other?.id ? 'text-orange-700' : '')}>
                      {c.other?.full_name || 'مستخدم'}
                    </p>
                    {c.lastMsg && <p className="text-[10px] text-muted-foreground shrink-0">{formatTime(c.lastMsg.created_at)}</p>}
                  </div>
                  {c.lastMsg && <p className={cn('text-xs truncate', c.unread > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground')}>{c.lastMsg.content}</p>}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* ── Chat area ── */}
      <div className={cn('flex-1 flex flex-col', !selId ? 'hidden md:flex' : 'flex')}>
        {!selId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-20 w-20 mx-auto mb-5 opacity-8" />
              <h3 className="text-2xl font-black mb-2">اختر محادثة</h3>
              <p className="text-sm">اختر محادثة من القائمة أو ابدأ محادثة جديدة</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b p-4 flex items-center gap-3 shadow-sm">
              <button onClick={() => setSelId(null)} className="md:hidden text-muted-foreground hover:text-foreground transition-colors ml-1">
                <ChevronRight className="h-5 w-5" />
              </button>
              <Avatar className="h-11 w-11 ring-2 ring-orange-100">
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black">
                  {otherProfile?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/profile/${selId}`} className="font-bold hover:text-orange-600 transition-colors">
                  {otherProfile?.full_name || 'مستخدم'}
                </Link>
                {otherProfile?.specialty && <p className="text-xs text-muted-foreground">{otherProfile.specialty}</p>}
              </div>
              <div className="mr-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">متصل</span>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-5">
              {loadingMsgs ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                      <Skeleton className={cn('h-12 rounded-3xl', i % 2 === 0 ? 'w-56' : 'w-44')} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 py-20">
                  <div className="h-20 w-20 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-3xl">💬</div>
                  <p className="font-bold">ابدأ المحادثة</p>
                  <p className="text-sm text-center max-w-xs">أرسل أول رسالة لـ {otherProfile?.full_name || 'هذا المستخدم'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, i) => {
                    const isMe = m.sender_id === user.id;
                    const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender_id !== m.sender_id);
                    const showTime = i === messages.length - 1 || messages[i + 1]?.sender_id !== m.sender_id;
                    return (
                      <div key={m.id} className={cn('flex items-end gap-2', isMe ? 'justify-start flex-row-reverse' : 'justify-start')}>
                        {!isMe && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white text-xs font-black">
                                  {otherProfile?.full_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                        <div className={cn('flex flex-col gap-1 max-w-[72%]', isMe ? 'items-start' : 'items-end')}>
                          <div className={cn('px-5 py-3 rounded-3xl text-sm leading-relaxed shadow-sm',
                            isMe ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-lg' : 'bg-white text-foreground rounded-bl-lg border border-border/60')}>
                            {m.content}
                          </div>
                          {showTime && (
                            <p className={cn('text-[10px] text-muted-foreground px-1', isMe ? 'text-right' : 'text-left')}>
                              {formatTime(m.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={send} className="bg-white border-t p-4 flex gap-3 items-end">
              <Input
                ref={inputRef}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 rounded-2xl"
                disabled={sending}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
              />
              <Button type="submit" variant="premium" size="icon-lg" className="rounded-2xl shrink-0 shadow-orange" disabled={sending || !newMsg.trim()}>
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
