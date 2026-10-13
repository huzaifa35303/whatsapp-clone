import React, { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  MessageSquarePlus,
  MoreVertical,
  Search,
  Filter,
  Users,
  CircleDot,
  Radio,
  Archive,
  QrCode,
  Check,
  UserPlus,
  Lock,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from '../common/Avatar';
import { StatusTick } from '../common/StatusTick';
import { Chat } from '../../types';

export const Sidebar: React.FC = () => {
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
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    allUsers,
    switchUser
  } = useWhatsApp();

  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  // Filter chats by search, category, and hiding locked/archived from main inbox
  const filteredChats = chats.filter((chat) => {
    if (chat.isLocked || chat.isArchived) return false;

    const otherParticipant =
      chat.type === 'direct'
        ? chat.participants.find((p) => p.id !== currentUser?.id)
        : null;
    const title = chat.type === 'group' ? chat.name : otherParticipant?.name || '';

    const matchesSearch =
      title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherParticipant?.phone?.includes(searchQuery) ||
      otherParticipant?.foundr_number?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'unread') return chat.unreadCount > 0;
    if (activeFilter === 'groups') return chat.type === 'group';
    return true;
  });

  return (
    <div className="w-80 sm:w-96 md:w-[400px] h-full bg-[#111b21] border-r border-[#222e35] flex flex-col flex-shrink-0 select-none">
      {/* 1. Sidebar Header */}
      <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222e35] relative">
        {/* Current user profile */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Switch User / Profile"
          >
            <Avatar src={currentUser?.avatar} name={currentUser?.name} size="md" isOnline={true} />
            <div className="hidden lg:block text-left">
              <span className="text-xs font-semibold text-[#e9edef] block truncate max-w-[100px]">
                {currentUser?.name}
              </span>
              <span className="text-[10px] text-[#00a884] font-mono">
                {currentUser?.phone || currentUser?.foundr_number}
              </span>
            </div>
          </div>

          {/* User switcher popup */}
          {showUserMenu && (
            <div className="absolute top-12 left-0 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-2xl p-2 z-50 w-64 animate-fade-in">
              <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className="text-[11px] font-semibold text-[#8696a0] uppercase">
                  Active Account
                </span>
                <button
                  onClick={() => {
                    setRegisterModalOpen(true);
                    setShowUserMenu(false);
                  }}
                  className="text-[10px] text-[#00a884] hover:underline font-semibold"
                >
                  + New Number
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
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#aebac1]">
          {/* Add Contact Button */}
          <button
            onClick={() => setAddContactModalOpen(true)}
            className="p-2 hover:bg-[#2a3942] rounded-full transition-colors text-[#8696a0] hover:text-[#00a884]"
            title="Add Contact by Phone or F0undr ID"
          >
            <UserPlus size={19} />
          </button>

          {/* New Chat Button */}
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
            title="New Chat / Group"
          >
            <MessageSquarePlus size={20} />
          </button>

          {/* Three Dots Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
              title="Menu"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute top-12 right-0 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-2xl py-2 z-50 w-56 animate-fade-in text-sm text-[#e9edef]">
                <button
                  onClick={() => {
                    setAddContactModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5"
                >
                  <UserPlus size={16} className="text-[#00a884]" />
                  <span>Add contact</span>
                </button>
                <button
                  onClick={() => {
                    setNewChatModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5"
                >
                  <Users size={16} className="text-[#8696a0]" />
                  <span>New group</span>
                </button>
                <button
                  onClick={() => {
                    setShowLockedView(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5"
                >
                  <Lock size={16} className="text-[#00a884]" />
                  <span>Locked chats</span>
                </button>
                <button
                  onClick={() => {
                    setShowArchivedView(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5"
                >
                  <Archive size={16} className="text-[#8696a0]" />
                  <span>Archived chats</span>
                </button>
                <button
                  onClick={() => {
                    setQrModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center justify-between"
                >
                  <span>Linked devices</span>
                  <QrCode size={16} className="text-[#00a884]" />
                </button>
                <button
                  onClick={() => {
                    setSettingsModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5 border-t border-[#2a3942] mt-1 pt-2"
                >
                  <Settings size={16} className="text-[#8696a0]" />
                  <span>Settings & Profile</span>
                </button>
                <button
                  onClick={() => {
                    setRegisterModalOpen(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5 text-[#00a884]"
                >
                  <ShieldCheck size={16} />
                  <span>Register New Number</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-2.5 bg-[#111b21] space-y-2 border-b border-[#222e35]">
        <div className="flex items-center gap-3 bg-[#202c33] px-3 py-1.5 rounded-lg">
          <Search size={16} className="text-[#8696a0]" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#00a884]/20 text-[#00a884]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'unread'
                ? 'bg-[#00a884]/20 text-[#00a884]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === 'groups'
                ? 'bg-[#00a884]/20 text-[#00a884]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* 3. Folders Section: Locked Chats & Archived Chats */}
      <div className="divide-y divide-[#222e35]/40 border-b border-[#222e35]">
        {/* Locked Chats Folder */}
        <div
          onClick={() => setShowLockedView(true)}
          className="px-4 py-2.5 flex items-center justify-between text-[#8696a0] hover:bg-[#202c33] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-5">
            <Lock size={18} className="text-[#00a884]" />
            <span className="text-sm font-medium text-[#e9edef]">Locked chats</span>
          </div>
          {lockedChatsCount > 0 && (
            <span className="text-xs font-semibold text-[#00a884] bg-[#00a884]/15 px-2 py-0.5 rounded-full">
              {lockedChatsCount}
            </span>
          )}
        </div>

        {/* Archived Chats Folder */}
        <div
          onClick={() => setShowArchivedView(true)}
          className="px-4 py-2.5 flex items-center justify-between text-[#8696a0] hover:bg-[#202c33] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-5">
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

      {/* 4. Active Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/40">
        {filteredChats.map((chat) => {
          const isActive = chat.id === activeChatId;
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
              className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
              }`}
            >
              <Avatar
                src={avatar}
                name={title}
                size="md"
                isOnline={chat.type === 'direct' ? isOnline : false}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-[#e9edef] truncate">{title}</h4>
                  <span
                    className={`text-[11px] whitespace-nowrap ml-2 ${
                      chat.unreadCount > 0 ? 'text-[#00a884] font-semibold' : 'text-[#8696a0]'
                    }`}
                  >
                    {formatChatTime(chat.lastMessage?.created_at || chat.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-[#8696a0] truncate pr-2">
                    {isTyping ? (
                      <span className="text-[#00a884] font-medium animate-pulse">
                        {typingList.join(', ')} typing...
                      </span>
                    ) : (
                      <>
                        {isOutgoing && chat.lastMessage && (
                          <StatusTick status={chat.lastMessage.status} size={15} />
                        )}
                        <span className="truncate">
                          {chat.lastMessage?.type === 'audio'
                            ? '🎤 Voice message'
                            : chat.lastMessage?.type === 'image'
                            ? '📷 Photo'
                            : chat.lastMessage?.type === 'document'
                            ? '📄 Document'
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
          <div className="flex flex-col items-center justify-center p-8 text-center text-[#8696a0] my-auto py-16">
            <div className="w-16 h-16 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center mb-4 text-[#00a884]">
              <MessageSquarePlus size={28} />
            </div>
            <h3 className="text-base font-medium text-[#e9edef] mb-1">No chats yet</h3>
            <p className="text-xs text-[#8696a0] max-w-[240px] leading-relaxed mb-5">
              Start chatting by searching for a phone number, email, or F0UNDR ID.
            </p>
            <button
              onClick={() => setAddContactModalOpen(true)}
              className="bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] font-semibold text-xs px-4 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Start a new chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
