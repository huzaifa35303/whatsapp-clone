import React from 'react';
import { X, Archive, ArchiveRestore } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from './Avatar';

export const ArchivedChatsModal: React.FC = () => {
  const {
    showArchivedView,
    setShowArchivedView,
    chats,
    selectChat,
    toggleArchiveChat,
    currentUser
  } = useWhatsApp();

  if (!showArchivedView) return null;

  const archivedChats = chats.filter((c) => c.isArchived);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-2">
            <Archive size={20} className="text-[#00a884]" />
            <h3 className="font-semibold text-lg text-[#e9edef]">Archived Chats</h3>
          </div>
          <button
            onClick={() => setShowArchivedView(false)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
          >
            <X size={20} />
          </button>
        </div>

        {/* List of Archived Chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#222e35] p-2">
          {archivedChats.length > 0 ? (
            archivedChats.map((chat) => {
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
                    setShowArchivedView(false);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={avatar} name={title} size="md" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#e9edef] truncate">{title}</h4>
                      <p className="text-xs text-[#8696a0] truncate">
                        {chat.lastMessage?.text || 'Archived conversation'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleArchiveChat(chat.id);
                    }}
                    className="p-2 text-[#8696a0] hover:text-[#00a884] hover:bg-[#2a3942] rounded-full"
                    title="Unarchive chat"
                  >
                    <ArchiveRestore size={18} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-sm text-[#8696a0]">
              No archived chats. You can archive any chat to hide it from your main chats list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
