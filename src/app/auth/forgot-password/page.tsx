'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (err) setError(err.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 rounded-3xl"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-7 h-7" style={{ color: 'var(--rose)' }} fill="currentColor" />
          <span className="text-2xl font-semibold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>da3jae</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <span className="text-3xl">✉️</span>
            </div>
            <h1 className="text-xl font-bold mb-2">Check your email</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link href="/auth/login" className="btn btn-ghost w-full">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">Reset password</h1>
            <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Enter your email to receive a reset link
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input id="forgot-email" className="input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
              {error && (
                <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  {error}
                </div>
              )}
              <button id="forgot-submit" type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
            <div className="text-center mt-4">
              <Link href="/auth/login" className="text-sm" style={{ color: 'var(--text-muted)' }}>
                <ArrowLeft className="inline w-3 h-3 mr-1" />Back to Sign In
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </main>
  )
}
