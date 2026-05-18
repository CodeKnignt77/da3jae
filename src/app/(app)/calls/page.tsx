'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Profile } from '@/types'

import { Suspense } from 'react'

function CallsContent() {
  const { user, profile } = useAuth()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const peerId = searchParams.get('peer')
  const callType = (searchParams.get('type') ?? 'voice') as 'voice' | 'video'
  const role = searchParams.get('role') ?? 'caller' // 'caller' | 'receiver'

  const [peer, setPeer] = useState<Profile | null>(null)
  const [status, setStatus] = useState<'calling' | 'active' | 'declined' | 'ended'>('calling')
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [duration, setDuration] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!peerId || !user) return
    supabase.from('profiles').select('*').eq('id', peerId).single()
      .then(({ data }) => data && setPeer(data as Profile))
    
    initCall()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function initCall() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      pcRef.current = pc
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      
      pc.ontrack = e => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
        setStatus('active')
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
      }

      const channelId = [user!.id, peerId].sort().join(':')
      const ch = supabase.channel(`call:${channelId}`)
      
      ch.on('broadcast', { event: 'sig' }, async ({ payload }) => {
        try {
          if (payload.type === 'offer') {
            // Only process offer if we are in stable state
            if (pc.signalingState !== 'stable') return
            await pc.setRemoteDescription(new RTCSessionDescription(payload))
            const ans = await pc.createAnswer()
            await pc.setLocalDescription(ans)
            ch.send({ type: 'broadcast', event: 'sig', payload: ans })
          } else if (payload.type === 'answer') {
            // Only process answer if we have sent an offer
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload))
            }
          } else if (payload.candidate) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(payload))
            }
          } else if (payload.type === 'decline') {
            endCall('declined')
          } else if (payload.type === 'end') {
            endCall('ended')
          }
        } catch (e) {
          console.error('Error during WebRTC signaling step:', e)
        }
      })
      
      await ch.subscribe()
      
      pc.onicecandidate = e => {
        if (e.candidate) {
          ch.send({ type: 'broadcast', event: 'sig', payload: e.candidate })
        }
      }
      
      // ONLY the caller generates the initial WebRTC Offer
      if (role === 'caller') {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        ch.send({ type: 'broadcast', event: 'sig', payload: offer })

        // Send incoming call invitation broadcast to the peer's personal channel
        const inviteChannel = supabase.channel(`user-calls:${peerId}`)
        inviteChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            inviteChannel.send({
              type: 'broadcast',
              event: 'invite',
              payload: {
                callerId: user!.id,
                callerName: profile?.real_name || profile?.username || user!.email?.split('@')[0] || 'Someone',
                callerAvatar: profile?.avatar_url || '',
                type: callType,
                channelId
              }
            })
          }
        })
      }

      // Auto end call after 35 seconds of ringing without response
      setTimeout(() => {
        if (pcRef.current && pcRef.current.connectionState !== 'connected' && pcRef.current.signalingState !== 'stable') {
          endCall('ended')
        }
      }, 35000)

    } catch (err) {
      console.error('Failed to initialize local user media call stream:', err)
      setStatus('ended')
    }
  }

  function cleanup() {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function endCall(reason: 'declined' | 'ended' = 'ended') {
    cleanup()
    setStatus(reason)
    setTimeout(() => router.back(), 1500)
  }

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(m => !m)
  }
  
  function toggleVideo() {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff })
    setVideoOff(v => !v)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <div className="w-full max-w-sm mx-4">
        {callType === 'video' ? (
          <video ref={remoteVideoRef} autoPlay playsInline
            className="w-full rounded-3xl" style={{ minHeight: 400, background: '#111', objectFit: 'cover' }} />
        ) : (
          <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-full rounded-3xl flex items-center justify-center"
            style={{ height: 400, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {peer?.avatar_url
              ? <img src={peer.avatar_url} alt="" className="w-32 h-32 rounded-full object-cover"
                  style={{ border: '3px solid var(--rose)', boxShadow: '0 0 30px rgba(255,78,139,0.3)' }} />
              : <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold text-white"
                  style={{ background: 'var(--gradient-brand)' }}>
                  {peer?.username?.[0]?.toUpperCase() ?? '?'}
                </div>}
          </motion.div>
        )}

        {callType === 'video' && (
          <video ref={localVideoRef} autoPlay playsInline muted
            className="absolute bottom-4 right-4 w-24 h-36 rounded-2xl object-cover"
            style={{ border: '2px solid var(--border)', background: '#111' }} />
        )}

        <div className="text-center mt-6">
          <h2 className="text-2xl font-bold">{peer?.real_name || peer?.username || 'Connecting…'}</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {status === 'calling' && 'Calling…'}
            {status === 'active' && fmt(duration)}
            {status === 'declined' && 'Call declined'}
            {status === 'ended' && 'Call ended'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-5 mt-8">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleMute}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: muted ? 'rgba(239,68,68,0.2)' : 'var(--bg-card)', border: '1px solid var(--border)', color: muted ? '#ef4444' : 'var(--text-secondary)' }}>
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={() => endCall('ended')}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: '#ef4444', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}>
            <PhoneOff className="w-6 h-6 text-white" />
          </motion.button>

          {callType === 'video' && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleVideo}
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: videoOff ? 'rgba(239,68,68,0.2)' : 'var(--bg-card)', border: '1px solid var(--border)', color: videoOff ? '#ef4444' : 'var(--text-secondary)' }}>
              {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CallsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading call...</p>
      </div>
    }>
      <CallsContent />
    </Suspense>
  )
}
