'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Loader2, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { validateMessageContent, sanitizeText, validateTitle, validateAmount, validateComment } from '@/lib/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Conversation = {
  other: Tables['profiles'] | null;
  lastMessage: Tables['messages'] | null;
  unread: number;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(searchParams.get('user'));
  const [messages, setMessages] = useState<Tables['messages'][]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Tables['profiles'] | null>(null);
  const [contractOpen, setContractOpen] = useState(false);
  const [contractForm, setContractForm] = useState({ title: '', description: '', amount: '', terms: '' });
  const [creatingContract, setCreatingContract] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: allMessages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    const convMap = new Map<string, { lastMsg: Tables['messages']; unread: number }>();
    (allMessages || []).forEach((msg) => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { lastMsg: msg, unread: 0 });
      }
      if (msg.receiver_id === user.id && !msg.is_read) {
        const c = convMap.get(otherId);
        if (c) c.unread++;
      }
    });

    const uniqueUsers = Array.from(convMap.keys());
    let profiles: Tables['profiles'][] | null = null;
    if (uniqueUsers.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueUsers);
      profiles = data;
    }

    const convs: Conversation[] = Array.from(convMap.entries()).map(([otherId, val]) => ({
      other: profiles?.find(p => p.id === otherId) || null,
      lastMessage: val.lastMsg,
      unread: val.unread,
    }));
    setConversations(convs);
    setLoadingConversations(false);
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !selectedUser) return;
    setLoadingMessages(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMessages(false);

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', selectedUser)
      .eq('is_read', false);
  }, [user, selectedUser]);

  // Fetch the selected user's profile immediately when chat opens
  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', selectedUser)
      .single()
      .then(({ data }) => setSelectedUserProfile(data));
  }, [selectedUser]);

  // Initial conversation fetch + real-time subscription for new messages
  useEffect(() => {
    fetchConversations();

    if (!user) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
          // If the new message is from the currently selected user, fetch messages too
          // (fetchMessages will be triggered by the messages subscription below)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // Fetch messages when selected user changes + real-time subscription for the conversation
  useEffect(() => {
    fetchMessages();

    if (!user || !selectedUser) return;

    const channel = supabase
      .channel(`messages-${selectedUser}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${selectedUser}`,
        },
        (payload) => {
          // Only add if the message is directed at the current user
          const newMsg = payload.new as Tables['messages'];
          if (newMsg.receiver_id === user.id) {
            setMessages((prev) => [...prev, newMsg]);
            // Mark as read immediately since we're viewing the conversation
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
              .eq('is_read', false)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser, fetchMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUser) return;
    const contentErr = validateMessageContent(newMessage);
    if (contentErr) { toast.error(contentErr); return; }
    setSending(true);
    const content = sanitizeText(newMessage);
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedUser,
        content,
      })
      .select()
      .single();

    setSending(false);
    if (error) {
      toast.error('فشل الإرسال: ' + error.message);
    } else {
      setNewMessage('');
      // Optimistically add the sent message to the UI immediately
      if (data) {
        setMessages((prev) => [...prev, data]);
      }
      // Refresh conversations to update the last message preview
      fetchConversations();
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUser) return;
    const titleErr = validateTitle(contractForm.title);
    const amountErr = validateAmount(contractForm.amount);
    const termsErr = contractForm.terms ? validateComment(contractForm.terms) : null;
    if (titleErr) { toast.error(titleErr); return; }
    if (amountErr) { toast.error(amountErr); return; }
    if (termsErr) { toast.error(termsErr); return; }
    setCreatingContract(true);
    const { error } = await supabase.from('contracts').insert({
      employer_id: user.id,
      worker_id: selectedUser,
      title: sanitizeText(contractForm.title),
      description: contractForm.description ? sanitizeText(contractForm.description) : null,
      amount: parseInt(contractForm.amount, 10),
      terms: contractForm.terms ? sanitizeText(contractForm.terms) : null,
    });
    setCreatingContract(false);
    if (error) {
      toast.error('فشل إنشاء العقد: ' + error.message);
    } else {
      toast.success('تم إنشاء العقد بنجاح');
      setContractOpen(false);
      setContractForm({ title: '', description: '', amount: '', terms: '' });
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)]">
          <div className="flex h-full gap-4">
            <Skeleton className="w-80 shrink-0 rounded-xl" />
            <Skeleton className="flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">يجب تسجيل الدخول للوصول للرسائل</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)]">
        <div className="flex h-full gap-4">
          {/* Conversations list */}
          <Card className="w-80 shrink-0 border-border/60 overflow-hidden hidden md:flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-lg">الرسائل</h2>
            </div>
            <ScrollArea className="flex-1">
              {loadingConversations ? (
                <div className="p-3 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد محادثات</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map((conv, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedUser(conv.other?.id || null)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right ${
                        selectedUser === conv.other?.id ? 'bg-primary-50' : 'hover:bg-muted'
                      }`}
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="bg-primary-100 text-primary-600 text-sm font-bold">
                          {conv.other?.full_name?.charAt(0) || '؟'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{conv.other?.full_name || 'مستخدم'}</span>
                          {conv.unread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center shrink-0">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage?.content || ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Messages */}
          <Card className="flex-1 border-border/60 overflow-hidden flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary-100 text-primary-600 text-sm font-bold">
                      {selectedUserProfile?.full_name?.charAt(0) || '؟'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium flex-1">
                    {selectedUserProfile?.full_name || 'مستخدم'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setContractOpen(true)}
                  >
                    <FileText className="w-4 h-4 ml-2" />
                    إنشاء عقد
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <Skeleton className="h-12 w-48 rounded-2xl" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                              isMe
                                ? 'bg-primary-500 text-white rounded-tr-none'
                                : 'bg-muted text-foreground rounded-tl-none'
                            }`}>
                              <p>{msg.content}</p>
                              <span className={`text-xs mt-1 block ${isMe ? 'text-primary-100' : 'text-muted-foreground'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSend} className="p-4 border-t border-border flex items-center gap-2">
                  <Input
                    placeholder="اكتب رسالة..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="bg-primary-500 hover:bg-primary-600 text-white shrink-0" disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>اختر محادثة لبدء المراسلة</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={contractOpen} onOpenChange={setContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء عقد جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateContract} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>عنوان العقد</Label>
              <Input
                value={contractForm.title}
                onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                placeholder="مثال: ترميم منزل، سباكة، كهرباء..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={contractForm.description}
                onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                placeholder="تفاصيل العمل..."
              />
            </div>
            <div className="space-y-2">
              <Label>المبلغ (دج)</Label>
              <Input
                type="number"
                value={contractForm.amount}
                onChange={(e) => setContractForm({ ...contractForm, amount: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>الشروط</Label>
              <Textarea
                value={contractForm.terms}
                onChange={(e) => setContractForm({ ...contractForm, terms: e.target.value })}
                placeholder="شروط العمل، مدة التنفيذ، طريقة الدفع..."
              />
            </div>
            <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white" disabled={creatingContract}>
              {creatingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء العقد'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
