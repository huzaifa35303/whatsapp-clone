import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { MessageStatus } from '../../types';

interface StatusTickProps {
  status: MessageStatus;
  size?: number;
  className?: string;
}

export const StatusTick: React.FC<StatusTickProps> = ({ status, size = 16, className = '' }) => {
  switch (status) {
    case 'read':
      return <CheckCheck size={size} className={`text-[#53bdeb] inline-block ${className}`} />;
    case 'delivered':
      return <CheckCheck size={size} className={`text-[#8696a0] inline-block ${className}`} />;
    case 'sent':
      return <Check size={size} className={`text-[#8696a0] inline-block ${className}`} />;
    default:
      return <Clock size={size - 2} className={`text-[#8696a0] inline-block ${className}`} />;
  }
};
