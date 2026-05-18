'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Zap, Shield, MessageCircle, Video, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <nav className="glass sticky top-0 z-50 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6" style={{ color: 'var(--rose)' }} fill="currentColor" />
          <span className="text-xl font-semibold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>da3jae</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn btn-ghost">Sign In</Link>
          <Link href="/auth/register" className="btn btn-primary">Join Now</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div style={{
            position: 'absolute', top: '20%', left: '15%',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,78,139,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '20%', right: '15%',
            width: '350px', height: '350px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(176,110,255,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ background: 'var(--rose-glow)', color: 'var(--rose)', border: '1px solid rgba(255,78,139,0.2)' }}>
            <Sparkles className="w-4 h-4" />
            Private community • By invitation
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            At the touch of love,{' '}
            <span className="gradient-text italic">everyone</span>
            <br />becomes a poet.
          </h1>

          <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
            A refined dating experience for Morocco's young generation.
            Elegant. Intentional. Private.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/auth/register" className="btn btn-primary text-base px-8 py-3" style={{ fontSize: '1rem' }}>
              <Heart className="w-5 h-5" />
              Start Your Journey
            </Link>
            <Link href="/auth/login" className="btn btn-ghost text-base px-8 py-3" style={{ fontSize: '1rem' }}>
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Floating cards preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="relative mt-20 w-full max-w-lg h-64"
        >
          {[
            { rotate: -8, x: -40, delay: 0 },
            { rotate: -3, x: 0, delay: 0.1 },
            { rotate: 5, x: 40, delay: 0.2 },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="card absolute inset-0 animate-float"
              style={{
                rotate: card.rotate,
                x: card.x,
                animationDelay: `${card.delay}s`,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            />
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-8 py-20 max-w-6xl mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Everything you need to connect
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Heart, title: 'Swipe & Discover', desc: 'Tinder-inspired card swiping with like, super like, and rewind. Keyboard shortcuts included.', color: 'var(--rose)' },
            { icon: MessageCircle, title: 'Instant Messaging', desc: 'Real-time chat with voice notes, images, video, read receipts, and typing indicators.', color: 'var(--violet)' },
            { icon: Video, title: 'Voice & Video Calls', desc: 'Free WebRTC-powered calls that continue even when you switch browser tabs.', color: 'var(--cyan)' },
            { icon: Shield, title: 'Privacy First', desc: 'AES-256 encryption, private community, and complete control over your data.', color: 'var(--gold)' },
            { icon: Zap, title: 'Real-time Everything', desc: 'Powered by Supabase Realtime — online status, presence, and live notifications.', color: 'var(--rose)' },
            { icon: Sparkles, title: 'Dark Luxury UI', desc: 'A premium dark aesthetic with vibrant accents, smooth animations, and glassmorphism.', color: 'var(--violet)' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card card-hover p-6"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}15`, border: `1px solid ${f.color}30` }}>
                <f.icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
        <p>da3jae © {new Date().getFullYear()} · Private Community · Made with <Heart className="inline w-3 h-3" style={{ color: 'var(--rose)' }} fill="currentColor" /> in Morocco</p>
      </footer>
    </main>
  )
}
