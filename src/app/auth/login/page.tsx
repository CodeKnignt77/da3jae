'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Determine if identifier is email or username
    const isEmail = identifier.includes('@')
    let email = identifier

    if (!isEmail) {
      // Look up email by username
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', identifier)
        .single()

      if (!profile) {
        setError('Username not found.')
        setLoading(false)
        return
      }

      const { data: userData } = await supabase.auth.admin?.getUserById
        ? { data: null }
        : { data: null }

      // Fallback: try signing in with the identifier as email
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: identifier + '@da3jae.local',
        password,
      })
      if (!signInError) { router.push('/discover'); return }
      setError('Invalid credentials.')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
    } else {
      router.push('/discover')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(255,78,139,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass w-full max-w-md p-8 rounded-3xl"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-7 h-7" style={{ color: 'var(--rose)' }} fill="currentColor" />
          <span className="text-2xl font-semibold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>da3jae</span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Email or Username
            </label>
            <input
              id="login-identifier"
              className="input"
              type="text"
              placeholder="you@example.com or @username"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs" style={{ color: 'var(--rose)' }}>
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button id="login-submit" type="submit" className="btn btn-primary w-full py-3 mt-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          No account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--rose)' }} className="font-medium">
            Join da3jae
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
