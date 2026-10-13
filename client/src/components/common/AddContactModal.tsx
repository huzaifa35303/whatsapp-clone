import React, { useState } from 'react';
import { X, UserPlus, Phone, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';

export const AddContactModal: React.FC = () => {
  const { addContactModalOpen, setAddContactModalOpen, addContact } = useWhatsApp();
  const [query, setQuery] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!addContactModalOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await addContact(query.trim(), nickname.trim() || undefined);
    setLoading(false);

    if (res.success) {
      setSuccess('Contact added and chat opened!');
      setTimeout(() => {
        setAddContactModalOpen(false);
        setQuery('');
        setNickname('');
        setSuccess(null);
      }, 1000);
    } else {
      setError(res.error || 'User not found');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-[#00a884]" />
            <h3 className="font-semibold text-lg text-[#e9edef]">Add New Contact</h3>
          </div>
          <button
            onClick={() => setAddContactModalOpen(false)}
            className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-full hover:bg-[#2a3942]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAdd} className="p-6 space-y-4">
          <p className="text-xs text-[#8696a0] leading-relaxed">
            You can add contacts by their <strong>Phone Number</strong> (e.g. <code className="text-[#00a884]">03446789261</code> or <code className="text-[#00a884]">+92 344 6789261</code>), their <strong>Email Address</strong> (e.g. <code className="text-[#00a884]">user@gmail.com</code>), or their unique <strong>F0UNDR ID</strong> (e.g. <code className="text-[#00a884]">f1234567</code> or <code className="text-[#00a884]">f0000000</code>).
          </p>

          <div>
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1.5">
              Phone, Email, or F0UNDR ID *
            </label>
            <div className="flex items-center gap-2 bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2.5 focus-within:border-[#00a884]">
              <Hash size={18} className="text-[#00a884]" />
              <input
                type="text"
                placeholder="e.g. 03446789261, user@gmail.com, or f1234567"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                required
                className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider block mb-1.5">
              Contact Nickname (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Asad (Telenor)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-3 py-2.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none"
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
              onClick={() => setAddContactModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              {loading ? 'Searching...' : 'Add Contact & Open Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
