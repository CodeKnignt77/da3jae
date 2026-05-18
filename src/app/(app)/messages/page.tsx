'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Search, Paperclip, Mic, Image as ImageIcon,
  Phone, Video, ChevronLeft, MoreVertical, Pin, MessageSquare, Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Profile, Message, Conversation } from '@/types'
import { formatDistanceToNow } from 'date-fns'

function Avatar({ profile, size = 48 }: { profile: Profile; size?: number }) {
  return profile.avatar_url ? (
    <img src={profile.avatar_url} alt={profile.username}
      className="avatar flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-md"
      style={{ width: size, height: size, background: 'var(--gradient-brand)', fontSize: size * 0.4 }}>
      {profile.username[0]?.toUpperCase()}
    </div>
  )
}

function MessagesContent() {
  const { user } = useAuth()
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoaded, setConversationsLoaded] = useState(false)
  const [selected, setSelected] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [globalSearchResults, setGlobalSearchResults] = useState<Profile[]>([])
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const peerParamProcessed = useRef(false)

  // Load conversations
  useEffect(() => {
    if (!user) return
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadConversations() {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
      .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
      .order('created_at', { ascending: false })

    if (!msgs) {
      setConversationsLoaded(true)
      return
    }

    const convoMap = new Map<string, Conversation>()
    for (const msg of msgs) {
      const partner = msg.sender_id === user!.id ? msg.receiver : msg.sender
      if (!partner || convoMap.has(partner.id)) continue
      const unread = msgs.filter(
        m => m.sender_id === partner.id && m.receiver_id === user!.id && !m.is_read
      ).length
      convoMap.set(partner.id, { partner, last_message: msg, unread_count: unread })
    }
    setConversations(Array.from(convoMap.values()))
    setConversationsLoaded(true)
  }

  // Check for 'peer' param on load to open a direct chat
  useEffect(() => {
    if (!conversationsLoaded || peerParamProcessed.current || !user) return
    const peerId = searchParams.get('peer')
    if (!peerId) return

    peerParamProcessed.current = true
    const existingConvo = conversations.find(c => c.partner.id === peerId)
    if (existingConvo) {
      setSelected(existingConvo.partner)
    } else {
      supabase.from('profiles').select('*').eq('id', peerId).single()
        .then(({ data }) => {
          if (data) {
            const peerProfile = data as Profile
            setSelected(peerProfile)
            setConversations(prev => {
              if (prev.some(c => c.partner.id === peerId)) return prev
              return [{ partner: peerProfile, unread_count: 0 }, ...prev]
            })
          }
        })
    }
  }, [conversationsLoaded, conversations, searchParams, user])

  // Global search for any user in the directory
  useEffect(() => {
    if (!search.trim() || !user) {
      setGlobalSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .or(`username.ilike.%${search.trim()}%,real_name.ilike.%${search.trim()}%`)
        .limit(6)

      if (data) {
        // Filter out profiles that we already have conversations with
        const activePartnerIds = conversations.map(c => c.partner.id)
        const filteredMatches = (data as Profile[]).filter(p => !activePartnerIds.includes(p.id))
        setGlobalSearchResults(filteredMatches)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [search, conversations, user])

  // Load & subscribe to messages in selected chat
  useEffect(() => {
    if (!selected || !user) return
    loadMessages()

    const channel = supabase
      .channel(`messages:${[user.id, selected.id].sort().join('-')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id=eq.${user.id},receiver_id=eq.${selected.id}),and(sender_id=eq.${selected.id},receiver_id=eq.${user.id}))`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user!.id},receiver_id.eq.${selected!.id}),` +
        `and(sender_id.eq.${selected!.id},receiver_id.eq.${user!.id})`
      )
      .order('created_at', { ascending: true })

    setMessages((data ?? []) as Message[])
    
    // Mark as read
    await supabase.from('messages')
      .update({ is_read: true })
      .eq('sender_id', selected!.id)
      .eq('receiver_id', user!.id)

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!text.trim() || !selected || sending) return
    setSending(true)
    const content = text.trim()
    setText('')

    await supabase.from('messages').insert({
      sender_id: user!.id,
      receiver_id: selected.id,
      content,
      type: 'text',
    })
    setSending(false)
    loadConversations()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    const ext = file.name.split('.').pop()
    const path = `messages/${user!.id}/${Date.now()}.${ext}`
    const { data: upload } = await supabase.storage.from('media').upload(path, file)
    if (!upload) return
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'text'
    await supabase.from('messages').insert({
      sender_id: user!.id,
      receiver_id: selected.id,
      content: file.name,
      media_url: publicUrl,
      type,
    })
    loadConversations()
  }

  const filtered = conversations.filter(c =>
    c.partner.username.toLowerCase().includes(search.toLowerCase()) ||
    (c.partner.real_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Zoomed in, clean sidebar */}
      <div className="w-[23.5rem] flex flex-col flex-shrink-0" style={{ borderRight: '1px solid var(--border-subtle)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-2xl font-black mb-4 flex items-center justify-between tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input className="input pl-10 pr-4 py-3.5 text-[15px] rounded-2xl border-none w-full"
              placeholder="Lookup anyone by name..."
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
          {/* Active Chats */}
          {filtered.length === 0 && !search.trim() ? (
            <div className="text-center py-20 px-4" style={{ color: 'var(--text-muted)' }}>
              <p className="text-base font-medium">No conversations yet</p>
              <p className="text-sm mt-1.5 opacity-80">Use the search box above to lookup poets and start typing!</p>
            </div>
          ) : (
            filtered.map(({ partner, last_message, unread_count }) => (
              <motion.button
                key={partner.id}
                whileHover={{ backgroundColor: 'var(--bg-card-hover)', scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelected(partner)
                  setSearch('')
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-all rounded-2xl"
                style={{
                  background: selected?.id === partner.id ? 'var(--bg-card)' : 'transparent',
                  border: selected?.id === partner.id ? '1px solid var(--border)' : '1px solid transparent',
                  boxShadow: selected?.id === partner.id ? '0 4px 20px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <div className="relative flex-shrink-0">
                  <Avatar profile={partner} size={52} />
                  {partner.is_online && (
                    <span className="status-online absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-2 border-[#0a0a0f]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[15px] truncate text-white">{partner.real_name || partner.username}</span>
                    {last_message && (
                      <span className="text-xs flex-shrink-0 opacity-60" style={{ color: 'var(--text-secondary)' }}>
                        {formatDistanceToNow(new Date(last_message.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] truncate flex-1 pr-2" style={{ color: 'var(--text-secondary)' }}>
                      {last_message?.content ?? 'Say hello!'}
                    </p>
                    {unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white flex-shrink-0 shadow-md"
                        style={{ background: 'var(--rose)' }}>
                        {unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))
          )}

          {/* Global Search / Message Anyone */}
          {search.trim() && globalSearchResults.length > 0 && (
            <div className="mt-4 border-t pt-4 px-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <p className="px-2 text-xs font-bold uppercase tracking-wider mb-3 opacity-60" style={{ color: 'var(--text-muted)' }}>
                Message Anyone (Global Search)
              </p>
              <div className="flex flex-col gap-1">
                {globalSearchResults.map(partner => (
                  <motion.button
                    key={partner.id}
                    whileHover={{ backgroundColor: 'var(--bg-card-hover)', scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelected(partner)
                      setConversations(prev => {
                        if (prev.some(c => c.partner.id === partner.id)) return prev
                        return [{ partner, unread_count: 0 }, ...prev]
                      })
                      setSearch('')
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left transition-all rounded-2xl"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar profile={partner} size={48} />
                      {partner.is_online && <span className="status-online absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-[#0a0a0f]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-[15px] block truncate text-white">{partner.real_name || partner.username}</span>
                      <span className="text-xs truncate block" style={{ color: 'var(--text-secondary)' }}>@{partner.username}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {search.trim() && filtered.length === 0 && globalSearchResults.length === 0 && (
            <div className="text-center py-20 px-4" style={{ color: 'var(--text-muted)' }}>
              <p className="text-base">No poets found</p>
            </div>
          )}
        </div>
      </div>

      {/* Spacious, zoomed in Chat area */}
      {selected ? (
        <div className="flex-1 flex flex-col animate-fade-in" style={{ background: '#0a0a0f' }}>
          {/* Header */}
          <div className="flex items-center gap-4 px-8 py-5 glass" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,10,15,0.7)' }}>
            <button onClick={() => setSelected(null)} className="md:hidden text-white hover:opacity-80">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="relative">
              <Avatar profile={selected} size={48} />
              {selected.is_online && <span className="status-online absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-2 border-[#0a0a0f]" />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-[17px] text-white leading-tight">{selected.real_name || selected.username}</p>
              <p className="text-[13px] mt-0.5 font-medium" style={{ color: selected.is_online ? '#22c55e' : 'var(--text-muted)' }}>
                {selected.is_online ? 'Online' : `Last seen ${formatDistanceToNow(new Date(selected.last_seen), { addSuffix: true })}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                href={`/calls?peer=${selected.id}&type=voice&role=caller`}
                className="w-13 h-13 rounded-2xl flex items-center justify-center hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)] transition-all" style={{ color: 'var(--text-secondary)' }}>
                <Phone style={{ width: 24, height: 24 }} />
              </motion.a>
              <motion.a whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                href={`/calls?peer=${selected.id}&type=video&role=caller`}
                className="w-13 h-13 rounded-2xl flex items-center justify-center hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)] transition-all" style={{ color: 'var(--text-secondary)' }}>
                <Video style={{ width: 24, height: 24 }} />
              </motion.a>
            </div>
          </div>

          {/* Chat Messages viewport */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map(msg => {
                const isMine = msg.sender_id === user!.id
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[70%] px-5 py-3 rounded-[22px] text-[15px] leading-relaxed shadow-sm"
                      style={{
                        background: isMine ? 'var(--gradient-brand)' : 'var(--bg-card)',
                        color: isMine ? 'white' : '#e2e8f0',
                        borderRadius: isMine ? '22px 22px 4px 22px' : '22px 22px 22px 4px',
                        border: isMine ? 'none' : '1px solid var(--border-subtle)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                      }}
                    >
                      {msg.type === 'image' && msg.media_url && (
                        <img src={msg.media_url} alt="Uploaded Image" className="rounded-xl max-w-full mb-2 border border-black/20" />
                      )}
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                      <p className="text-[11px] mt-1.5 opacity-60 text-right font-medium">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: false })}
                        {isMine && <span className="ml-1.5 font-bold">{msg.is_read ? '✓✓' : '✓'}</span>}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Zoomed in input box */}
          <form onSubmit={sendMessage}
            className="flex items-center gap-4 px-8 py-5 glass"
            style={{ borderTop: '1px solid var(--border-subtle)', background: 'rgba(10,10,15,0.7)' }}>
            <input ref={fileInputRef} type="file" className="hidden"
              accept="image/*,video/*" onChange={handleFileUpload} />
            
            <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border)]"
              style={{ color: 'var(--text-muted)' }}>
              <Paperclip className="w-5 h-5" />
            </motion.button>
            
            <input
              id="message-input"
              className="input flex-1 py-3.5 px-5 text-[15px] rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-rose/40"
              placeholder="Type a message…"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            />
            
            <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              disabled={!text.trim() || sending}
              className="btn btn-primary px-6 py-3.5 flex-shrink-0 text-[15px] font-semibold rounded-2xl flex items-center justify-center shadow-lg"
              style={{ opacity: !text.trim() ? 0.5 : 1 }}>
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-5" style={{ color: 'var(--text-muted)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg border border-[var(--border)]" style={{ background: 'var(--bg-card)' }}>
            💬
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">Select a conversation</p>
            <p className="text-[14px] mt-1 opacity-80 max-w-xs">or search for any user in the directory above to start messaging!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--rose)', borderTopColor: 'transparent' }} />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
