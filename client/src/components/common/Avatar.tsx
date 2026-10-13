import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean | number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  isOnline,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl'
  };

  const getInitials = (text?: string | null) => {
    if (!text) return '?';
    const parts = text.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return text.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${sizeClasses[size]} rounded-full object-cover bg-[#202c33]`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-[#00a884] text-white flex items-center justify-center font-semibold select-none shadow-sm`}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline ? (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] border-2 border-[#111b21] rounded-full shadow-sm" />
      ) : null}
    </div>
  );
};
