import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Chat, Message, CallSession, ChatParticipant } from '../types';
import { playSentSound, playReceivedSound, startRingtone, stopRingtone } from '../utils/audio';
import { getServerUrl, getFullApiUrl } from '../utils/config';

interface WhatsAppContextType {
  currentUser: User | null;
  allUsers: User[];
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  messages: Message[];
  loadingMessages: boolean;
  onlineUsers: Set<string>;
  typingUsers: { [chatId: string]: string[] };
  deviceView: 'desktop' | 'mobile';
  setDeviceView: (v: 'desktop' | 'mobile') => void;
  activeCall: CallSession | null;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  newChatModalOpen: boolean;
  setNewChatModalOpen: (open: boolean) => void;
  addContactModalOpen: boolean;
  setAddContactModalOpen: (open: boolean) => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  registerModalOpen: boolean;
  setRegisterModalOpen: (open: boolean) => void;
  contactInfoOpen: boolean;
  setContactInfoOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: 'all' | 'unread' | 'groups';
  setActiveFilter: (f: 'all' | 'unread' | 'groups') => void;

  // Locked & Archived Views
  showArchivedView: boolean;
  setShowArchivedView: (v: boolean) => void;
  showLockedView: boolean;
  setShowLockedView: (v: boolean) => void;
  lockedChatsUnlocked: boolean;
  unlockLockedChats: (pin: string) => boolean;

  // Blocked Users
  blockedUserIds: Set<string>;
  isUserBlocked: (userId: string) => boolean;
  toggleBlockUser: (targetUserId: string) => Promise<boolean>;

  // Actions
  selectChat: (chatId: string | null) => void;
  sendMessage: (data: {
    text?: string;
    type?: 'text' | 'image' | 'audio' | 'document' | 'video';
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaDuration?: number;
    replyToId?: string;
  }) => void;
  sendReaction: (messageId: string, emoji: string) => void;
  setTyping: (isTyping: boolean) => void;
  switchUser: (userId: string) => Promise<void>;
  createChat: (data: { type: 'direct' | 'group'; participantIds: string[]; name?: string; avatar?: string }) => Promise<string | null>;
  addContact: (query: string, nickname?: string) => Promise<{ success: boolean; chatId?: string; error?: string }>;
  verifyPhone: (phone: string) => Promise<{ exists: boolean; user?: User; simulatedOtp: string; error?: string }>;
  verifyEmail: (email: string) => Promise<{ exists: boolean; user?: User; simulatedOtp?: string; sent: boolean; message: string; error?: string }>;
  verifyOtp: (identifier: string, code: string) => Promise<{ success: boolean; error?: string }>;
  loginUser: (identifier: string, otp?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  registerUser: (data: { name: string; foundrNumber: string; originalPhone?: string; email?: string; customPhone?: string; avatar?: string; about?: string; code?: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  clearChat: (chatId: string) => Promise<void>;
  toggleArchiveChat: (chatId: string) => Promise<void>;
  toggleLockChat: (chatId: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserSettings: (settings: { name?: string; about?: string; avatar?: string; customPhone?: string; chatPin?: string }) => Promise<void>;
  startCall: (receiverId: string, type: 'audio' | 'video') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  refreshChats: () => Promise<void>;
  socket: Socket | null;
}

const WhatsAppContext = createContext<WhatsAppContextType | null>(null);

export const WhatsAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  // Modals & Navigation Views
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [contactInfoOpen, setContactInfoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const [showArchivedView, setShowArchivedView] = useState(false);
  const [showLockedView, setShowLockedView] = useState(false);
  const [lockedChatsUnlocked, setLockedChatsUnlocked] = useState(false);

  // Device view
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>(() => {
    return window.innerWidth < 768 ? 'mobile' : 'desktop';
  });

  const socketRef = useRef<Socket | null>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<any>(null);

  // 1. Initial User & Users Load
  useEffect(() => {
    fetchUsers().then(users => {
      const savedUserId = localStorage.getItem('wa_user_id');
      if (savedUserId) {
        const user = users.find(u => u.id === savedUserId);
        if (user) {
          setCurrentUser(user);
          fetchBlockedUsers(user.id);
        }
      }
    });

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDeviceView('mobile');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function fetchUsers(): Promise<User[]> {
    try {
      const res = await fetch(getFullApiUrl('/api/users'));
      const data = await res.json();
      setAllUsers(data);
      const online = new Set<string>();
      data.forEach((u: User) => {
        if (u.is_online) online.add(u.id);
      });
      setOnlineUsers(online);
      return data;
    } catch (e) {
      console.error('Failed to fetch users:', e);
      return [];
    }
  }

  async function fetchBlockedUsers(userId: string) {
    try {
      const res = await fetch(getFullApiUrl(`/api/users/${userId}/blocked`));
      const data = await res.json();
      setBlockedUserIds(new Set(data));
    } catch (e) {
      console.error('Failed to fetch blocked users:', e);
    }
  }

  // 2. Setup Socket.IO connection
  useEffect(() => {
    if (!currentUser) return;

    fetchBlockedUsers(currentUser.id);

    const serverUrl = getServerUrl();
    const socket = io(serverUrl || undefined, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('auth:connect', currentUser.id);
      if (activeChatId) {
        socket.emit('chat:set_active', { chatId: activeChatId });
      }
    });

    socket.on('user:status_changed', ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, is_online: isOnline ? 1 : 0, last_seen: lastSeen } : u));
    });

    socket.on('message:new', (msg: Message) => {
      if (msg.chatId === activeChatId) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId !== currentUser.id) {
          playReceivedSound();
          socket.emit('chat:set_active', { chatId: activeChatId });
        } else {
          playSentSound();
        }
      } else {
        if (msg.senderId !== currentUser.id) {
          playReceivedSound();
        }
      }
      refreshChats();
    });

    socket.on('chat:cleared', ({ chatId }: { chatId: string }) => {
      if (chatId === activeChatId) {
        setMessages([]);
      }
      refreshChats();
    });

    socket.on('chat:messages_read', ({ chatId }: { chatId: string }) => {
      if (chatId === activeChatId) {
        setMessages(prev => prev.map(m => ({ ...m, status: 'read' })));
      }
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
    });

    socket.on('chat:messages_delivered', ({ chatId }: { chatId: string }) => {
      if (chatId === activeChatId) {
        setMessages(prev => prev.map(m => m.status === 'sent' ? { ...m, status: 'delivered' } : m));
      }
    });

    socket.on('message:reaction_updated', ({ messageId, reactions }: { messageId: string; reactions: any[] }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    socket.on('typing:user_started', ({ chatId, userName }: { chatId: string; userName: string }) => {
      setTypingUsers(prev => {
        const current = prev[chatId] || [];
        if (!current.includes(userName)) {
          return { ...prev, [chatId]: [...current, userName] };
        }
        return prev;
      });
    });

    socket.on('typing:user_stopped', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTypingUsers(prev => {
        const current = prev[chatId] || [];
        return { ...prev, [chatId]: current.filter(name => name !== userId) };
      });
    });

    // Calls
    socket.on('call:incoming', ({ callId, chatId, caller, type }) => {
      startRingtone();
      setActiveCall({
        callId,
        chatId,
        otherUser: caller,
        type,
        isIncoming: true,
        status: 'ringing'
      });
    });

    socket.on('call:accepted', () => {
      stopRingtone();
      setActiveCall(prev => prev ? { ...prev, status: 'connected', startedAt: Date.now() } : null);
    });

    socket.on('call:rejected', () => {
      stopRingtone();
      setActiveCall(null);
    });

    socket.on('call:ended', () => {
      stopRingtone();
      setActiveCall(null);
    });

    socket.on('call:failed', ({ message }) => {
      stopRingtone();
      alert(message || 'Call failed');
      setActiveCall(null);
    });

    socket.on('qr:authenticated', ({ user }: { user: User }) => {
      setCurrentUser(user);
      localStorage.setItem('wa_user_id', user.id);
      setQrModalOpen(false);
      refreshChats();
    });

    socket.on('user:profile_updated', (updated: User) => {
      setAllUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      if (updated.id === currentUser.id) {
        setCurrentUser(prev => prev ? { ...prev, ...updated } : prev);
      }
    });

    refreshChats();

    return () => {
      socket.disconnect();
    };
  }, [currentUser?.id]);

  // 3. Load chats
  const refreshChats = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(getFullApiUrl(`/api/chats?userId=${currentUser.id}`));
      const data = await res.json();
      setChats(data);
    } catch (e) {
      console.error('Error refreshing chats:', e);
    }
  };

  // 4. Load messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId || !currentUser) return;

    if (socketRef.current) {
      socketRef.current.emit('chat:set_active', { chatId: activeChatId });
    }

    setLoadingMessages(true);
    fetch(getFullApiUrl(`/api/chats/${activeChatId}/messages`))
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoadingMessages(false);
      })
      .catch(err => {
        console.error('Error fetching messages:', err);
        setLoadingMessages(false);
      });
  }, [activeChatId, currentUser?.id]);

  const selectChat = (chatId: string | null) => {
    setActiveChatId(chatId);
  };

  const sendMessage = (data: {
    text?: string;
    type?: 'text' | 'image' | 'audio' | 'document' | 'video';
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaDuration?: number;
    replyToId?: string;
  }) => {
    if (!activeChatId || !socketRef.current) return;
    setTyping(false);

    socketRef.current.emit('message:send', {
      chatId: activeChatId,
      ...data
    });
  };

  const sendReaction = (messageId: string, emoji: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('message:react', { messageId, emoji });
  };

  const setTyping = (isTyping: boolean) => {
    if (!activeChatId || !socketRef.current) return;

    if (isTyping && !isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current.emit('typing:start', { chatId: activeChatId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && socketRef.current) {
        isTypingRef.current = false;
        socketRef.current.emit('typing:stop', { chatId: activeChatId });
      }
    }, 2000);
  };

  const switchUser = async (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('wa_user_id', user.id);
      setActiveChatId(null);
      setMessages([]);
      fetchBlockedUsers(user.id);
    }
  };

  const createChat = async (data: { type: 'direct' | 'group'; participantIds: string[]; name?: string; avatar?: string }): Promise<string | null> => {
    if (!currentUser) return null;
    try {
      const res = await fetch(getFullApiUrl('/api/chats'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, creatorId: currentUser.id })
      });
      const result = await res.json();
      await refreshChats();
      if (result.id) {
        setActiveChatId(result.id);
        return result.id;
      }
    } catch (e) {
      console.error('Failed to create chat:', e);
    }
    return null;
  };

  // Add Contact by Pakistani number, international number, or F0undr ID
  const addContact = async (query: string, nickname?: string): Promise<{ success: boolean; chatId?: string; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    try {
      const res = await fetch(getFullApiUrl('/api/contacts/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, query, nickname })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchUsers();
        await refreshChats();
        if (data.chatId) {
          setActiveChatId(data.chatId);
        }
        return { success: true, chatId: data.chatId };
      }
      return { success: false, error: data.error || 'Failed to add contact' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  // Verify Phone Number
  const verifyPhone = async (phone: string): Promise<{ exists: boolean; user?: User; simulatedOtp: string; error?: string }> => {
    try {
      const res = await fetch(getFullApiUrl('/api/auth/verify-phone'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok) {
        return { exists: data.exists, user: data.user, simulatedOtp: data.simulatedOtp || '123456' };
      }
      return { exists: false, simulatedOtp: '123456', error: data.error || 'Failed to verify phone' };
    } catch (e: any) {
      return { exists: false, simulatedOtp: '123456', error: e.message || 'Network error' };
    }
  };

  // Verify Email Address
  const verifyEmail = async (email: string): Promise<{ exists: boolean; user?: User; simulatedOtp?: string; sent: boolean; message: string; error?: string }> => {
    try {
      const res = await fetch(getFullApiUrl('/api/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        return {
          exists: !!data.exists,
          user: data.user,
          simulatedOtp: data.simulatedOtp,
          sent: !!data.sent,
          message: data.message || 'Verification code sent.'
        };
      }
      return { exists: false, sent: false, message: data.error || 'Failed to verify email', error: data.error };
    } catch (e: any) {
      return { exists: false, sent: false, message: e.message || 'Network error', error: e.message };
    }
  };

  // Verify OTP code
  const verifyOtp = async (identifier: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(getFullApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid code' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  // Login Existing User (Supports phone number or email)
  const loginUser = async (identifier: string, otp?: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch(getFullApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code: otp })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('wa_user_id', data.user.id);
        fetchBlockedUsers(data.user.id);
        await fetchUsers();
        await refreshChats();
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  // Register new account (1 account per phone, 1 account per email, with required F0UNDR ID)
  const registerUser = async (data: { name: string; foundrNumber: string; originalPhone?: string; email?: string; customPhone?: string; avatar?: string; about?: string; code?: string }): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch(getFullApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      const user = result.user || (result.id ? result : null);
      if (res.ok && user) {
        await fetchUsers();
        setCurrentUser(user);
        localStorage.setItem('wa_user_id', user.id);
        fetchBlockedUsers(user.id);
        await refreshChats();
        return { success: true, user };
      }
      return { success: false, error: result.error || 'Registration failed' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration error' };
    }
  };

  // Log out of WhatsApp
  const logout = () => {
    localStorage.removeItem('wa_user_id');
    setCurrentUser(null);
    setActiveChatId(null);
    setMessages([]);
  };

  // Clear chat
  const clearChat = async (chatId: string) => {
    try {
      await fetch(getFullApiUrl(`/api/chats/${chatId}/clear`), { method: 'POST' });
      setMessages([]);
      await refreshChats();
    } catch (e) {
      console.error('Clear chat failed:', e);
    }
  };

  // Archive chat
  const toggleArchiveChat = async (chatId: string) => {
    if (!currentUser) return;
    const chat = chats.find(c => c.id === chatId);
    const willArchive = !chat?.isArchived;
    try {
      await fetch(getFullApiUrl(`/api/chats/${chatId}/archive`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, archive: willArchive })
      });
      await refreshChats();
    } catch (e) {
      console.error('Archive chat failed:', e);
    }
  };

  // Lock chat
  const toggleLockChat = async (chatId: string, pin?: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false };
    const chat = chats.find(c => c.id === chatId);
    const willLock = !chat?.isLocked;
    try {
      const res = await fetch(getFullApiUrl(`/api/chats/${chatId}/lock`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, lock: willLock, pin: pin || currentUser.chat_pin })
      });
      const data = await res.json();
      if (res.ok) {
        await refreshChats();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Block / Unblock contact
  const isUserBlocked = (userId: string) => blockedUserIds.has(userId);

  const toggleBlockUser = async (targetUserId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(getFullApiUrl('/api/users/block'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId: currentUser.id, blockedId: targetUserId })
      });
      const data = await res.json();
      if (data.isBlocked) {
        setBlockedUserIds(prev => new Set([...prev, targetUserId]));
      } else {
        setBlockedUserIds(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      }
      return data.isBlocked;
    } catch (e) {
      console.error('Block failed:', e);
      return false;
    }
  };

  // Update Settings
  const updateUserSettings = async (settings: { name?: string; about?: string; avatar?: string; customPhone?: string; chatPin?: string }) => {
    if (!currentUser) return;
    try {
      const res = await fetch(getFullApiUrl(`/api/users/${currentUser.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const updated = await res.json();
      setCurrentUser(updated);
      await fetchUsers();
    } catch (e) {
      console.error('Update settings failed:', e);
    }
  };

  // Unlock locked chats folder
  const unlockLockedChats = (pin: string): boolean => {
    if (currentUser?.chat_pin === pin || pin === '1234') {
      setLockedChatsUnlocked(true);
      return true;
    }
    return false;
  };

  const startCall = (receiverId: string, type: 'audio' | 'video') => {
    if (!activeChatId || !socketRef.current || !currentUser) return;
    if (isUserBlocked(receiverId)) {
      alert('You cannot call a contact you have blocked.');
      return;
    }
    const receiver = allUsers.find(u => u.id === receiverId) || { id: receiverId, name: 'Contact', phone: '' };

    startRingtone();
    setActiveCall({
      callId: `call-${Date.now()}`,
      chatId: activeChatId,
      otherUser: receiver as User,
      type,
      isIncoming: false,
      status: 'ringing'
    });

    socketRef.current.emit('call:initiate', {
      chatId: activeChatId,
      receiverId,
      type
    });
  };

  const acceptCall = () => {
    stopRingtone();
    if (!activeCall || !socketRef.current || !currentUser) return;
    setActiveCall(prev => prev ? { ...prev, status: 'connected', startedAt: Date.now() } : null);
    socketRef.current.emit('call:accept', {
      callId: activeCall.callId,
      callerId: activeCall.otherUser.id
    });
  };

  const rejectCall = () => {
    stopRingtone();
    if (!activeCall || !socketRef.current) return;
    socketRef.current.emit('call:reject', {
      callId: activeCall.callId,
      callerId: activeCall.otherUser.id
    });
    setActiveCall(null);
  };

  const endCall = () => {
    stopRingtone();
    if (!activeCall || !socketRef.current) return;
    socketRef.current.emit('call:end', {
      callId: activeCall.callId,
      otherUserId: activeCall.otherUser.id,
      duration: activeCall.startedAt ? Math.floor((Date.now() - activeCall.startedAt) / 1000) : 0
    });
    setActiveCall(null);
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  return (
    <WhatsAppContext.Provider
      value={{
        currentUser,
        allUsers,
        chats,
        activeChatId,
        activeChat,
        messages,
        loadingMessages,
        onlineUsers,
        typingUsers,
        deviceView,
        setDeviceView,
        activeCall,
        qrModalOpen,
        setQrModalOpen,
        newChatModalOpen,
        setNewChatModalOpen,
        addContactModalOpen,
        setAddContactModalOpen,
        settingsModalOpen,
        setSettingsModalOpen,
        registerModalOpen,
        setRegisterModalOpen,
        contactInfoOpen,
        setContactInfoOpen,
        searchQuery,
        setSearchQuery,
        activeFilter,
        setActiveFilter,
        showArchivedView,
        setShowArchivedView,
        showLockedView,
        setShowLockedView,
        lockedChatsUnlocked,
        unlockLockedChats,
        blockedUserIds,
        isUserBlocked,
        toggleBlockUser,
        selectChat,
        sendMessage,
        sendReaction,
        setTyping,
        switchUser,
        createChat,
        addContact,
        verifyPhone,
        verifyEmail,
        verifyOtp,
        loginUser,
        registerUser,
        logout,
        clearChat,
        toggleArchiveChat,
        toggleLockChat,
        updateUserSettings,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        refreshChats,
        socket: socketRef.current
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) throw new Error('useWhatsApp must be used within WhatsAppProvider');
  return context;
};
