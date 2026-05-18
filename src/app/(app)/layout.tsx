'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Video, PhoneOff, Loader2 } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/components/providers/AuthProvider'
import Onboarding from '@/components/profile/Onboarding'
import { createClient } from '@/lib/supabase/client'

interface IncomingCall {
  callerId: string
  callerName: string
  callerAvatar: string
  type: 'voice' | 'video'
  channelId: string
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  
  // Web Audio Context refs for luxury programmatical ringtone
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null)

  function startRingtone() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioCtx = new AudioContextClass()
      audioCtxRef.current = audioCtx

      let tick = true
      ringIntervalRef.current = setInterval(() => {
        if (!audioCtx || audioCtx.state === 'closed') return
        
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()

        osc.type = 'sine'
        // Warm, luxurious, soft rhodes-like double chime: 554.37 Hz (C#5) and 698.46 Hz (F5)
        osc.frequency.setValueAtTime(tick ? 554.37 : 698.46, audioCtx.currentTime)
        tick = !tick

        gain.gain.setValueAtTime(0.25, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9)

        osc.connect(gain)
        gain.connect(audioCtx.destination)
        
        osc.start()
        osc.stop(audioCtx.currentTime + 0.9)
      }, 1200)
    } catch (err) {
      console.error('Failed to play local synthesizer chime:', err)
    }
  }

  function stopRingtone() {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current)
      ringIntervalRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }

  useEffect(() => {
    if (!profile) return

    // Subscribe to personal incoming calls channel
    const callReceiverChannel = supabase.channel(`user-calls:${profile.id}`)
    
    callReceiverChannel.on('broadcast', { event: 'invite' }, ({ payload }) => {
      // Ignore if user is already on the calls page to prevent double call screens
      if (window.location.pathname.includes('/calls')) return
      
      setIncomingCall({
        callerId: payload.callerId,
        callerName: payload.callerName,
        callerAvatar: payload.callerAvatar,
        type: payload.type,
        channelId: payload.channelId
      })
      startRingtone()
    })

    callReceiverChannel.subscribe()

    return () => {
      supabase.removeChannel(callReceiverChannel)
      stopRingtone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function handleAccept() {
    if (!incomingCall) return
    stopRingtone()
    const call = incomingCall
    setIncomingCall(null)
    router.push(`/calls?peer=${call.callerId}&type=${call.type}&role=receiver`)
  }

  async function handleDecline() {
    if (!incomingCall) return
    stopRingtone()
    
    // Notify the caller that call was declined
    const notifyChannel = supabase.channel(`call:${incomingCall.channelId}`)
    notifyChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        notifyChannel.send({
          type: 'broadcast',
          event: 'sig',
          payload: { type: 'decline' }
        })
      }
    })

    setIncomingCall(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="w-8 h-8 text-rose animate-spin" style={{ color: 'var(--rose)' }} />
      </div>
    )
  }

  const isProfileIncomplete = profile && (!profile.age || !profile.city)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {!isProfileIncomplete && <Sidebar />}
      <main className="flex-1 transition-all duration-300" style={{ marginLeft: isProfileIncomplete ? 0 : '5rem' }}>
        {isProfileIncomplete ? (
          <Onboarding />
        ) : (
          children
        )}
      </main>

      {/* Luxury Real-time Incoming Call Modal Overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass p-8 rounded-3xl w-full max-w-sm mx-4 flex flex-col items-center relative overflow-hidden"
              style={{
                border: '1px solid var(--border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Background radial glow */}
              <div className="absolute inset-0 pointer-events-none z-0" style={{
                background: 'radial-gradient(circle at center, rgba(255,78,139,0.15) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }} />

              {/* Pulsing Avatar rings */}
              <div className="relative mb-6 z-10">
                <div className="absolute -inset-4 rounded-full bg-rose/10 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-2 rounded-full bg-rose/20 animate-ping" style={{ animationDuration: '3s' }} />
                {incomingCall.callerAvatar ? (
                  <img
                    src={incomingCall.callerAvatar}
                    alt={incomingCall.callerName}
                    className="w-24 h-24 rounded-full object-cover relative border-2 border-rose shadow-lg"
                    style={{ borderColor: 'var(--rose)' }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white relative border-2 border-rose shadow-lg"
                    style={{ background: 'var(--gradient-brand)', borderColor: 'var(--rose)' }}
                  >
                    {incomingCall.callerName[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold text-center z-10" style={{ fontFamily: "'Playfair Display', serif" }}>
                {incomingCall.callerName}
              </h3>
              
              <p className="text-sm mt-2 text-center flex items-center gap-1.5 z-10" style={{ color: 'var(--text-secondary)' }}>
                {incomingCall.type === 'video' ? <Video className="w-4 h-4 text-rose" style={{ color: 'var(--rose)' }} /> : <Phone className="w-4 h-4 text-rose" style={{ color: 'var(--rose)' }} />}
                Incoming {incomingCall.type} call...
              </p>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 mt-8 w-full z-10">
                {/* Decline Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDecline}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-500 transition-colors"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>

                {/* Accept Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAccept}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-transform"
                >
                  {incomingCall.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
