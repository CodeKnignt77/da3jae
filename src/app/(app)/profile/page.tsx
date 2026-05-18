'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Edit2, Save, X, Plus, MapPin, Briefcase, GraduationCap, Heart, Ruler, Image as ImageIcon, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const GOALS = ['Marriage', 'Serious Relationship', 'Friendship', 'Not Sure Yet']
const RELIGIONS = ['Muslim', 'Christian', 'Jewish', 'Atheist', 'Other', 'Prefer not to say']

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Profile>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [newInterest, setNewInterest] = useState('')

  function startEdit() {
    setForm({ ...profile })
    setEditing(true)
  }

  function cancelEdit() {
    setForm({})
    setEditing(false)
  }

  function update(field: keyof Profile, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      real_name: form.real_name,
      age: form.age,
      city: form.city,
      bio: form.bio,
      interests: form.interests,
      religion: form.religion,
      job: form.job,
      education: form.education,
      height: form.height,
      relationship_goals: form.relationship_goals,
      gallery_urls: form.gallery_urls,
    }).eq('id', profile.id)

    if (!error) {
      await refreshProfile()
      setEditing(false)
    }
    setSaving(false)
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const path = `avatars/${profile.id}/${Date.now()}.${file.name.split('.').pop()}`
    await supabase.storage.from('media').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    await refreshProfile()
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !profile) return
    setUploadingGallery(true)
    try {
      const currentUrls = form.gallery_urls ?? profile.gallery_urls ?? []
      const newUrls = [...currentUrls]
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `gallery/${profile.id}/${Date.now()}-${i}.${file.name.split('.').pop()}`
        const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
        newUrls.push(publicUrl)
      }
      update('gallery_urls', newUrls)
    } catch (err) {
      console.error('Failed to upload gallery images:', err)
    } finally {
      setUploadingGallery(false)
    }
  }

  function removeGalleryImage(urlToRemove: string) {
    const currentUrls = form.gallery_urls ?? profile.gallery_urls ?? []
    update('gallery_urls', currentUrls.filter(url => url !== urlToRemove))
  }

  function addInterest() {
    if (!newInterest.trim()) return
    const current = (editing ? form.interests : profile?.interests) ?? []
    update('interests', [...current, newInterest.trim()])
    setNewInterest('')
  }

  function removeInterest(tag: string) {
    update('interests', (form.interests ?? []).filter(t => t !== tag))
  }

  const data = editing ? form : profile
  if (!profile) return null

  const displayGallery = editing ? (form.gallery_urls ?? []) : (profile.gallery_urls ?? [])

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-10 px-6 w-full">
      <div className="w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>My Profile</h1>
            {editing ? (
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="btn btn-ghost gap-2"><X className="w-4 h-4" />Cancel</button>
                <button onClick={saveProfile} disabled={saving} className="btn btn-primary gap-2">
                  <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            ) : (
              <button onClick={startEdit} className="btn btn-ghost gap-2">
                <Edit2 className="w-4 h-4" />Edit Profile
              </button>
            )}
          </div>

          {/* Avatar */}
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {data?.avatar_url ? (
                  <img src={data.avatar_url} alt="avatar"
                    className="avatar" style={{ width: 96, height: 96 }} />
                ) : (
                  <div className="rounded-full flex items-center justify-center text-3xl font-bold text-white"
                    style={{ width: 96, height: 96, background: 'var(--gradient-brand)' }}>
                    {profile.username[0]?.toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: 'var(--gradient-brand)' }}>
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} />
                </label>
              </div>
              <div>
                <h2 className="text-xl font-bold">{data?.real_name || profile.username}</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{profile.username}</p>
                {data?.city && (
                  <p className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--text-muted)' }}>
                    <MapPin className="w-3 h-3" />{data.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="card p-6 mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <ImageIcon className="w-4 h-4" />Photo Gallery
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {displayGallery.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-800 group">
                  <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover animate-fade-in" />
                  {editing && (
                    <button type="button" onClick={() => removeGalleryImage(url)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black transition-colors">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              ))}

              {editing && (
                <label className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-neutral-900"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                  {uploadingGallery ? (
                    <Loader2 className="w-6 h-6 text-rose animate-spin" style={{ color: 'var(--rose)' }} />
                  ) : (
                    <>
                      <Plus className="w-6 h-6 text-neutral-400 mb-1" />
                      <span className="text-[10px] text-neutral-400">Add Photos</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} disabled={uploadingGallery} />
                </label>
              )}

              {!editing && displayGallery.length === 0 && (
                <p className="col-span-full text-sm py-2 px-1" style={{ color: 'var(--text-muted)' }}>
                  No photos in gallery yet. Click "Edit Profile" to add some!
                </p>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="card p-6 flex flex-col gap-5">
            {[
              { label: 'Real Name', field: 'real_name' as keyof Profile, type: 'text', icon: null },
              { label: 'Age', field: 'age' as keyof Profile, type: 'number', icon: null },
              { label: 'City', field: 'city' as keyof Profile, type: 'text', icon: MapPin },
              { label: 'Job', field: 'job' as keyof Profile, type: 'text', icon: Briefcase },
              { label: 'Education', field: 'education' as keyof Profile, type: 'text', icon: GraduationCap },
              { label: 'Height (cm)', field: 'height' as keyof Profile, type: 'number', icon: Ruler },
            ].map(({ label, field, type, icon: Icon }) => (
              <div key={field}>
                <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {Icon && <Icon className="w-3.5 h-3.5" />}{label}
                </label>
                {editing ? (
                  <input className="input text-sm" type={type}
                    value={(form[field] as string | number | undefined) ?? ''}
                    onChange={e => update(field, type === 'number' ? Number(e.target.value) : e.target.value)} />
                ) : (
                  <p className="text-sm py-2 px-3 rounded-xl animate-fade-in" style={{ background: 'var(--bg-secondary)', minHeight: 40 }}>
                    {(data?.[field] as string | number | undefined) ?? <span style={{ color: 'var(--text-muted)' }}>Not set</span>}
                  </p>
                )}
              </div>
            ))}

            {/* Bio */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Bio</label>
              {editing ? (
                <textarea className="input text-sm resize-none animate-fade-in" rows={3}
                  value={form.bio ?? ''} onChange={e => update('bio', e.target.value)}
                  placeholder="Tell people about yourself…" />
              ) : (
                <p className="text-sm py-2 px-3 rounded-xl leading-relaxed animate-fade-in"
                  style={{ background: 'var(--bg-secondary)', minHeight: 60, color: data?.bio ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {data?.bio ?? 'No bio yet.'}
                </p>
              )}
            </div>

            {/* Religion */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Religion</label>
              {editing ? (
                <select className="input text-sm animate-fade-in" value={form.religion ?? ''}
                  onChange={e => update('religion', e.target.value)}
                  style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">Select…</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <p className="text-sm py-2 px-3 rounded-xl animate-fade-in" style={{ background: 'var(--bg-secondary)' }}>
                  {data?.religion ?? <span style={{ color: 'var(--text-muted)' }}>Not set</span>}
                </p>
              )}
            </div>

            {/* Relationship Goals */}
            <div>
              <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Heart className="w-3.5 h-3.5" />Relationship Goals
              </label>
              {editing ? (
                <div className="flex flex-wrap gap-2 animate-fade-in">
                  {GOALS.map(g => (
                    <button key={g} type="button"
                      onClick={() => update('relationship_goals', g)}
                      className="px-3 py-1.5 rounded-full text-sm transition-colors"
                      style={{
                        background: form.relationship_goals === g ? 'var(--rose-glow)' : 'var(--bg-secondary)',
                        color: form.relationship_goals === g ? 'var(--rose)' : 'var(--text-secondary)',
                        border: `1px solid ${form.relationship_goals === g ? 'rgba(255,78,139,0.3)' : 'var(--border)'}`,
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm py-2 px-3 rounded-xl animate-fade-in" style={{ background: 'var(--bg-secondary)' }}>
                  {data?.relationship_goals ?? <span style={{ color: 'var(--text-muted)' }}>Not set</span>}
                </p>
              )}
            </div>

            {/* Interests */}
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Interests</label>
              <div className="flex flex-wrap gap-2 animate-fade-in">
                {(editing ? form.interests : data?.interests)?.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    style={{ background: 'var(--rose-glow)', color: 'var(--rose)', border: '1px solid rgba(255,78,139,0.2)' }}>
                    {tag}
                    {editing && (
                      <button onClick={() => removeInterest(tag)} className="ml-1 opacity-70 hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {editing && (
                  <div className="flex gap-2">
                    <input className="input text-sm" style={{ width: 140, padding: '0.375rem 0.75rem' }}
                      placeholder="Add interest…" value={newInterest}
                      onChange={e => setNewInterest(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())} />
                    <button type="button" onClick={addInterest}
                      className="btn btn-ghost px-3 py-1.5 text-sm"><Plus className="w-4 h-4" /></button>
                  </div>
                )}
                {!editing && (!data?.interests || data.interests.length === 0) && (
                  <p className="text-sm py-2 px-1" style={{ color: 'var(--text-muted)' }}>
                    No interests listed yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
