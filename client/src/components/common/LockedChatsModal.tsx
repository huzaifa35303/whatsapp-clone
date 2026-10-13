import React, { useState } from 'react';
import { X, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from './Avatar';

export const LockedChatsModal: React.FC = () => {
  const {
    showLockedView,
    setShowLockedView,
    lockedChatsUnlocked,
    unlockLockedChats,
    chats,
    selectChat,
    toggleLockChat,
    currentUser
  } = useWhatsApp();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!showLockedView) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockLockedChats(pin.trim());
    if (success) {
      setError(null);
      setPin('');
    } else {
      setError('Incorrect passcode PIN (Default PIN: 1234)');
    }
  };

  const lockedChats = chats.filter((c) => c.isLocked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-[#00a884]" />
            <h3 className="font-semibold text-lg text-[#e9edef]">Locked Chats</h3>
          </div>
          <button
            onClick={() => setShowLockedView(false)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. If Locked, Show PIN Entry */}
        {!lockedChatsUnlocked ? (
          <form onSubmit={handleUnlock} className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#00a884]/20 border-2 border-[#00a884] flex items-center justify-center text-[#00a884] shadow-lg">
              <Lock size={36} />
            </div>

            <div>
              <h4 className="text-base font-bold text-[#e9edef] mb-1">Enter Chat Lock Passcode</h4>
              <p className="text-xs text-[#8696a0]">
                Keep chats private and protected with your security PIN. (Default PIN: 1234)
              </p>
            </div>

            <div className="w-full max-w-xs">
              <input
                type="password"
                maxLength={6}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                className="w-full bg-[#202c33] text-center tracking-[0.5em] text-xl text-[#e9edef] px-4 py-3 rounded-xl border border-[#2a3942] focus:border-[#00a884] focus:outline-none font-mono"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!pin.trim()}
              className="w-full max-w-xs py-3 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              Unlock Chats
            </button>
          </form>
        ) : (
          /* 2. Unlocked, Show List of Locked Chats */
          <div className="flex-1 overflow-y-auto divide-y divide-[#222e35] p-2">
            {lockedChats.length > 0 ? (
              lockedChats.map((chat) => {
                const other =
                  chat.type === 'direct'
                    ? chat.participants.find((p) => p.id !== currentUser?.id)
                    : null;
                const title = chat.type === 'group' ? chat.name : other?.name || 'Contact';
                const avatar = chat.type === 'group' ? chat.avatar : other?.avatar;

                return (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#202c33] cursor-pointer transition-colors"
                    onClick={() => {
                      selectChat(chat.id);
                      setShowLockedView(false);
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={avatar} name={title} size="md" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#e9edef] truncate">{title}</h4>
                        <p className="text-xs text-[#8696a0] truncate">
                          {chat.lastMessage?.text || 'Protected conversation'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLockChat(chat.id);
                      }}
                      className="p-2 text-[#8696a0] hover:text-[#00a884] hover:bg-[#2a3942] rounded-full"
                      title="Unlock chat"
                    >
                      <Unlock size={18} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-[#8696a0]">
                No locked chats yet. You can lock any chat from the chat options menu.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
