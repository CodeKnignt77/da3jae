'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    username: '', real_name: '', email: '', password: '', confirm: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!agreed) { setError('You must agree to the terms.'); return }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username, real_name: form.real_name },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      router.push('/discover')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: 'var(--bg-primary)' }}>
      <div style={{
        position: 'fixed', bottom: '30%', right: '20%',
        width: '500px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(176,110,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass w-full max-w-md p-8 rounded-3xl"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-7 h-7" style={{ color: 'var(--rose)' }} fill="currentColor" />
          <span className="text-2xl font-semibold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>da3jae</span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Create your account</h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Join our private community</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input id="reg-username" className="input" type="text" placeholder="@username"
                value={form.username} onChange={e => update('username', e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Real Name</label>
              <input id="reg-name" className="input" type="text" placeholder="Your name"
                value={form.real_name} onChange={e => update('real_name', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
            <input id="reg-email" className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => update('email', e.target.value)} required autoComplete="email" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <div className="relative">
              <input id="reg-password" className="input" type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters" value={form.password}
                onChange={e => update('password', e.target.value)} required style={{ paddingRight: '3rem' }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
            <input id="reg-confirm" className="input" type="password" placeholder="Re-enter password"
              value={form.confirm} onChange={e => update('confirm', e.target.value)} required />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input id="reg-consent" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded" style={{ accentColor: 'var(--rose)' }} />
            <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              I agree to the Terms of Service and Privacy Policy. I am 18+ years old.
            </span>
          </label>

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button id="reg-submit" type="submit" className="btn btn-primary w-full py-3 mt-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--rose)' }} className="font-medium">Sign in</Link>
        </p>
      </motion.div>
    </main>
  )
}
