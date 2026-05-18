'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ShieldOff, ShieldCheck, Trash2, Edit2, Search, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default function AdminPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, online: 0, banned: 0 })

  useEffect(() => {
    if (!profile) return
    if (profile.role !== 'admin') { router.push('/discover'); return }
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) {
      setUsers(data as Profile[])
      setStats({
        total: data.length,
        online: data.filter(u => u.is_online).length,
        banned: data.filter(u => u.is_banned).length,
      })
    }
    setLoading(false)
  }

  async function toggleBan(user: Profile) {
    await supabase.from('profiles').update({ is_banned: !user.is_banned }).eq('id', user.id)
    loadUsers()
  }

  async function deleteUser(id: string) {
    if (!confirm('Permanently delete this user?')) return
    await supabase.from('profiles').delete().eq('id', id)
    loadUsers()
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.real_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const statCards = [
    { label: 'Total Users', value: stats.total, color: 'var(--violet)', icon: Users },
    { label: 'Online Now', value: stats.online, color: '#22c55e', icon: ShieldCheck },
    { label: 'Banned', value: stats.banned, color: '#ef4444', icon: AlertTriangle },
  ]

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-7 h-7" style={{ color: 'var(--gold)' }} />
        <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Admin Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input className="input pl-11" placeholder="Search users…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                {['User', 'City', 'Age', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : filtered.map((u, i) => (
                <motion.tr key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: '1px solid var(--border-subtle)', opacity: u.is_banned ? 0.5 : 1 }}
                  className="hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="avatar w-8 h-8" />
                        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'var(--gradient-brand)' }}>
                            {u.username[0]?.toUpperCase()}
                          </div>}
                      <div>
                        <p className="font-medium">{u.real_name || u.username}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.city ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.age ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: u.role === 'admin' ? 'var(--gold-glow)' : 'var(--bg-secondary)',
                        color: u.role === 'admin' ? 'var(--gold)' : 'var(--text-muted)',
                      }}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_banned ? (
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Banned</span>
                    ) : u.is_online ? (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: '#22c55e' }}>
                        <span className="w-2 h-2 rounded-full bg-green-500" />Online
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Offline</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleBan(u)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                        title={u.is_banned ? 'Unban' : 'Ban'}
                        style={{ color: u.is_banned ? '#22c55e' : '#f59e0b' }}>
                        {u.is_banned ? <ShieldCheck className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                          title="Delete user" style={{ color: '#ef4444' }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
