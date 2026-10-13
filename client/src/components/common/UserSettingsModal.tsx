import React, { useState } from 'react';
import { X, User, Phone, ShieldCheck, Hash, Lock, Ban, Check, Copy, Globe, Server, Wifi, LogOut } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from './Avatar';
import { getServerUrl, setServerUrl, isCapacitorApp, isElectronApp } from '../../utils/config';

export const UserSettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    currentUser,
    updateUserSettings,
    blockedUserIds,
    toggleBlockUser,
    allUsers,
    logout
  } = useWhatsApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [customPhone, setCustomPhone] = useState(currentUser?.custom_phone || currentUser?.phone || '');
  const [chatPin, setChatPin] = useState(currentUser?.chat_pin || '1234');
  const [serverUrlInput, setServerUrlInput] = useState(() => getServerUrl());
  const [copiedFoundr, setCopiedFoundr] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!settingsModalOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const prevUrl = getServerUrl();
    const newUrl = serverUrlInput.trim();
    setServerUrl(newUrl);

    await updateUserSettings({
      name: name.trim(),
      about: about.trim(),
      customPhone: customPhone.trim(),
      chatPin: chatPin.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setSettingsModalOpen(false);
      if (prevUrl !== newUrl) {
        window.location.reload();
      }
    }, 800);
  };

  const handleCopyFoundr = () => {
    if (currentUser.foundr_number) {
      navigator.clipboard.writeText(currentUser.foundr_number);
      setCopiedFoundr(true);
      setTimeout(() => setCopiedFoundr(false), 2000);
    }
  };

  const blockedList = allUsers.filter((u) => blockedUserIds.has(u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <h3 className="font-semibold text-lg text-[#e9edef]">User Settings & Profile</h3>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Avatar and Info Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#202c33]">
            <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-base text-[#e9edef] truncate">{currentUser.name}</h4>
              <p className="text-xs text-[#00a884] font-medium">Verified WhatsApp User</p>
            </div>
          </div>

          {/* Account Identifiers Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Original Phone Card */}
            <div className="p-3 bg-[#202c33] rounded-xl border border-[#2a3942]">
              <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mb-1">
                <ShieldCheck size={14} className="text-[#00a884]" />
                <span>Original Phone (1 Account)</span>
              </div>
              <div className="text-sm font-mono font-semibold text-[#e9edef]">
                {currentUser.original_phone || currentUser.phone}
              </div>
            </div>

            {/* F0UNDR Number Card */}
            <div className="p-3 bg-[#202c33] rounded-xl border border-[#2a3942]">
              <div className="flex items-center justify-between text-xs text-[#8696a0] mb-1">
                <div className="flex items-center gap-1.5">
                  <Hash size={14} className="text-[#00a884]" />
                  <span>F0UNDR Number</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyFoundr}
                  className="text-[10px] text-[#00a884] hover:underline flex items-center gap-0.5"
                >
                  {copiedFoundr ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedFoundr ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-sm font-mono font-semibold text-[#00a884]">
                {currentUser.foundr_number || 'F0UNDR-344678'}
              </div>
            </div>
          </div>

          {/* Edit Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3.5 py-2 text-sm text-[#e9edef] focus:border-[#00a884] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                About / Bio
              </label>
              <input
                type="text"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3.5 py-2 text-sm text-[#e9edef] focus:border-[#00a884] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                Custom Display Phone
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3.5 py-2 text-sm text-[#e9edef] focus:border-[#00a884] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1">
                Chat Lock Passcode (4-Digit PIN)
              </label>
              <div className="flex items-center gap-2 bg-[#202c33] border border-[#2a3942] rounded-xl px-3.5 py-2 focus-within:border-[#00a884]">
                <Lock size={16} className="text-[#00a884]" />
                <input
                  type="password"
                  maxLength={6}
                  value={chatPin}
                  onChange={(e) => setChatPin(e.target.value)}
                  className="w-full bg-transparent text-sm text-[#e9edef] focus:outline-none font-mono tracking-widest"
                />
              </div>
            </div>
          </div>

          {/* Blocked Contacts Section */}
          <div className="pt-2 border-t border-[#222e35]">
            <div className="flex items-center gap-2 mb-3">
              <Ban size={16} className="text-red-400" />
              <span className="text-xs font-semibold text-[#e9edef] uppercase tracking-wider">
                Blocked Contacts ({blockedList.length})
              </span>
            </div>

            {blockedList.length > 0 ? (
              <div className="space-y-2">
                {blockedList.map((blockedUser) => (
                  <div
                    key={blockedUser.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#202c33]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={blockedUser.avatar} name={blockedUser.name} size="sm" />
                      <div>
                        <span className="text-xs font-medium text-[#e9edef] block">{blockedUser.name}</span>
                        <span className="text-[10px] text-[#8696a0] font-mono">{blockedUser.phone}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBlockUser(blockedUser.id)}
                      className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold transition-colors"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8696a0]">No contacts currently blocked</p>
            )}
          </div>

          {/* Server Connection & Network Section */}
          <div className="pt-2 border-t border-[#222e35]">
            <div className="flex items-center gap-2 mb-2">
              <Server size={16} className="text-[#00a884]" />
              <span className="text-xs font-semibold text-[#e9edef] uppercase tracking-wider">
                Backend Server & Network
              </span>
            </div>
            <div className="p-3.5 bg-[#202c33] rounded-xl border border-[#2a3942] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#8696a0]">
                <span>App Platform:</span>
                <span className="font-mono text-[#00a884] font-semibold">
                  {isCapacitorApp() ? 'Android Mobile App' : isElectronApp() ? 'Windows Desktop App' : 'Web Browser'}
                </span>
              </div>
              <div>
                <label className="text-[11px] text-[#8696a0] block mb-1">
                  Server Endpoint URL (IP or Domain):
                </label>
                <div className="flex items-center gap-2 bg-[#111b21] border border-[#2a3942] rounded-lg px-3 py-2 focus-within:border-[#00a884]">
                  <Globe size={14} className="text-[#8696a0]" />
                  <input
                    type="text"
                    value={serverUrlInput}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    placeholder="e.g. http://192.168.1.50:5000 or https://your-server.com"
                    className="w-full bg-transparent text-xs text-[#e9edef] font-mono focus:outline-none placeholder:text-[#53646f]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#8696a0] leading-relaxed">
                To connect multiple phones or your mobile APK to this PC, enter your computer's local Wi-Fi IP (e.g. <span className="text-[#00a884] font-mono">http://192.168.1.x:5000</span>), or deploy the backend to Render/Railway for 24/7 internet access.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                logout();
                setSettingsModalOpen(false);
              }}
              className="px-3 py-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                {savedSuccess ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
