import React from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_GROUPS = [
  {
    title: 'Smileys & People',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
  },
  {
    title: 'Gestures',
    emojis: ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🤝', '👏', '🙌', '👐', '🤲']
  },
  {
    title: 'Hearts & Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '💥', '🔥', '🎉', '🎊', '💯', '💢', '💬', '👁️‍🗨️']
  },
  {
    title: 'Activities & Tech',
    emojis: ['💻', '📱', '⌨️', '🖥️', '📷', '📹', '☕', '🍵', '🚀', '💡', '⏰', '⏳', '🎯', '🎮', '🎧', '🎸', '⚽', '🏀', '🏆', '🍕', '🍔', '🍦', '🍩', '🍻', '🥂']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <div className="w-80 h-72 bg-[#202c33] border border-[#2a3942] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in select-none z-50">
      <div className="p-2 border-b border-[#2a3942] bg-[#111b21] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">Emojis</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {EMOJI_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="text-[11px] font-medium text-[#8696a0] mb-2">{group.title}</div>
            <div className="grid grid-cols-8 gap-1">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#2a3942] rounded-lg transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QuickReactionsBar: React.FC<{ onSelect: (emoji: string) => void }> = ({ onSelect }) => {
  const quick = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  return (
    <div className="flex items-center gap-1 bg-[#202c33] border border-[#2a3942] px-2 py-1 rounded-full shadow-lg">
      {quick.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-8 h-8 text-lg hover:scale-125 transition-transform flex items-center justify-center"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
