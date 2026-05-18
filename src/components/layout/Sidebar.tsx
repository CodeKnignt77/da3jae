'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Heart, Flame, MessageCircle, User, Phone, Settings, LogOut, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/discover', icon: Flame, label: 'Discover' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useAuth()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="glass fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-6 gap-2 z-50"
      style={{ borderRight: '1px solid var(--border-subtle)' }}>
      {/* Logo */}
      <Link href="/discover" className="mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center animate-pulse-glow"
          style={{ background: 'var(--gradient-brand)' }}>
          <Heart className="w-5 h-5 text-white" fill="currentColor" />
        </div>
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} title={label}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
                style={{
                  background: active ? 'var(--rose-glow)' : 'transparent',
                  color: active ? 'var(--rose)' : 'var(--text-muted)',
                  border: active ? '1px solid rgba(255,78,139,0.2)' : '1px solid transparent',
                }}
              >
                <Icon className="w-5 h-5" />
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
                    style={{ background: 'var(--rose)', left: '-1px' }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1">
        {profile?.role === 'admin' && (
          <Link href="/admin" title="Admin">
            <motion.div whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ color: 'var(--gold)' }}>
              <ShieldCheck className="w-5 h-5" />
            </motion.div>
          </Link>
        )}
        <Link href="/profile/settings" title="Settings">
          <motion.div whileHover={{ scale: 1.1 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}>
            <Settings className="w-5 h-5" />
          </motion.div>
        </Link>
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={handleLogout}
          title="Sign out"
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut className="w-5 h-5" />
        </motion.button>

        {/* Avatar */}
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="avatar"
            className="avatar mt-2" style={{ width: 36, height: 36 }} />
        ) : (
          <div className="mt-2 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: 'var(--gradient-brand)', color: 'white' }}>
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
    </aside>
  )
}
