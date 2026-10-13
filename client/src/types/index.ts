export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'video';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Reaction {
  userId: string;
  emoji: string;
}

export interface User {
  id: string;
  phone: string;
  original_phone?: string;
  email?: string;
  foundr_number?: string;
  custom_phone?: string;
  name: string;
  about?: string;
  avatar?: string;
  chat_pin?: string;
  is_online?: number | boolean;
  last_seen?: number;
  created_at?: number;
}

export interface ChatParticipant {
  id: string;
  name: string;
  phone?: string;
  original_phone?: string;
  email?: string;
  foundr_number?: string;
  about?: string;
  avatar?: string;
  is_online?: number | boolean;
  last_seen?: number;
  role?: 'admin' | 'member';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  text?: string | null;
  type: MessageType;
  mediaUrl?: string | null;
  mediaName?: string | null;
  mediaSize?: number | null;
  mediaDuration?: number | null;
  status: MessageStatus;
  replyToId?: string | null;
  reactions: Reaction[];
  createdAt: number;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string | null;
  avatar?: string | null;
  isArchived?: boolean;
  isLocked?: boolean;
  createdAt: number;
  updatedAt: number;
  unreadCount: number;
  participants: ChatParticipant[];
  lastMessage?: {
    id: string;
    sender_id: string;
    text: string | null;
    type: MessageType;
    status: MessageStatus;
    created_at: number;
  } | null;
}

export interface CallSession {
  callId: string;
  chatId?: string;
  otherUser: User | ChatParticipant;
  type: 'audio' | 'video';
  isIncoming: boolean;
  status: 'ringing' | 'connected' | 'ended';
  startedAt?: number;
}
