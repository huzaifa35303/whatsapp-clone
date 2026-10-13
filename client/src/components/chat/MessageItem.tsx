import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Download, Smile, CornerUpLeft } from 'lucide-react';
import { Message } from '../../types';
import { StatusTick } from '../common/StatusTick';
import { AudioPlayer } from '../common/AudioPlayer';
import { QuickReactionsBar } from '../common/EmojiPicker';
import { getFullApiUrl } from '../../utils/config';

interface MessageItemProps {
  message: Message;
  isOutgoing: boolean;
  isGroup: boolean;
  onReply?: (msg: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  replyMessage?: Message | null;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOutgoing,
  isGroup,
  onReply,
  onReact,
  replyMessage
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const formattedTime = format(new Date(message.createdAt), 'h:mm a');

  return (
    <div
      className={`group relative flex flex-col mb-1.5 ${isOutgoing ? 'items-end' : 'items-start'}`}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Hover action bar */}
      <div
        className={`absolute -top-7 ${
          isOutgoing ? 'right-2' : 'left-2'
        } opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1`}
      >
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="p-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] shadow-md"
          title="React"
        >
          <Smile size={14} />
        </button>
        {onReply && (
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] shadow-md"
            title="Reply"
          >
            <CornerUpLeft size={14} />
          </button>
        )}
      </div>

      {/* Floating Reactions Bar on Click */}
      {showReactions && onReact && (
        <div className={`absolute -top-10 ${isOutgoing ? 'right-4' : 'left-4'} z-20`}>
          <QuickReactionsBar
            onSelect={(emoji) => {
              onReact(message.id, emoji);
              setShowReactions(false);
            }}
          />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-lg px-2.5 py-1.5 shadow-sm text-sm ${
          isOutgoing
            ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
            : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
        }`}
      >
        {/* Sender Name in Group Chat */}
        {isGroup && !isOutgoing && message.senderName && (
          <div className="text-[12px] font-semibold text-[#53bdeb] mb-0.5">
            {message.senderName}
          </div>
        )}

        {/* Quoted / Reply Preview */}
        {replyMessage && (
          <div className="mb-1.5 p-1.5 rounded bg-black/20 border-l-4 border-[#00a884] text-xs">
            <span className="font-semibold text-[#00a884] block mb-0.5">
              {replyMessage.senderName || 'Replied Message'}
            </span>
            <p className="text-[#8696a0] line-clamp-1">
              {replyMessage.text || (replyMessage.type === 'audio' ? '🎤 Voice note' : '📷 Photo')}
            </p>
          </div>
        )}

        {/* Message Content: Image */}
        {message.type === 'image' && message.mediaUrl && (
          <div className="rounded-md overflow-hidden my-1 max-w-sm">
            <img
              src={getFullApiUrl(message.mediaUrl)}
              alt={message.mediaName || 'Media'}
              className="w-full max-h-72 object-cover rounded cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(getFullApiUrl(message.mediaUrl!), '_blank')}
            />
          </div>
        )}

        {/* Message Content: Audio / Voice Note */}
        {message.type === 'audio' && message.mediaUrl && (
          <AudioPlayer
            src={getFullApiUrl(message.mediaUrl)}
            duration={message.mediaDuration}
            senderAvatar={message.senderAvatar}
            isOutgoing={isOutgoing}
          />
        )}

        {/* Message Content: Document */}
        {message.type === 'document' && message.mediaUrl && (
          <div className="flex items-center gap-3 p-2 rounded bg-black/20 my-1">
            <FileText size={24} className="text-[#00a884]" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{message.mediaName || 'Document.pdf'}</p>
              <span className="text-[10px] text-[#8696a0]">
                {message.mediaSize ? `${Math.round(message.mediaSize / 1024)} KB` : 'File'}
              </span>
            </div>
            <a
              href={getFullApiUrl(message.mediaUrl)}
              download={message.mediaName || 'file'}
              className="p-1 text-[#8696a0] hover:text-[#e9edef]"
            >
              <Download size={16} />
            </a>
          </div>
        )}

        {/* Message Content: Text */}
        {message.text && (
          <div className="break-words whitespace-pre-wrap leading-relaxed pr-16">
            {message.text}
          </div>
        )}

        {/* Timestamp & Status Tick */}
        <div className="float-right -mt-2.5 ml-2 flex items-center gap-1 text-[11px] text-[#8696a0] select-none">
          <span>{formattedTime}</span>
          {isOutgoing && <StatusTick status={message.status} size={14} />}
        </div>
      </div>

      {/* Emoji Reactions Badge */}
      {message.reactions && message.reactions.length > 0 && (
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#202c33] border border-[#2a3942] text-xs shadow-md mt-[-6px] z-10 ${
            isOutgoing ? 'mr-2' : 'ml-2'
          }`}
        >
          {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji) => (
            <span key={emoji}>{emoji}</span>
          ))}
          {message.reactions.length > 1 && (
            <span className="text-[10px] text-[#8696a0]">{message.reactions.length}</span>
          )}
        </div>
      )}
    </div>
  );
};
