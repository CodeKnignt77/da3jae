'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Plus, X, Heart, MapPin, Briefcase, GraduationCap, Ruler, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const GOALS = ['Marriage', 'Serious Relationship', 'Friendship', 'Not Sure Yet']
const RELIGIONS = ['Muslim', 'Christian', 'Jewish', 'Atheist', 'Other', 'Prefer not to say']

export default function Onboarding() {
  const { profile, refreshProfile } = useAuth()
  const supabase = createClient()

  // Form State
  const [realName, setRealName] = useState(profile?.real_name || '')
  const [age, setAge] = useState<number | ''>('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [job, setJob] = useState('')
  const [education, setEducation] = useState('')
  const [height, setHeight] = useState<number | ''>('')
  const [religion, setReligion] = useState('')
  const [relationshipGoals, setRelationshipGoals] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])

  // UI State
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [error, setError] = useState('')

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingAvatar(true)
    setError('')
    try {
      const path = `avatars/${profile.id}/${Date.now()}.${file.name.split('.').pop()}`
      const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      setAvatarUrl(publicUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !profile) return
    setUploadingGallery(true)
    setError('')
    try {
      const newUrls = [...galleryUrls]
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `gallery/${profile.id}/${Date.now()}-${i}.${file.name.split('.').pop()}`
        const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
        newUrls.push(publicUrl)
      }
      setGalleryUrls(newUrls)
    } catch (err: any) {
      setError(err.message || 'Failed to upload gallery images.')
    } finally {
      setUploadingGallery(false)
    }
  }

  function removeGalleryImage(urlToRemove: string) {
    setGalleryUrls(prev => prev.filter(url => url !== urlToRemove))
  }

  function addInterest() {
    if (!newInterest.trim()) return
    if (interests.includes(newInterest.trim())) {
      setNewInterest('')
      return
    }
    setInterests(prev => [...prev, newInterest.trim()])
    setNewInterest('')
  }

  function removeInterest(tag: string) {
    setInterests(prev => prev.filter(t => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!profile) return
    if (!age || age < 18 || age > 100) {
      setError('You must be between 18 and 100 years old.')
      return
    }
    if (!city.trim()) {
      setError('Please provide your city.')
      return
    }
    if (!avatarUrl) {
      setError('Please upload a profile picture.')
      return
    }

    setLoading(true)
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          real_name: realName.trim() || null,
          age: Number(age),
          city: city.trim(),
          bio: bio.trim() || null,
          job: job.trim() || null,
          education: education.trim() || null,
          height: height ? Number(height) : null,
          religion: religion || null,
          relationship_goals: relationshipGoals || null,
          interests: interests.length > 0 ? interests : null,
          avatar_url: avatarUrl,
          gallery_urls: galleryUrls.length > 0 ? galleryUrls : null,
        })
        .eq('id', profile.id)

      if (updateErr) throw updateErr

      await refreshProfile()
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile registration.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--bg-primary)' }}>
      {/* Background radial highlights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,78,139,0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass w-full max-w-2xl p-8 rounded-3xl z-10 relative"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="w-6 h-6 text-rose animate-pulse" style={{ color: 'var(--rose)' }} fill="currentColor" />
          <span className="text-xl font-semibold gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>da3jae</span>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome, Poet!</h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Let's set up your luxury profile to begin your discovery journey.
        </p>

        {error && (
          <div className="text-sm px-4 py-3 rounded-xl mb-6" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Avatar Upload Container */}
          <div className="flex flex-col items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Profile Photo *</label>
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="avatar w-24 h-24 sm:w-28 sm:h-28" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white border-2 border-dashed border-gray-600"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                  {profile?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-105"
                style={{ background: 'var(--gradient-brand)' }}>
                {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Required to complete registration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real Name */}
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Real Name</label>
              <input className="input" type="text" placeholder="Your name (e.g. Yassine)"
                value={realName} onChange={e => setRealName(e.target.value)} />
            </div>

            {/* Age */}
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Age *</label>
              <input className="input" type="number" min={18} max={100} placeholder="Minimum 18"
                value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : '')} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="w-3.5 h-3.5" />City *
              </label>
              <input className="input" type="text" placeholder="e.g. Casablanca, Rabat"
                value={city} onChange={e => setCity(e.target.value)} required />
            </div>

            {/* Job */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Briefcase className="w-3.5 h-3.5" />Job
              </label>
              <input className="input" type="text" placeholder="e.g. Architect, Software Engineer"
                value={job} onChange={e => setJob(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Education */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <GraduationCap className="w-3.5 h-3.5" />Education
              </label>
              <input className="input" type="text" placeholder="e.g. Master's in Business, Al Akhawayn University"
                value={education} onChange={e => setEducation(e.target.value)} />
            </div>

            {/* Height */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Ruler className="w-3.5 h-3.5" />Height (cm)
              </label>
              <input className="input" type="number" placeholder="e.g. 175"
                value={height} onChange={e => setHeight(e.target.value ? Number(e.target.value) : '')} />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Bio</label>
            <textarea className="input resize-none" rows={3} placeholder="A short description about yourself, what you value, and what poems resonate with you..."
              value={bio} onChange={e => setBio(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Religion */}
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Religion</label>
              <select className="input" value={religion} onChange={e => setReligion(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
                <option value="">Select...</option>
                {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Goals */}
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Heart className="w-3.5 h-3.5" />Relationship Goals
              </label>
              <select className="input" value={relationshipGoals} onChange={e => setRelationshipGoals(e.target.value)} style={{ background: 'var(--bg-secondary)' }}>
                <option value="">Select...</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Gallery Upload Container */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <ImageIcon className="w-4 h-4" />Photo Gallery
            </label>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {/* Render existing gallery images */}
              {galleryUrls.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-800 group">
                  <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeGalleryImage(url)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black transition-colors">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}

              {/* Upload Box */}
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
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Interests / Hobbies</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                  style={{ background: 'var(--rose-glow)', color: 'var(--rose)', border: '1px solid rgba(255,78,139,0.2)' }}>
                  {tag}
                  <button type="button" onClick={() => removeInterest(tag)} className="ml-1 opacity-70 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input" style={{ padding: '0.5rem 0.75rem' }} placeholder="Add interest (e.g. Poetry, Traveling, Cooking)"
                value={newInterest} onChange={e => setNewInterest(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())} />
              <button type="button" onClick={addInterest} className="btn btn-ghost px-4 py-2">
                Add
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-full py-3 mt-4 text-base font-semibold" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Completing Registration…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Complete Profile & Start Discovery
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
