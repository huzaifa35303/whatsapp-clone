import React, { useState } from 'react';
import { X, Users, UserPlus, Search, Check } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from './Avatar';

export const NewChatModal: React.FC = () => {
  const { newChatModalOpen, setNewChatModalOpen, allUsers, currentUser, createChat } = useWhatsApp();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  if (!newChatModalOpen) return null;

  const availableContacts = allUsers.filter(
    (u) => u.id !== currentUser?.id && u.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartDirectChat = async (targetUserId: string) => {
    await createChat({
      type: 'direct',
      participantIds: [targetUserId]
    });
    setNewChatModalOpen(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    await createChat({
      type: 'group',
      name: groupName.trim(),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`,
      participantIds: selectedUserIds
    });
    setNewChatModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <h3 className="font-semibold text-lg text-[#e9edef]">New Chat</h3>
          <button
            onClick={() => setNewChatModalOpen(false)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#222e35] bg-[#111b21]">
          <button
            onClick={() => setTab('direct')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              tab === 'direct'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <UserPlus size={16} /> Direct Message
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              tab === 'group'
                ? 'text-[#00a884] border-b-2 border-[#00a884]'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Users size={16} /> New Group
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-[#111b21] border-b border-[#222e35]">
          <div className="flex items-center gap-2 bg-[#202c33] px-3 py-1.5 rounded-lg">
            <Search size={16} className="text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search contacts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Group Name input if group tab */}
        {tab === 'group' && (
          <div className="p-3 bg-[#111b21] border-b border-[#222e35]">
            <input
              type="text"
              placeholder="Group subject / name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#202c33] text-sm text-[#e9edef] px-3 py-2 rounded-lg border border-[#2a3942] focus:border-[#00a884] focus:outline-none"
            />
            <div className="text-[11px] text-[#8696a0] mt-1">
              Selected participants: {selectedUserIds.length}
            </div>
          </div>
        )}

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]">
          {availableContacts.map((contact) => {
            const isSelected = selectedUserIds.includes(contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => {
                  if (tab === 'direct') {
                    handleStartDirectChat(contact.id);
                  } else {
                    toggleSelectUser(contact.id);
                  }
                }}
                className="flex items-center gap-3 p-3.5 hover:bg-[#202c33] cursor-pointer transition-colors"
              >
                <Avatar src={contact.avatar} name={contact.name} size="md" isOnline={contact.is_online} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[#e9edef] truncate">{contact.name}</h4>
                  <p className="text-xs text-[#8696a0] truncate">{contact.about || contact.phone}</p>
                </div>

                {tab === 'group' && (
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[#00a884] border-[#00a884] text-white'
                        : 'border-[#8696a0]'
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Group Footer */}
        {tab === 'group' && (
          <div className="p-3 bg-[#202c33] border-t border-[#2a3942] flex justify-end">
            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUserIds.length === 0}
              className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Create Group
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
