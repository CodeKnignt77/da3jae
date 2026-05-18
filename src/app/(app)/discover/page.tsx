'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Heart, X, Star, RotateCcw, MapPin, Briefcase, GraduationCap, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Profile, SwipeAction } from '@/types'

const SWIPE_THRESHOLD = 120

function SwipeCard({
  profile,
  onSwipe,
  isTop,
  stackIndex,
}: {
  profile: Profile
  onSwipe: (action: SwipeAction) => void
  isTop: boolean
  stackIndex: number
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-25, 25])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const passOpacity = useTransform(x, [-100, -20], [1, 0])
  const [imgIdx, setImgIdx] = useState(0)
  const images = [profile.avatar_url, ...(profile.gallery_urls ?? [])].filter(Boolean) as string[]

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    const dx = info.offset.x
    if (dx > SWIPE_THRESHOLD) onSwipe('like')
    else if (dx < -SWIPE_THRESHOLD) onSwipe('pass')
    else animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
  }

  const scale = 1 - stackIndex * 0.04
  const yOffset = stackIndex * 12

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: yOffset,
        position: 'absolute',
        inset: 0,
        zIndex: 10 - stackIndex,
        cursor: isTop ? 'grab' : 'default',
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileTap={isTop ? { cursor: 'grabbing' } : {}}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden card"
        style={{ userSelect: 'none' }}>
        {/* Image */}
        {images.length > 0 ? (
          <img
            src={images[imgIdx]}
            alt={profile.username}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            <span className="text-6xl font-bold opacity-20">{profile.username[0]?.toUpperCase()}</span>
          </div>
        )}

        {/* Image gallery dots */}
        {images.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex gap-1 justify-center px-4">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className="h-1 rounded-full flex-1 max-w-12 transition-all"
                style={{ background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        )}

        {/* Swipe indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-8 left-6 px-4 py-2 rounded-xl border-4 rotate-[-15deg]"
              style={{ borderColor: '#22c55e', color: '#22c55e', opacity: likeOpacity as never }}>
              <span className="text-2xl font-black">LIKE</span>
            </motion.div>
            <motion.div
              className="absolute top-8 right-6 px-4 py-2 rounded-xl border-4 rotate-[15deg]"
              style={{ borderColor: '#ef4444', color: '#ef4444', opacity: passOpacity as never }}>
              <span className="text-2xl font-black">NOPE</span>
            </motion.div>
          </>
        )}

        {/* Profile info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
          <div className="flex items-end justify-between w-full">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between w-full pr-2">
                <h2 className="text-2xl font-bold text-white truncate">
                  {profile.real_name || profile.username}
                  {profile.age && <span className="font-normal ml-2 text-xl">{profile.age}</span>}
                </h2>
                
                {/* Direct Message Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `/messages?peer=${profile.id}`
                  }}
                  className="w-13 h-13 rounded-full flex items-center justify-center bg-white/10 hover:bg-rose/85 hover:border-rose/20 backdrop-blur-md border border-white/20 text-white transition-all hover:scale-110 active:scale-95 shadow-lg flex-shrink-0 animate-pulse"
                  style={{ animationDuration: '3s' }}
                  title="Message directly"
                >
                  <MessageSquare style={{ width: 23, height: 23 }} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {profile.city && (
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <MapPin className="w-3 h-3" />{profile.city}
                  </span>
                )}
                {profile.job && (
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <Briefcase className="w-3 h-3" />{profile.job}
                  </span>
                )}
                {profile.education && (
                  <span className="flex items-center gap-1 text-sm text-white/80">
                    <GraduationCap className="w-3 h-3" />{profile.education}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-sm text-white/70 mt-2 line-clamp-2">{profile.bio}</p>
              )}
              {profile.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.interests.slice(0, 4).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ background: 'rgba(255,78,139,0.35)', border: '1px solid rgba(255,78,139,0.4)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function DiscoverPage() {
  const { user, profile: myProfile } = useAuth()
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [history, setHistory] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    if (!user) return
    loadProfiles()
    // Keyboard shortcuts
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') handleSwipe('like')
      if (e.key === 'ArrowLeft') handleSwipe('pass')
      if (e.key === 'ArrowUp') handleSwipe('super_like')
      if (e.key === 'ArrowDown') handleRewind()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadProfiles() {
    setLoading(true)
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('swiper_id', user!.id)

    const excludeIds = [user!.id, ...(swipedIds?.map(s => s.target_id) ?? [])]

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_banned', false)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!data || data.length === 0) setEmpty(true)
    else setProfiles(data as Profile[])
    setLoading(false)
  }

  async function handleSwipe(action: SwipeAction) {
    if (profiles.length === 0) return
    const target = profiles[profiles.length - 1]
    setHistory(h => [...h, target])
    setProfiles(p => p.slice(0, -1))

    await supabase.from('swipes').upsert({
      swiper_id: user!.id,
      target_id: target.id,
      action,
    })
  }

  function handleRewind() {
    if (history.length === 0) return
    const last = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setProfiles(p => [...p, last])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--rose)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
        Discover
      </h1>

      {/* Card stack */}
      <div className="relative w-full max-w-sm" style={{ height: '560px' }}>
        {empty || profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 card flex flex-col items-center justify-center rounded-3xl gap-4 p-8 text-center"
          >
            <span className="text-5xl">💫</span>
            <h3 className="text-xl font-bold">You&apos;re all caught up!</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No more profiles to discover right now.
            </p>
            <button onClick={loadProfiles} className="btn btn-primary mt-2">Refresh</button>
          </motion.div>
        ) : (
          profiles.slice(-3).map((profile, i, arr) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              isTop={i === arr.length - 1}
              stackIndex={arr.length - 1 - i}
              onSwipe={handleSwipe}
            />
          ))
        )}
      </div>

      {/* Action buttons */}
      {!empty && profiles.length > 0 && (
        <div className="flex items-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={handleRewind}
            disabled={history.length === 0}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: history.length === 0 ? 'var(--bg-card)' : 'var(--gold-glow)',
              border: '1px solid var(--border)',
              color: history.length === 0 ? 'var(--text-muted)' : 'var(--gold)',
            }}
            title="Rewind (↓)"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('pass')}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
            title="Pass (←)"
          >
            <X className="w-7 h-7" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('super_like')}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--violet-glow)', border: '1px solid rgba(176,110,255,0.3)', color: 'var(--violet)' }}
            title="Super Like (↑)"
          >
            <Star className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe('like')}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
            title="Like (→)"
          >
            <Heart className="w-7 h-7" />
          </motion.button>
        </div>
      )}

      <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
        ← → ↑ ↓ keyboard shortcuts supported
      </p>
    </div>
  )
}
