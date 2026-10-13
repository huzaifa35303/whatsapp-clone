import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';

export const QRCodeModal: React.FC = () => {
  const { qrModalOpen, setQrModalOpen, socket, currentUser, allUsers, switchUser } = useWhatsApp();
  const [qrToken, setQrToken] = useState<string>('');
  const [pairingStatus, setPairingStatus] = useState<'waiting' | 'paired'>('waiting');

  useEffect(() => {
    if (!qrModalOpen || !socket) return;

    socket.emit('qr:generate');

    const handleQrReady = ({ token }: { token: string }) => {
      setQrToken(token);
      setPairingStatus('waiting');
    };

    socket.on('qr:code_ready', handleQrReady);

    return () => {
      socket.off('qr:code_ready', handleQrReady);
    };
  }, [qrModalOpen, socket]);

  if (!qrModalOpen) return null;

  const simulateMobileScan = (targetUserId: string) => {
    if (!socket || !qrToken) return;
    setPairingStatus('paired');
    socket.emit('qr:scan', { token: qrToken, userId: targetUserId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#111b21] border border-[#222e35] rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative">
        <button
          onClick={() => setQrModalOpen(false)}
          className="absolute top-4 right-4 text-[#8696a0] hover:text-[#e9edef] p-2 rounded-full hover:bg-[#202c33]"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Instructions */}
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-semibold text-[#e9edef]">Use WhatsApp on your computer</h2>
            <ol className="space-y-3 text-sm text-[#8696a0] list-decimal list-inside leading-relaxed">
              <li>Open WhatsApp on your phone</li>
              <li>Tap <strong className="text-[#e9edef]">Menu ⋮</strong> or <strong className="text-[#e9edef]">Settings ⚙️</strong> and select <strong className="text-[#e9edef]">Linked Devices</strong></li>
              <li>Tap on <strong className="text-[#e9edef]">Link a Device</strong></li>
              <li>Point your phone to this screen to capture the code</li>
            </ol>

            <div className="pt-4 border-t border-[#222e35]">
              <span className="text-xs text-[#8696a0] block mb-2 font-medium">Quick Demo: Pair with another user account</span>
              <div className="flex flex-wrap gap-2">
                {allUsers
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => simulateMobileScan(u.id)}
                      className="px-3 py-1.5 text-xs bg-[#202c33] hover:bg-[#00a884] hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Smartphone size={13} />
                      Pair as {u.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* QR Code Canvas */}
          <div className="flex flex-col items-center bg-white p-5 rounded-2xl shadow-inner">
            {qrToken ? (
              <div className="relative">
                <QRCodeSVG
                  value={qrToken}
                  size={210}
                  level="M"
                  includeMargin={false}
                  imageSettings={{
                    src: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true
                  }}
                />
                {pairingStatus === 'paired' && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-[#00a884] font-medium animate-fade-in">
                    <CheckCircle size={48} className="mb-2" />
                    <span>Device Paired!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-[210px] h-[210px] flex items-center justify-center text-gray-400">
                <RefreshCw size={32} className="animate-spin text-[#00a884]" />
              </div>
            )}
            <p className="mt-3 text-xs text-gray-500 font-medium">Keep me signed in</p>
          </div>
        </div>
      </div>
    </div>
  );
};
