import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Camera,
  Search,
  MoreVertical,
  Users,
  MessageSquare,
  Phone,
  Plus,
  Video,
  ArrowUpRight,
  ArrowDownLeft,
  CircleDot,
  Check,
  UserPlus,
  Lock,
  Archive,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from '../common/Avatar';
import { StatusTick } from '../common/StatusTick';
import { ChatArea } from '../chat/ChatArea';
import { Chat } from '../../types';

export const MobileLayout: React.FC = () => {
  const {
    currentUser,
    chats,
    activeChatId,
    selectChat,
    onlineUsers,
    typingUsers,
    setNewChatModalOpen,
    setAddContactModalOpen,
    setSettingsModalOpen,
    setRegisterModalOpen,
    setQrModalOpen,
    setShowArchivedView,
    setShowLockedView,
    startCall,
    allUsers,
    switchUser
  } = useWhatsApp();

  const [activeTab, setActiveTab] = useState<'chats' | 'updates' | 'calls' | 'communities'>('chats');
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // If a chat is active on mobile, show the full-screen chat screen
  if (activeChatId) {
    return (
      <div className="h-full w-full flex flex-col bg-[#0b141a]">
        <ChatArea onBack={() => selectChat(null)} isMobile={true} />
      </div>
    );
  }

  // Format WhatsApp chat timestamp
  const formatChatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'M/d/yy');
  };

  const lockedChatsCount = chats.filter((c) => c.isLocked).length;
  const archivedChatsCount = chats.filter((c) => c.isArchived).length;

  const filteredChats = chats.filter((c) => {
    if (c.isLocked || c.isArchived) return false;

    const otherParticipant =
      c.type === 'direct' ? c.participants.find((p) => p.id !== currentUser?.id) : null;
    const title = c.type === 'group' ? c.name : otherParticipant?.name || '';
    return (
      title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherParticipant?.phone?.includes(searchQuery) ||
      otherParticipant?.foundr_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalUnread = chats.filter(c => !c.isLocked && !c.isArchived).reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="h-full w-full flex flex-col bg-[#111b21] select-none relative overflow-hidden">
      {/* 1. WhatsApp Mobile Top App Bar */}
      <div className="bg-[#202c33] text-[#e9edef] px-4 pt-3 pb-1 shadow-md z-20">
        <div className="flex items-center justify-between h-11">
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 bg-[#2a3942] px-3 py-1.5 rounded-full">
              <Search size={18} className="text-[#8696a0]" />
              <input
                type="text"
                placeholder="Search name, phone, or F0UNDR ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-sm text-[#e9edef] focus:outline-none"
              />
              <button onClick={() => setSearchOpen(false)} className="text-xs text-[#8696a0]">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-wide text-[#e9edef]">WhatsApp</span>
                {/* Account Switch Badge */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="px-2 py-0.5 rounded-full bg-[#2a3942] text-[10px] text-[#00a884] font-semibold border border-[#00a884]/30"
                >
                  {currentUser?.name} ▾
                </button>
              </div>

              <div className="flex items-center gap-4 text-[#aebac1]">
                <button
                  onClick={() => alert('Camera: Take photo or video for WhatsApp status')}
                  className="hover:text-white"
                >
                  <Camera size={20} />
                </button>
                <button onClick={() => setSearchOpen(true)} className="hover:text-white">
                  <Search size={20} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowMenu(!showMenu)} className="hover:text-white">
                    <MoreVertical size={20} />
                  </button>
                  {showMenu && (
                    <div className="absolute top-8 right-0 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-2xl py-2 z-50 w-56 text-sm text-[#e9edef] animate-fade-in">
                      <button
                        onClick={() => {
                          setAddContactModalOpen(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2a3942] flex items-center gap-2 text-[#00a884]"
                      >
                        <UserPlus size={16} />
                        <span>Add contact</span>
                      </button>
                      <button
                        onClick={() => {
                          setNewChatModalOpen(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2a3942]"
                      >
                        New group
                      </button>
                      <button
                        onClick={() => {
                          setShowLockedView(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2a3942] flex items-center gap-2"
                      >
                        <Lock size={16} className="text-[#00a884]" />
                        <span>Locked chats</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowArchivedView(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2a3942] flex items-center gap-2"
                      >
                        <Archive size={16} className="text-[#8696a0]" />
                        <span>Archived chats</span>
                      </button>
                      <button
                        onClick={() => {
                          setQrModalOpen(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2a3942]"
                      >
                        Linked devices
                      </button>
                      <button
                        onClick={() => {
                          setSettingsModalOpen(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2a3942] border-t border-[#2a3942] mt-1 pt-2 flex items-center gap-2"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setRegisterModalOpen(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2a3942] text-[#00a884] flex items-center gap-2"
                      >
                        <ShieldCheck size={16} />
                        <span>Register New Number</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Account Switcher dropdown */}
        {showUserMenu && (
          <div className="absolute top-14 left-4 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-2xl p-2 z-50 w-64 animate-fade-in">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-[10px] font-semibold text-[#8696a0] uppercase">
                Switch Phone Account
              </span>
              <button
                onClick={() => {
                  setRegisterModalOpen(true);
                  setShowUserMenu(false);
                }}
                className="text-[10px] text-[#00a884] hover:underline font-semibold"
              >
                + Register New
              </button>
            </div>
            {allUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  switchUser(u.id);
                  setShowUserMenu(false);
                }}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-xs transition-colors ${
                  u.id === currentUser?.id
                    ? 'bg-[#00a884]/20 text-[#00a884] font-semibold'
                    : 'text-[#e9edef] hover:bg-[#2a3942]'
                }`}
              >
                <Avatar src={u.avatar} name={u.name} size="sm" isOnline={u.is_online} />
                <div className="flex-1 text-left truncate">
                  <div className="truncate font-medium">{u.name}</div>
                  <div className="text-[10px] text-[#8696a0] font-mono">{u.phone}</div>
                </div>
                {u.id === currentUser?.id && <Check size={14} />}
              </button>
            ))}
          </div>
        )}

        {/* 2. Top Navigation Tabs */}
        <div className="flex items-center text-sm font-semibold border-b border-[#222e35] mt-1">
          <button
            onClick={() => setActiveTab('communities')}
            className={`py-2 px-2 text-[#8696a0] hover:text-[#e9edef] ${
              activeTab === 'communities' ? 'text-[#00a884] border-b-2 border-[#00a884]' : ''
            }`}
          >
            <Users size={19} />
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 text-center flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'chats'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <span>Chats</span>
            {totalUnread > 0 && (
              <span className="bg-[#00a884] text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`flex-1 py-2 text-center transition-colors ${
              activeTab === 'updates'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <span>Updates</span>
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex-1 py-2 text-center transition-colors ${
              activeTab === 'calls'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <span>Calls</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Contents */}
      <div className="flex-1 overflow-y-auto">
        {/* TAB: CHATS */}
        {activeTab === 'chats' && (
          <div>
            {/* Locked Chats & Archived Folders */}
            <div className="divide-y divide-[#222e35]/40 border-b border-[#222e35]">
              <div
                onClick={() => setShowLockedView(true)}
                className="px-4 py-2.5 flex items-center justify-between text-[#8696a0] hover:bg-[#202c33] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Lock size={18} className="text-[#00a884]" />
                  <span className="text-sm font-medium text-[#e9edef]">Locked chats</span>
                </div>
                {lockedChatsCount > 0 && (
                  <span className="text-xs font-semibold text-[#00a884] bg-[#00a884]/15 px-2 py-0.5 rounded-full">
                    {lockedChatsCount}
                  </span>
                )}
              </div>

              <div
                onClick={() => setShowArchivedView(true)}
                className="px-4 py-2.5 flex items-center justify-between text-[#8696a0] hover:bg-[#202c33] cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Archive size={18} className="text-[#8696a0]" />
                  <span className="text-sm font-medium text-[#e9edef]">Archived</span>
                </div>
                {archivedChatsCount > 0 && (
                  <span className="text-xs font-semibold text-[#8696a0] bg-white/10 px-2 py-0.5 rounded-full">
                    {archivedChatsCount}
                  </span>
                )}
              </div>
            </div>

            {/* Main Chat List */}
            <div className="divide-y divide-[#222e35]/40">
              {filteredChats.map((chat) => {
                const otherParticipant =
                  chat.type === 'direct'
                    ? chat.participants.find((p) => p.id !== currentUser?.id)
                    : null;

                const title = chat.type === 'group' ? chat.name : otherParticipant?.name || 'Contact';
                const avatar = chat.type === 'group' ? chat.avatar : otherParticipant?.avatar;
                const isOnline = otherParticipant ? onlineUsers.has(otherParticipant.id) : false;

                const typingList = typingUsers[chat.id] || [];
                const isTyping = typingList.length > 0;
                const isOutgoing = chat.lastMessage?.sender_id === currentUser?.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#202c33] active:bg-[#2a3942] cursor-pointer transition-colors"
                  >
                    <Avatar
                      src={avatar}
                      name={title}
                      size="md"
                      isOnline={chat.type === 'direct' ? isOnline : false}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-base font-medium text-[#e9edef] truncate">{title}</h4>
                        <span
                          className={`text-xs ${
                            chat.unreadCount > 0 ? 'text-[#00a884] font-semibold' : 'text-[#8696a0]'
                          }`}
                        >
                          {formatChatTime(chat.lastMessage?.created_at || chat.updatedAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-[#8696a0] truncate pr-2">
                          {isTyping ? (
                            <span className="text-[#00a884] font-medium animate-pulse">
                              {typingList.join(', ')} typing...
                            </span>
                          ) : (
                            <>
                              {isOutgoing && chat.lastMessage && (
                                <StatusTick status={chat.lastMessage.status} size={16} />
                              )}
                              <span className="truncate">
                                {chat.lastMessage?.type === 'audio'
                                  ? '🎤 Voice message'
                                  : chat.lastMessage?.type === 'image'
                                  ? '📷 Photo'
                                  : chat.lastMessage?.text || 'No messages yet'}
                              </span>
                            </>
                          )}
                        </div>

                        {chat.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#00a884] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredChats.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center text-[#8696a0] py-20">
                  <div className="w-16 h-16 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center mb-4 text-[#00a884]">
                    <MessageSquare size={28} />
                  </div>
                  <h3 className="text-base font-semibold text-[#e9edef] mb-1">No chats yet</h3>
                  <p className="text-xs text-[#8696a0] max-w-[260px] leading-relaxed mb-6">
                    Tap the message button to start chatting via Phone, Email, or F0UNDR ID.
                  </p>
                  <button
                    onClick={() => setAddContactModalOpen(true)}
                    className="bg-[#00a884] text-[#111b21] font-semibold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg active:scale-95"
                  >
                    <UserPlus size={16} />
                    <span>Start a chat</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: UPDATES (Status) */}
        {activeTab === 'updates' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#e9edef] mb-3">Status</h3>
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <Avatar src={currentUser?.avatar} name={currentUser?.name} size="md" />
                  <div className="absolute -bottom-1 -right-1 bg-[#00a884] rounded-full p-0.5 text-white">
                    <Plus size={14} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#e9edef]">My status</h4>
                  <p className="text-xs text-[#8696a0]">Tap to add status update</p>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-3">
                Recent updates
              </span>
              <div className="space-y-4">
                {allUsers
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <div
                      key={u.id}
                      onClick={() => alert(`Viewing status story of ${u.name}`)}
                      className="flex items-center gap-3.5 cursor-pointer hover:bg-[#202c33] p-1.5 -mx-1.5 rounded-lg"
                    >
                      <div className="p-0.5 rounded-full border-2 border-[#00a884]">
                        <Avatar src={u.avatar} name={u.name} size="md" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#e9edef]">{u.name}</h4>
                        <p className="text-xs text-[#8696a0]">Today, 10:15 AM</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CALLS */}
        {activeTab === 'calls' && (
          <div className="divide-y divide-[#222e35]/40">
            {allUsers
              .filter((u) => u.id !== currentUser?.id)
              .map((u, i) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <Avatar src={u.avatar} name={u.name} size="md" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#e9edef]">{u.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-0.5">
                        {i % 2 === 0 ? (
                          <ArrowDownLeft size={14} className="text-[#00a884]" />
                        ) : (
                          <ArrowUpRight size={14} className="text-red-400" />
                        )}
                        <span>{i % 2 === 0 ? 'Incoming' : 'Outgoing'}, Today, 11:20 AM</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[#00a884]">
                    <button
                      onClick={() => startCall(u.id, 'audio')}
                      className="p-2 hover:bg-[#202c33] rounded-full"
                    >
                      <Phone size={18} />
                    </button>
                    <button
                      onClick={() => startCall(u.id, 'video')}
                      className="p-2 hover:bg-[#202c33] rounded-full"
                    >
                      <Video size={18} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* TAB: COMMUNITIES */}
        {activeTab === 'communities' && (
          <div className="p-8 text-center text-[#8696a0]">
            <Users size={64} className="mx-auto mb-4 text-[#00a884]" />
            <h3 className="text-lg font-bold text-[#e9edef] mb-2">Stay connected with a community</h3>
            <p className="text-xs max-w-xs mx-auto leading-relaxed">
              Communities bring members together in topic-based groups, and make it easy to get admin
              announcements.
            </p>
          </div>
        )}
      </div>

      {/* 4. Floating Action Button (FAB) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-3">
        <button
          onClick={() => setAddContactModalOpen(true)}
          className="w-11 h-11 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#2a3942] flex items-center justify-center shadow-lg transition-transform active:scale-95 self-end"
          title="Add Contact"
        >
          <UserPlus size={19} />
        </button>
        <button
          onClick={() => setNewChatModalOpen(true)}
          className="w-14 h-14 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all"
          title="New Chat"
        >
          <MessageSquare size={24} />
        </button>
      </div>
    </div>
  );
};
