import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  QrCode,
  Users,
  Settings,
  UserPlus,
  ShieldCheck,
  Hash,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { WhatsAppProvider, useWhatsApp } from './context/WhatsAppContext';
import { DesktopLayout } from './components/desktop/DesktopLayout';
import { MobileLayout } from './components/mobile/MobileLayout';
import { CallModal } from './components/call/CallModal';
import { QRCodeModal } from './components/qr/QRCodeModal';
import { NewChatModal } from './components/common/NewChatModal';
import { AddContactModal } from './components/common/AddContactModal';
import { RegisterUserModal } from './components/common/RegisterUserModal';
import { UserSettingsModal } from './components/common/UserSettingsModal';
import { LockedChatsModal } from './components/common/LockedChatsModal';
import { ArchivedChatsModal } from './components/common/ArchivedChatsModal';
import { AuthScreen } from './components/auth/AuthScreen';

const WhatsAppContainer: React.FC = () => {
  const {
    deviceView,
    setDeviceView,
    setQrModalOpen,
    setAddContactModalOpen,
    setRegisterModalOpen,
    setSettingsModalOpen,
    currentUser,
    allUsers,
    switchUser,
    refreshChats,
    logout
  } = useWhatsApp();

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col dark bg-[#0c1317] overflow-hidden">
      {/* Platform & Quick Control Header Bar */}
      <header className="h-10 bg-[#1f2c34] text-[#8696a0] px-3 sm:px-4 flex items-center justify-between text-xs border-b border-[#2a3942] z-30 select-none">
        {/* Left: App Title, Pakistani Phone & F0UNDR ID */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-[#e9edef] flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a884] animate-pulse" />
            <span>WhatsApp Clone</span>
          </div>

          {currentUser && (
            <div className="hidden md:flex items-center gap-2 text-[11px] truncate">
              <span className="text-[#8696a0]">|</span>
              <span className="text-[#e9edef] font-mono">
                📱 {currentUser.phone || currentUser.original_phone}
              </span>
              <span className="bg-[#00a884]/20 text-[#00a884] px-1.5 py-0.2 rounded font-mono font-semibold text-[10px]">
                {currentUser.foundr_number || 'F0UNDR-344678'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Device View Mode Switcher */}
        <div className="flex items-center bg-[#111b21] p-0.5 rounded-lg border border-[#2a3942]">
          <button
            onClick={() => setDeviceView('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
              deviceView === 'desktop'
                ? 'bg-[#00a884] text-white shadow-sm'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
            title="Switch to Desktop / Web dual-pane layout"
          >
            <Monitor size={14} />
            <span className="hidden sm:inline">Desktop View</span>
          </button>
          <button
            onClick={() => setDeviceView('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all font-medium ${
              deviceView === 'mobile'
                ? 'bg-[#00a884] text-white shadow-sm'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
            title="Switch to Android Mobile layout"
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Android View</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Add Contact */}
          <button
            onClick={() => setAddContactModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] font-medium transition-colors"
            title="Add contact by phone or F0UNDR ID"
          >
            <UserPlus size={14} />
            <span className="hidden lg:inline">+ Contact</span>
          </button>

          {/* Register New Account (1 Account per original phone) */}
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] transition-colors"
            title="Register new WhatsApp account"
          >
            <ShieldCheck size={14} className="text-[#00a884]" />
            <span className="hidden lg:inline">+ Account</span>
          </button>

          {/* Quick User Switcher */}
          <div className="hidden xl:flex items-center gap-1 bg-[#111b21] px-2 py-0.5 rounded border border-[#2a3942]">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-xs text-[#00a884] font-semibold focus:outline-none cursor-pointer"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#202c33] text-white">
                  {u.name} ({u.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Settings */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-1.5 rounded hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef]"
            title="Settings & Profile"
          >
            <Settings size={15} />
          </button>

          {/* QR Code */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="p-1.5 rounded hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef]"
            title="Linked Devices QR code"
          >
            <QrCode size={15} className="text-[#00a884]" />
          </button>

          {/* Log Out */}
          <button
            onClick={logout}
            className="p-1.5 rounded hover:bg-red-500/20 text-[#8696a0] hover:text-red-400 transition-colors"
            title="Log Out of WhatsApp"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden relative">
        {deviceView === 'desktop' ? (
          <DesktopLayout />
        ) : (
          <div className="flex-1 flex justify-center bg-[#070b0e] overflow-hidden">
            <div className="w-full max-w-[440px] h-full shadow-2xl flex flex-col bg-[#111b21] relative border-x border-[#222e35]">
              <MobileLayout />
            </div>
          </div>
        )}
      </main>

      {/* Modals & Dialogs */}
      <CallModal />
      <QRCodeModal />
      <NewChatModal />
      <AddContactModal />
      <RegisterUserModal />
      <UserSettingsModal />
      <LockedChatsModal />
      <ArchivedChatsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WhatsAppProvider>
      <WhatsAppContainer />
    </WhatsAppProvider>
  );
};

export default App;
