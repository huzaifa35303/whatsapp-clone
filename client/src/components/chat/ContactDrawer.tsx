import React, { useState } from 'react';
import { X, Lock, Unlock, Bell, Star, Ban, Trash2, Hash, ShieldCheck, Copy, Check } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from '../common/Avatar';
import { getFullApiUrl } from '../../utils/config';

export const ContactDrawer: React.FC = () => {
  const {
    activeChat,
    currentUser,
    contactInfoOpen,
    setContactInfoOpen,
    messages,
    isUserBlocked,
    toggleBlockUser,
    clearChat,
    toggleLockChat
  } = useWhatsApp();

  const [copiedFoundr, setCopiedFoundr] = useState(false);

  if (!contactInfoOpen || !activeChat) return null;

  const otherParticipant =
    activeChat.type === 'direct'
      ? activeChat.participants.find((p) => p.id !== currentUser?.id) || activeChat.participants[0]
      : null;

  const title = activeChat.type === 'group' ? activeChat.name : otherParticipant?.name || 'Contact';
  const avatar = activeChat.type === 'group' ? activeChat.avatar : otherParticipant?.avatar;
  const subtitle = activeChat.type === 'group' ? `${activeChat.participants.length} participants` : otherParticipant?.phone;
  const isBlocked = otherParticipant ? isUserBlocked(otherParticipant.id) : false;

  const mediaMessages = messages.filter((m) => m.type === 'image' && m.mediaUrl);

  const copyFoundr = () => {
    if (otherParticipant?.foundr_number) {
      navigator.clipboard.writeText(otherParticipant.foundr_number);
      setCopiedFoundr(true);
      setTimeout(() => setCopiedFoundr(false), 2000);
    }
  };

  return (
    <div className="w-80 md:w-96 h-full bg-[#111b21] border-l border-[#222e35] flex flex-col z-20 animate-slide-left select-none overflow-y-auto">
      {/* Header */}
      <div className="h-16 bg-[#202c33] px-4 flex items-center gap-6 border-b border-[#222e35]">
        <button
          onClick={() => setContactInfoOpen(false)}
          className="text-[#8696a0] hover:text-[#e9edef] p-1.5 rounded-full hover:bg-[#2a3942]"
        >
          <X size={20} />
        </button>
        <h3 className="font-semibold text-sm text-[#e9edef]">
          {activeChat.type === 'group' ? 'Group info' : 'Contact info'}
        </h3>
      </div>

      {/* Main Profile Info */}
      <div className="p-6 flex flex-col items-center border-b border-[#222e35] bg-[#111b21]">
        <Avatar src={avatar} name={title} size="xl" className="w-28 h-28 mb-4 shadow-lg" />
        <h2 className="text-xl font-bold text-[#e9edef]">{title}</h2>
        <p className="text-sm text-[#8696a0] mt-1">{subtitle}</p>
      </div>

      {/* Contact Identifiers */}
      {otherParticipant && (
        <div className="p-4 border-b border-[#222e35] bg-[#111b21] space-y-2">
          {otherParticipant.original_phone && (
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#202c33]">
              <div className="flex items-center gap-2 text-[#8696a0]">
                <ShieldCheck size={14} className="text-[#00a884]" />
                <span>Original Phone</span>
              </div>
              <span className="font-mono text-[#e9edef] font-semibold">
                {otherParticipant.original_phone}
              </span>
            </div>
          )}

          {otherParticipant.foundr_number && (
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#202c33]">
              <div className="flex items-center gap-2 text-[#8696a0]">
                <Hash size={14} className="text-[#00a884]" />
                <span>F0UNDR Number</span>
              </div>
              <button
                onClick={copyFoundr}
                className="font-mono text-[#00a884] font-semibold hover:underline flex items-center gap-1"
              >
                <span>{otherParticipant.foundr_number}</span>
                {copiedFoundr ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* About Section */}
      <div className="p-4 border-b border-[#222e35] bg-[#111b21]">
        <span className="text-xs text-[#8696a0] uppercase tracking-wider font-semibold block mb-1">About</span>
        <p className="text-sm text-[#e9edef]">
          {otherParticipant?.about || 'Hey there! I am using WhatsApp.'}
        </p>
      </div>

      {/* Media & Docs Section */}
      <div className="p-4 border-b border-[#222e35] bg-[#111b21]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#8696a0] uppercase tracking-wider font-semibold">
            Media, links and docs ({mediaMessages.length})
          </span>
        </div>
        {mediaMessages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {mediaMessages.slice(0, 6).map((m) => (
              <img
                key={m.id}
                src={getFullApiUrl(m.mediaUrl!)}
                alt="Shared media"
                className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(getFullApiUrl(m.mediaUrl!), '_blank')}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8696a0]">No media shared yet</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 bg-[#111b21] space-y-1">
        {/* Toggle Lock Chat */}
        <button
          onClick={() => toggleLockChat(activeChat.id)}
          className="w-full flex items-center gap-4 px-4 py-3 text-sm text-[#e9edef] hover:bg-[#202c33] rounded-lg transition-colors"
        >
          {activeChat.isLocked ? (
            <>
              <Unlock size={18} className="text-[#00a884]" />
              <span>Unlock chat</span>
            </>
          ) : (
            <>
              <Lock size={18} className="text-[#00a884]" />
              <span>Lock chat (Protect with PIN)</span>
            </>
          )}
        </button>

        {/* Clear Chat */}
        <button
          onClick={() => {
            if (confirm('Clear all messages in this conversation?')) {
              clearChat(activeChat.id);
            }
          }}
          className="w-full flex items-center gap-4 px-4 py-3 text-sm text-red-400 hover:bg-[#202c33] rounded-lg transition-colors"
        >
          <Trash2 size={18} />
          <span>Clear chat history</span>
        </button>

        {/* Block / Unblock Contact */}
        {otherParticipant && (
          <button
            onClick={() => toggleBlockUser(otherParticipant.id)}
            className="w-full flex items-center gap-4 px-4 py-3 text-sm text-red-400 hover:bg-[#202c33] rounded-lg transition-colors"
          >
            <Ban size={18} />
            <span>{isBlocked ? `Unblock ${title}` : `Block ${title}`}</span>
          </button>
        )}
      </div>
    </div>
  );
};
