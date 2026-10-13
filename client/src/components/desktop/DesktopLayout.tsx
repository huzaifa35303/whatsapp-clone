import React from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from '../chat/ChatArea';
import { ContactDrawer } from '../chat/ContactDrawer';

export const DesktopLayout: React.FC = () => {
  return (
    <div className="flex-1 flex overflow-hidden h-full w-full bg-[#111b21]">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Middle Chat Area */}
      <ChatArea />

      {/* 3. Right Contact Info Drawer (Optional) */}
      <ContactDrawer />
    </div>
  );
};
