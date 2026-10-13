import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  ArrowLeft,
  Trash2,
  Lock,
  Unlock,
  Archive,
  Ban,
  Radio,
  AlertTriangle,
  Info,
  UserPlus
} from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from '../common/Avatar';
import { MessageItem } from './MessageItem';
import { VoiceRecorder } from '../common/VoiceRecorder';
import { EmojiPicker } from '../common/EmojiPicker';
import { Message } from '../../types';
import { getFullApiUrl } from '../../utils/config';

interface ChatAreaProps {
  onBack?: () => void;
  isMobile?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onBack, isMobile = false }) => {
  const {
    activeChat,
    currentUser,
    messages,
    sendMessage,
    sendReaction,
    setTyping,
    onlineUsers,
    typingUsers,
    startCall,
    contactInfoOpen,
    setContactInfoOpen,
    clearChat,
    toggleArchiveChat,
    toggleLockChat,
    isUserBlocked,
    toggleBlockUser,
    setAddContactModalOpen
  } = useWhatsApp();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveTalking, setIsLiveTalking] = useState(false);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35] text-[#8696a0] select-none border-b-4 border-[#00a884] p-8">
        <div className="w-24 h-24 mb-6 rounded-full bg-[#111b21] flex items-center justify-center text-[#00a884]">
          <svg viewBox="0 0 308 308" className="w-14 h-14 fill-current">
            <path d="M227.904,176.981c-0.6-0.288-23.054-11.345-27.044-12.781c-1.629-0.585-3.374-1.156-5.23-1.156 c-4.15,0-7.731,2.029-10.279,5.772c-2.479,3.646-6.602,8.966-10.264,13.627c-2.036,2.593-4.526,3.957-7.23,3.957 c-1.258,0-2.553-0.297-3.83-0.88c-9.155-4.184-18.064-9.845-26.478-16.829c-8.625-7.159-15.656-15.63-20.916-25.176 c-1.503-2.73-1.205-5.698,0.884-8.835c2.193-3.29,4.721-6.602,7.311-9.988c1.332-1.745,2.158-3.791,2.39-5.918 c0.237-2.179-0.281-4.394-1.498-6.404c-2.883-4.757-11.96-22.399-13.674-25.568c-2.316-4.28-5.321-6.495-9.188-6.771 c-3.956-0.282-7.854,1.139-11.584,4.225c-9.757,8.073-14.938,19.349-14.59,31.751c0.418,14.896,7.674,30.016,21.564,44.945 c15.651,16.822,34.877,29.988,57.143,39.13c8.956,3.678,17.755,5.542,26.151,5.542c12.235,0,22.842-3.921,30.672-11.336 c7.075-6.701,10.984-15.753,11.3-26.177C230.126,183.185,229.418,179.691,227.904,176.981z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-[#e9edef] mb-2">WhatsApp Web & Desktop</h2>
        <p className="text-sm max-w-md text-center leading-relaxed">
          Send messages, make audio/video calls, and link contacts via phone numbers, emails, or F0UNDR IDs.
        </p>

        <button
          onClick={() => setAddContactModalOpen(true)}
          className="mt-6 bg-[#00a884] hover:bg-[#00a884]/90 text-[#111b21] font-semibold text-xs px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Start a new chat</span>
        </button>

        <div className="mt-8 text-xs text-[#8696a0] flex items-center gap-2">
          <span>🔒 End-to-end encrypted with PIN lock & Archive</span>
        </div>
      </div>
    );
  }

  const otherParticipant =
    activeChat.type === 'direct'
      ? activeChat.participants.find((p) => p.id !== currentUser?.id) || activeChat.participants[0]
      : null;

  const chatTitle = activeChat.type === 'group' ? activeChat.name : otherParticipant?.name || 'Contact';
  const chatAvatar = activeChat.type === 'group' ? activeChat.avatar : otherParticipant?.avatar;
  const isDirectOnline = otherParticipant ? onlineUsers.has(otherParticipant.id) : false;
  const isBlocked = otherParticipant ? isUserBlocked(otherParticipant.id) : false;

  const activeTyping = typingUsers[activeChat.id] || [];
  const typingText = activeTyping.length > 0 ? `${activeTyping.join(', ')} typing...` : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleSend = () => {
    if (!inputText.trim() || isBlocked) return;

    sendMessage({
      text: inputText.trim(),
      type: 'text',
      replyToId: replyMessage?.id
    });

    setInputText('');
    setReplyMessage(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isBlocked) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(getFullApiUrl('/api/upload'), {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.url) {
        const isImage = file.type.startsWith('image/');
        sendMessage({
          type: isImage ? 'image' : 'document',
          mediaUrl: data.url,
          mediaName: file.name,
          mediaSize: file.size,
          replyToId: replyMessage?.id
        });
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setShowAttachMenu(false);
      setReplyMessage(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b141a] relative">
      {/* 1. Chat Header */}
      <div className="h-16 bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222e35] select-none z-10">
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="text-[#8696a0] hover:text-[#e9edef] p-1.5 -ml-2 rounded-full hover:bg-[#2a3942]"
            >
              <ArrowLeft size={22} />
            </button>
          )}

          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setContactInfoOpen(!contactInfoOpen)}
          >
            <Avatar
              src={chatAvatar}
              name={chatTitle}
              size="md"
              isOnline={activeChat.type === 'direct' ? isDirectOnline : false}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-[#e9edef] truncate">{chatTitle}</h3>
                {activeChat.isLocked && <Lock size={12} className="text-[#00a884]" />}
                {activeChat.isArchived && <Archive size={12} className="text-[#8696a0]" />}
              </div>
              <p className="text-xs text-[#8696a0] truncate">
                {typingText ? (
                  <span className="text-[#00a884] font-medium animate-pulse">{typingText}</span>
                ) : activeChat.type === 'direct' ? (
                  isDirectOnline ? (
                    <span className="text-[#00a884]">online</span>
                  ) : (
                    otherParticipant?.phone || otherParticipant?.foundr_number || 'last seen recently'
                  )
                ) : (
                  `${activeChat.participants.map((p) => p.name).join(', ')}`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2 text-[#aebac1]">
          {/* Real-Time Live Talk (Walkie-Talkie Mode) */}
          <button
            onClick={() => {
              setIsLiveTalking(!isLiveTalking);
              if (!isLiveTalking) {
                alert('Live Talk Walkie-Talkie activated! Real-time voice talk channel is now open.');
              }
            }}
            className={`p-2 rounded-full transition-colors flex items-center gap-1 text-xs font-semibold ${
              isLiveTalking
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'hover:bg-[#2a3942] text-[#8696a0] hover:text-[#00a884]'
            }`}
            title="Real-Time Walkie-Talkie Voice Channel"
          >
            <Radio size={18} />
            <span className="hidden md:inline">{isLiveTalking ? 'Live Talking' : 'Live Talk'}</span>
          </button>

          {otherParticipant && !isBlocked && (
            <>
              <button
                onClick={() => startCall(otherParticipant.id, 'video')}
                className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
                title="Video Call"
              >
                <Video size={20} />
              </button>
              <button
                onClick={() => startCall(otherParticipant.id, 'audio')}
                className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
                title="Voice Call"
              >
                <Phone size={19} />
              </button>
            </>
          )}

          <button className="p-2 hover:bg-[#2a3942] rounded-full transition-colors" title="Search">
            <Search size={20} />
          </button>

          {/* Chat Options 3-Dots Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 hover:bg-[#2a3942] rounded-full transition-colors"
              title="More options"
            >
              <MoreVertical size={20} />
            </button>

            {showOptionsMenu && (
              <div className="absolute top-12 right-0 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-2xl py-2 z-50 w-52 animate-fade-in text-sm text-[#e9edef]">
                <button
                  onClick={() => {
                    setContactInfoOpen(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5"
                >
                  <Info size={16} className="text-[#8696a0]" />
                  <span>{activeChat.type === 'group' ? 'Group info' : 'Contact info'}</span>
                </button>

                {/* Lock / Unlock Chat */}
                <button
                  onClick={() => {
                    toggleLockChat(activeChat.id);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5"
                >
                  {activeChat.isLocked ? (
                    <>
                      <Unlock size={16} className="text-[#00a884]" />
                      <span>Unlock chat</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-[#00a884]" />
                      <span>Lock chat</span>
                    </>
                  )}
                </button>

                {/* Archive / Unarchive Chat */}
                <button
                  onClick={() => {
                    toggleArchiveChat(activeChat.id);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] flex items-center gap-2.5"
                >
                  <Archive size={16} className="text-[#8696a0]" />
                  <span>{activeChat.isArchived ? 'Unarchive chat' : 'Archive chat'}</span>
                </button>

                {/* Block / Unblock Person */}
                {otherParticipant && (
                  <button
                    onClick={() => {
                      toggleBlockUser(otherParticipant.id);
                      setShowOptionsMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#2a3942] text-red-400 flex items-center gap-2.5"
                  >
                    <Ban size={16} />
                    <span>{isBlocked ? 'Unblock contact' : 'Block contact'}</span>
                  </button>
                )}

                {/* Clear Chat */}
                <button
                  onClick={() => {
                    setShowClearConfirm(true);
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#2a3942] text-red-400 border-t border-[#2a3942] mt-1 pt-2 flex items-center gap-2.5"
                >
                  <Trash2 size={16} />
                  <span>Clear chat</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blocked Contact Warning Banner */}
      {isBlocked && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2 flex items-center justify-between text-xs text-red-400 z-10">
          <div className="flex items-center gap-2">
            <Ban size={16} />
            <span>You have blocked this contact. Messages and calls are prevented.</span>
          </div>
          <button
            onClick={() => otherParticipant && toggleBlockUser(otherParticipant.id)}
            className="underline font-semibold hover:text-red-300"
          >
            Unblock
          </button>
        </div>
      )}

      {/* 2. Messages List with Wallpaper Background */}
      <div className="flex-1 overflow-y-auto wa-chat-bg-dark px-4 sm:px-8 py-4 space-y-1">
        <div className="flex justify-center my-3">
          <span className="bg-[#111b21] text-[#8696a0] text-xs px-3 py-1 rounded-lg uppercase shadow-sm tracking-wider font-medium">
            TODAY
          </span>
        </div>

        {messages.map((msg) => {
          const isOutgoing = msg.senderId === currentUser?.id;
          const reply = msg.replyToId ? messages.find((m) => m.id === msg.replyToId) : null;
          return (
            <MessageItem
              key={msg.id}
              message={msg}
              isOutgoing={isOutgoing}
              isGroup={activeChat.type === 'group'}
              onReply={(m) => setReplyMessage(m)}
              onReact={(mId, emoji) => sendReaction(mId, emoji)}
              replyMessage={reply}
            />
          );
        })}

        {messages.length === 0 && (
          <div className="text-center py-12 text-[#8696a0] text-xs">
            No messages here. Say hello or record a voice note!
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Reply Preview Banner */}
      {replyMessage && (
        <div className="bg-[#202c33] px-4 py-2 flex items-center justify-between border-t border-[#2a3942]">
          <div className="border-l-4 border-[#00a884] pl-2 text-xs">
            <span className="font-semibold text-[#00a884]">{replyMessage.senderName || 'Contact'}</span>
            <p className="text-[#8696a0] truncate">{replyMessage.text || 'Media'}</p>
          </div>
          <button
            onClick={() => setReplyMessage(null)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 4. Bottom Input Bar */}
      <div className="min-h-16 bg-[#202c33] px-3 sm:px-4 py-2 flex items-center gap-2 border-t border-[#222e35] relative z-20">
        {isBlocked ? (
          <div className="flex-1 py-2 text-center text-xs text-[#8696a0]">
            You cannot send messages to a blocked contact.
          </div>
        ) : isRecording ? (
          <VoiceRecorder
            onSend={(audioUrl, duration) => {
              setIsRecording(false);
              sendMessage({
                type: 'audio',
                mediaUrl: audioUrl,
                mediaDuration: duration,
                replyToId: replyMessage?.id
              });
              setReplyMessage(null);
            }}
            onCancel={() => setIsRecording(false)}
          />
        ) : (
          <>
            {/* Emoji Button */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-full hover:bg-[#2a3942] transition-colors ${
                  showEmojiPicker ? 'text-[#00a884]' : 'text-[#8696a0]'
                }`}
              >
                <Smile size={24} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50">
                  <EmojiPicker
                    onSelect={(emoji) => {
                      setInputText((prev) => prev + emoji);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Attach File Button */}
            <div className="relative">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-2 rounded-full hover:bg-[#2a3942] transition-colors ${
                  showAttachMenu ? 'text-[#00a884]' : 'text-[#8696a0]'
                }`}
              >
                <Paperclip size={22} />
              </button>
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-[#202c33] border border-[#2a3942] rounded-xl p-2 shadow-2xl flex flex-col gap-2 z-50 w-44 animate-fade-in">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-2 hover:bg-[#2a3942] rounded-lg text-sm text-[#e9edef] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#bf59cf] flex items-center justify-center text-white">
                      <ImageIcon size={18} />
                    </div>
                    <span>Photos & Videos</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-2 hover:bg-[#2a3942] rounded-lg text-sm text-[#e9edef] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5f66cd] flex items-center justify-center text-white">
                      <FileText size={18} />
                    </div>
                    <span>Document</span>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Text Input */}
            <div className="flex-1 bg-[#2a3942] rounded-lg px-4 py-2.5 flex items-center">
              <input
                type="text"
                placeholder="Type a message"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
              />
            </div>

            {/* Send or Voice Note Button */}
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="p-2.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full transition-colors flex items-center justify-center shadow-sm"
              >
                <Send size={18} className="translate-x-[1px]" />
              </button>
            ) : (
              <button
                onClick={() => setIsRecording(true)}
                className="p-2.5 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-colors"
                title="Record voice note"
              >
                <Mic size={22} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <Trash2 size={36} className="text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#e9edef] mb-2">Clear this chat?</h3>
            <p className="text-xs text-[#8696a0] mb-6 leading-relaxed">
              This will permanently delete all messages in this conversation.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-[#8696a0] hover:text-[#e9edef] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clearChat(activeChat.id);
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
