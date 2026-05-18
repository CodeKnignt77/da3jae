export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string
  real_name: string | null
  age: number | null
  city: string | null
  bio: string | null
  interests: string[] | null
  religion: string | null
  job: string | null
  education: string | null
  height: number | null
  relationship_goals: string | null
  role: UserRole
  is_banned: boolean
  avatar_url: string | null
  gallery_urls: string[] | null
  is_online: boolean
  last_seen: string
  created_at: string
  updated_at: string
}

export type SwipeAction = 'like' | 'super_like' | 'pass'

export interface Swipe {
  id: string
  swiper_id: string
  target_id: string
  action: SwipeAction
  created_at: string
}

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'emoji'

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string | null
  type: MessageType
  media_url: string | null
  reply_to: string | null
  is_read: boolean
  created_at: string
  sender?: Profile
}

export type CallType = 'voice' | 'video'
export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed'

export interface Call {
  id: string
  caller_id: string
  receiver_id: string
  type: CallType
  status: CallStatus
  started_at: string
  ended_at: string | null
  caller?: Profile
  receiver?: Profile
}

export interface Conversation {
  partner: Profile
  last_message: Message | null
  unread_count: number
}
