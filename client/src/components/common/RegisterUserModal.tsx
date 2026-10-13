import React, { useState } from 'react';
import { X, UserPlus, Phone, ShieldCheck, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';

export const RegisterUserModal: React.FC = () => {
  const { registerModalOpen, setRegisterModalOpen, registerUser } = useWhatsApp();

  const [name, setName] = useState('');
  const [originalPhone, setOriginalPhone] = useState('03446789261');
  const [foundrNumber, setFoundrNumber] = useState('f1234567');
  const [customPhone, setCustomPhone] = useState('03446789261');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!registerModalOpen) return null;

  const isFoundrValid = (val: string) => {
    return /^f[a-z0-9]{7}$/i.test(val.trim());
  };

  const handleGenerateFoundr = () => {
    const random7Digits = Math.floor(1000000 + Math.random() * 9000000).toString();
    setFoundrNumber(`f${random7Digits}`);
    setError(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !originalPhone.trim()) {
      setError('Please provide your name and original phone number.');
      return;
    }

    if (!isFoundrValid(foundrNumber)) {
      setError("F0UNDR number must start with 'f' followed by exactly 7 characters (e.g. f1234567 or f0000000).");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await registerUser({
      name: name.trim(),
      originalPhone: originalPhone.trim(),
      foundrNumber: foundrNumber.trim().toLowerCase(),
      customPhone: customPhone.trim() || undefined
    });

    setLoading(false);

    if (res.success) {
      setSuccess(`Account registered successfully as ${res.user?.name}!`);
      setTimeout(() => {
        setRegisterModalOpen(false);
        setSuccess(null);
      }, 1200);
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-[#00a884]" />
            <h3 className="font-semibold text-lg text-[#e9edef]">Create WhatsApp Account</h3>
          </div>
          <button
            onClick={() => setRegisterModalOpen(false)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRegister} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Notice Banner */}
          <div className="p-3 bg-[#00a884]/10 border border-[#00a884]/25 rounded-xl text-xs text-[#00a884] leading-relaxed">
            <strong>Rule:</strong> Each user can create <strong>only 1 WhatsApp account</strong> per Original Phone Number. You also receive a permanent <strong>F0UNDR Number</strong> for adding contacts seamlessly.
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Asad Mehmood"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1.5">
              Original Phone Number * (1 Account Only)
            </label>
            <div className="flex items-center gap-2 bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2.5 focus-within:border-[#00a884]">
              <Phone size={18} className="text-[#00a884]" />
              <input
                type="text"
                placeholder="e.g. 03446789261 (Telenor Pakistan)"
                value={originalPhone}
                onChange={(e) => setOriginalPhone(e.target.value)}
                required
                className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
              />
            </div>
            <span className="text-[11px] text-[#8696a0] mt-1 block">
              Original phone number is verified to prevent duplicate accounts.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center gap-1">
                <Hash size={14} className="text-[#00a884]" />
                <span>Unique F0UNDR Number * (e.g. f1234567)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateFoundr}
                className="text-[11px] text-[#00a884] hover:underline font-semibold"
              >
                🎲 Generate
              </button>
            </div>
            <div className={`flex items-center gap-2 bg-[#202c33] border rounded-xl px-3 py-2.5 transition-colors ${
              isFoundrValid(foundrNumber)
                ? 'border-[#00a884]'
                : foundrNumber.length > 0
                ? 'border-amber-500/60'
                : 'border-[#2a3942] focus-within:border-[#00a884]'
            }`}>
              <span className="font-mono text-sm text-[#00a884] font-bold">f</span>
              <input
                type="text"
                placeholder="1234567 or 0000000"
                maxLength={7}
                value={foundrNumber.startsWith('f') || foundrNumber.startsWith('F') ? foundrNumber.slice(1) : foundrNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 7);
                  setFoundrNumber(`f${raw}`);
                }}
                className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1">
              <span className={isFoundrValid(foundrNumber) ? 'text-[#00a884]' : 'text-[#8696a0]'}>
                Must start with 'f' followed by 7 characters (Total: 8)
              </span>
              <span className="font-mono text-[#8696a0] text-[10px]">{foundrNumber.length}/8 chars</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1.5">
              Custom Display Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. +92 344 6789261"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3.5 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none font-mono"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] text-xs flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !originalPhone.trim()}
              className="px-5 py-2.5 text-xs font-semibold bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
