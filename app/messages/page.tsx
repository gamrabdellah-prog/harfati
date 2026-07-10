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
import { Send, Loader2, MessageSquare, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { validateMessageContent, sanitizeText } from '@/lib/validation';
import { cn } from '@/lib/utils';
type Conv = { other: Tables['profiles']|null; lastMsg: Tables['messages']|null; unread: number };

export default function MessagesPage() {
  const { user, loading:al } = useAuth(); const router = useRouter(); const sp = useSearchParams();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selId, setSelId] = useState<string|null>(sp.get('user'));
  const [messages, setMessages] = useState<Tables['messages'][]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true); const [loadingMsgs, setLoadingMsgs] = useState(false); const [sending, setSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState<Tables['profiles']|null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!al&&!user)router.push('/auth');},[al,user,router]);

  const fetchConvs = useCallback(async()=>{
    if(!user)return;
    const {data:msgs}=await supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at',{ascending:false});
    if(!msgs){setLoadingConvs(false);return;}
    const pidsSet=new Set(msgs.map(m=>m.sender_id===user.id?m.receiver_id:m.sender_id));
    const pids=Array.from(pidsSet);
    if(!pids.length){setConvs([]);setLoadingConvs(false);return;}
    const {data:profiles}=await supabase.from('profiles').select('*').in('id',pids);
    const pmap=new Map((profiles||[]).map(p=>[p.id,p]));
    setConvs(pids.map(pid=>({other:pmap.get(pid)||null,lastMsg:msgs.find(m=>m.sender_id===pid||m.receiver_id===pid)||null,unread:msgs.filter(m=>m.receiver_id===user.id&&m.sender_id===pid&&!m.is_read).length})));
    setLoadingConvs(false);
  },[user]);

  useEffect(()=>{fetchConvs();},[fetchConvs]);

  const fetchMsgs = useCallback(async(pid:string)=>{
    if(!user)return;
    setLoadingMsgs(true);
    const {data}=await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${pid}),and(sender_id.eq.${pid},receiver_id.eq.${user.id})`).order('created_at',{ascending:true});
    setMessages(data||[]); setLoadingMsgs(false);
    await supabase.from('messages').update({is_read:true}).eq('sender_id',pid).eq('receiver_id',user.id).eq('is_read',false);
    fetchConvs();
  },[user,fetchConvs]);

  useEffect(()=>{if(!selId)return;fetchMsgs(selId);supabase.from('profiles').select('*').eq('id',selId).maybeSingle().then(({data})=>setOtherProfile(data));},[selId,fetchMsgs]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages]);
  useEffect(()=>{if(!user||!selId)return;const id=setInterval(()=>fetchMsgs(selId),5000);return()=>clearInterval(id);},[user,selId,fetchMsgs]);

  const send=async(e:React.FormEvent)=>{
    e.preventDefault(); if(!user||!selId)return;
    const err=validateMessageContent(newMsg); if(err){toast.error(err);return;}
    setSending(true);
    const {error}=await supabase.from('messages').insert({sender_id:user.id,receiver_id:selId,content:sanitizeText(newMsg)});
    setSending(false);
    if(error)toast.error(error.message);
    else{setNewMsg('');fetchMsgs(selId);}
  };

  if(al)return<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500"/></div>;
  if(!user)return null;

  return(
    <div className="flex h-[calc(100vh-64px)] bg-muted/20">
      {/* Conversations sidebar */}
      <div className={cn('w-80 shrink-0 bg-white border-l flex flex-col', selId?'hidden md:flex':'flex')}>
        <div className="p-5 border-b bg-white">
          <h2 className="font-black text-lg">الرسائل</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{convs.length} محادثة</p>
        </div>
        <ScrollArea className="flex-1">
          {loadingConvs?(
            <div className="p-4 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full"/><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4"/><Skeleton className="h-3 w-1/2"/></div></div>)}</div>
          ):convs.length===0?(
            <div className="p-8 text-center text-muted-foreground"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20"/><p className="font-medium">لا توجد محادثات</p><p className="text-xs mt-1">تواصل مع حرفيين من صفحة ملفهم</p></div>
          ):(
            convs.map(c=>(
              <button key={c.other?.id} onClick={()=>setSelId(c.other?.id||null)}
                className={cn('w-full flex items-center gap-3 p-4 border-b border-border/40 hover:bg-muted/40 text-right transition-colors',selId===c.other?.id?'bg-orange-50 border-orange-100':'')}>
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12"><AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold">{c.other?.full_name?.charAt(0)||'?'}</AvatarFallback></Avatar>
                  {c.unread>0&&<span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">{c.unread}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate',selId===c.other?.id?'text-orange-700':'')}>{c.other?.full_name||'مستخدم'}</p>
                  {c.lastMsg&&<p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMsg.content}</p>}
                </div>
                {selId===c.other?.id&&<ChevronLeft className="h-4 w-4 text-orange-400 shrink-0"/>}
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className={cn('flex-1 flex flex-col', !selId?'hidden md:flex':'flex')}>
        {!selId?(
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-10"/>
              <h3 className="text-xl font-bold mb-1">اختر محادثة</h3>
              <p className="text-sm">اختر محادثة من القائمة للبدء</p>
            </div>
          </div>
        ):(
          <>
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center gap-3">
              <button onClick={()=>setSelId(null)} className="md:hidden text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-5 w-5 rotate-180"/></button>
              <Avatar className="h-10 w-10 ring-2 ring-orange-100"><AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold">{otherProfile?.full_name?.charAt(0)||'?'}</AvatarFallback></Avatar>
              <div>
                <Link href={`/profile/${selId}`} className="font-bold hover:text-orange-600 transition-colors">{otherProfile?.full_name||'مستخدم'}</Link>
                {otherProfile?.specialty&&<p className="text-xs text-muted-foreground">{otherProfile.specialty}</p>}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-5">
              {loadingMsgs?(
                <div className="space-y-4">{Array.from({length:5}).map((_,i)=><div key={i} className={cn('flex',i%2===0?'justify-start':'justify-end')}><Skeleton className="h-12 w-48 rounded-2xl"/></div>)}</div>
              ):messages.length===0?(
                <div className="h-full flex items-center justify-center text-muted-foreground"><p className="text-sm">ابدأ المحادثة الآن 👋</p></div>
              ):(
                <div className="space-y-3">
                  {messages.map((m,i)=>{
                    const isMe=m.sender_id===user.id;
                    const showTime=i===messages.length-1||messages[i+1]?.sender_id!==m.sender_id;
                    return(
                      <div key={m.id} className={cn('flex',isMe?'justify-start':'justify-end')}>
                        <div className={cn('max-w-[70%]',isMe?'items-start':'items-end','flex flex-col gap-1')}>
                          <div className={cn('px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',isMe?'bg-orange-500 text-white rounded-br-md':'bg-white text-foreground rounded-bl-md border')}>
                            {m.content}
                          </div>
                          {showTime&&<p className={cn('text-xs text-muted-foreground px-1',isMe?'text-right':'text-left')}>{new Date(m.created_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})}</p>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef}/>
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={send} className="bg-white border-t p-4 flex gap-3">
              <Input value={newMsg} onChange={e=>setNewMsg(e.target.value)} placeholder="اكتب رسالة..." className="flex-1 rounded-xl" disabled={sending}/>
              <Button type="submit" variant="premium" size="icon" className="rounded-xl shrink-0" disabled={sending||!newMsg.trim()}>
                {sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
