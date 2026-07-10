'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { validateMessageContent, sanitizeText } from '@/lib/validation';

type Conversation = {
  other: Tables['profiles'] | null;
  lastMessage: Tables['messages'] | null;
  unread: number;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('user'));
  const [messages, setMessages] = useState<Tables['messages'][]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Tables['profiles'] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [authLoading, user, router]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) { setLoadingConversations(false); return; }

    const partnerIdsSet = new Set(msgs.map((m) => m.sender_id === user.id ? m.receiver_id : m.sender_id));
    const partnerIds = Array.from(partnerIdsSet);
    if (partnerIds.length === 0) { setConversations([]); setLoadingConversations(false); return; }

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', partnerIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const convs: Conversation[] = partnerIds.map((pid) => {
      const pMsgs = msgs.filter((m) => m.sender_id === pid || m.receiver_id === pid);
      const unread = pMsgs.filter((m) => m.receiver_id === user.id && !m.is_read).length;
      return { other: profileMap.get(pid) || null, lastMessage: pMsgs[0] || null, unread };
    });

    setConversations(convs);
    setLoadingConversations(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!user) return;
    setLoadingMessages(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMessages(false);
    // Mark as read
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', partnerId).eq('receiver_id', user.id).eq('is_read', false);
    fetchConversations();
  }, [user, fetchConversations]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      supabase.from('profiles').select('*').eq('id', selectedUserId).maybeSingle().then(({ data }) => setSelectedUserProfile(data));
    }
  }, [selectedUserId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || !selectedUserId) return;
    const interval = setInterval(() => fetchMessages(selectedUserId), 5000);
    return () => clearInterval(interval);
  }, [user, selectedUserId, fetchMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUserId) return;
    const err = validateMessageContent(newMessage);
    if (err) { toast.error(err); return; }
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUserId,
      content: sanitizeText(newMessage),
    });
    setSending(false);
    if (error) {
      toast.error('فشل إرسال الرسالة');
    } else {
      setNewMessage('');
      fetchMessages(selectedUserId);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-4 h-[calc(100vh-5rem)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Conversations List */}
        <Card className="flex flex-col overflow-hidden">
          <div className="p-4 border-b font-semibold text-sm">المحادثات</div>
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                لا توجد محادثات
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.other?.id}
                  onClick={() => setSelectedUserId(conv.other?.id || null)}
                  className={`w-full flex items-center gap-3 p-4 border-b hover:bg-muted/50 transition-colors text-right ${selectedUserId === conv.other?.id ? 'bg-primary/5' : ''}`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {conv.other?.full_name?.charAt(0) || '؟'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conv.other?.full_name || 'مستخدم'}</p>
                      {conv.unread > 0 && <span className="h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">{conv.unread}</span>}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.content}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Messages Panel */}
        <Card className="md:col-span-2 flex flex-col overflow-hidden">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>اختر محادثة للبدء</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {selectedUserProfile?.full_name?.charAt(0) || '؟'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/profile/${selectedUserId}`} className="font-medium text-sm hover:text-primary">
                    {selectedUserProfile?.full_name || 'مستخدم'}
                  </Link>
                  <p className="text-xs text-muted-foreground">{selectedUserProfile?.specialty || selectedUserProfile?.role || ''}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <Skeleton className="h-10 w-48 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">ابدأ المحادثة</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالة..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
