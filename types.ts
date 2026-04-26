
export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  mimeType?: string;
  localId?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  text?: string;
  media_url?: string;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
  type: 'text' | 'image' | 'audio' | 'sticker' | 'video' | 'document';
  reactions?: Record<string, string>; // userId -> emoji
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to_id?: string;
  is_pending?: boolean;
  metadata?: MediaMetadata;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  status?: 'online' | 'offline';
  last_seen?: string;
  pin?: string;
}
