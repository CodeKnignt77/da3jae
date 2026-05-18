# 💫 Da3jae — Premium Luxury Discovery Platform

**Da3jae** is a premium, dark-luxury discovery, match, and interaction platform designed exclusively for poets, writers, and creatives. Combining high-end design aesthetics with real-time communications, the platform offers an unparalleled matchmaking experience.

---

## ✨ Key Features

### 1. Mandatory Profile Onboarding Guard
- **Strict Client-Side Guard:** Brand new users are automatically intercepted on sign-up and restricted from browsing until they complete their basic profile information.
- **Premium Onboarding Card:** Centered full-screen multi-step form to collect Real Name, Bio, Age validation (18+), City, Job, Education, Height, Religion, Relationship Goals, and Interests.
- **Avatar & Gallery Uploads:** Direct integrations with Supabase storage buckets to save avatars and creative galleries.

### 2. Symmetric Centered UI & Settings Editor
- **Centered Layouts:** Redesigned Settings and Profile edit cards positioned symmetrically in the exact center of the viewport for a luxury, visual-first display.
- **Creative Portfolio Grid:** Fluid aspect-ratio photo grids showing the user's creative photo gallery. Users can easily append new gallery uploads or remove old ones instantly in edit mode.

### 3. Zoomed & Spacious Real-time Messaging
- **Enhanced Legibility:** Beautifully enlarged text bubbles (`text-[15px]`), spacious `w-[23.5rem]` sidebar, and custom active state animations for high comfort and ease of reading.
- **Global Directory Lookup:** Active debounced search in the sidebar filters both ongoing conversations and enables lookup of *any registered poet* in the database, initiating direct conversations.
- **Direct Messaging from Explore:** The explore swipe cards feature a prominent slow-pulsing Message button that instantly opens a direct chat window.

### 4. Robust WebRTC Voice & Video Calling
- **Global Incoming Call Receiver:** Root-level listener across all main pages intercepts calls, rendering a stunning centered incoming call overlay.
- **Web Audio Programmatical Chimes:** Plays a luxurious dual-chime digital ringtone programmatically using native **Web Audio synthesis** (no high-overhead audio assets required!).
- **Offerer/Answerer Synchronization:** Clear role-based signaling (`?role=caller` / `?role=receiver`) with rigid peer connection guards, preventing signaling collisions or SDP errors.
- **Full Call Control:** Quick toggles for microphone mute, video off, call decline notify, and automated timers.

---

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion, Lucide React
- **Database & Auth:** Supabase PostgreSQL, Supabase Row-Level Security (RLS)
- **Real-time Signaling:** Supabase Realtime Broadcast & Replication channels
- **Media Storage:** Supabase Cloud Storage (public buckets for avatars and creative galleries)
- **Ringtone Engine:** Native HTML5 Web Audio API Synthesizer

---

## 🚀 Local Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/da3jae.git
cd da3jae
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_local_or_cloud_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_or_cloud_anon_key
```

### 3. Setup Database Schema
Execute the database schema and public storage buckets setup scripts:
- Run [supabase/schema.sql](file:///c:/Users/Lenovo/da3jae/supabase/schema.sql) in your Supabase SQL Editor.
- Run [supabase/create_storage_bucket.sql](file:///c:/Users/Lenovo/da3jae/supabase/create_storage_bucket.sql) to build the `media` storage bucket and setup authentication upload policies.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ☁️ Production Deployment on Vercel

1. Create a production cloud project on [Supabase.com](https://supabase.com) and execute your local `schema.sql` and `create_storage_bucket.sql` scripts.
2. Under **Database -> Replication** in your Supabase Dashboard, toggle on Replication for the `messages` table.
3. Import your GitHub repository to **Vercel** and add your production environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Update your **Authentication URL Configuration** in the Supabase Dashboard to point to your live Vercel domain (`https://yourdomain.vercel.app`).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](file:///c:/Users/Lenovo/da3jae/LICENSE) file for details.

