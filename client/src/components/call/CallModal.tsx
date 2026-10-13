import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2 } from 'lucide-react';
import { useWhatsApp } from '../../context/WhatsAppContext';
import { Avatar } from '../common/Avatar';

export const CallModal: React.FC = () => {
  const { activeCall, acceptCall, rejectCall, endCall } = useWhatsApp();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let timer: any = null;
    if (activeCall?.status === 'connected') {
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  // Handle local camera preview if video call is active
  useEffect(() => {
    if (activeCall && activeCall.type === 'video') {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera preview not available:', err);
        });
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [activeCall?.type, activeCall?.status]);

  if (!activeCall) return null;

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. Incoming Call Prompt
  if (activeCall.isIncoming && activeCall.status === 'ringing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-[#111b21] border border-[#222e35] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-[#00a884]/20 animate-ping absolute inset-0 -m-2" />
            <Avatar src={activeCall.otherUser.avatar} name={activeCall.otherUser.name} size="xl" />
          </div>

          <h3 className="text-xl font-bold text-[#e9edef] mb-1">{activeCall.otherUser.name}</h3>
          <p className="text-sm text-[#00a884] mb-8 font-medium">
            Incoming WhatsApp {activeCall.type} call...
          </p>

          <div className="flex items-center justify-around w-full px-4">
            {/* Decline */}
            <button
              onClick={rejectCall}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                <PhoneOff size={24} />
              </div>
              <span className="text-xs text-[#8696a0]">Decline</span>
            </button>

            {/* Accept */}
            <button
              onClick={acceptCall}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#00a884] hover:bg-[#008f6f] flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110">
                <Phone size={24} />
              </div>
              <span className="text-xs text-[#8696a0]">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Connected or Outgoing Call
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b141a] text-[#e9edef] animate-fade-in select-none">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00a884] animate-pulse" />
          <div>
            <h4 className="font-semibold text-sm">{activeCall.otherUser.name}</h4>
            <p className="text-xs text-[#8696a0]">
              {activeCall.status === 'connected' ? formatTimer(elapsed) : 'Ringing...'}
            </p>
          </div>
        </div>
        <div className="text-xs text-[#8696a0] bg-black/40 px-3 py-1 rounded-full border border-white/10">
          End-to-end encrypted
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {activeCall.type === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-[#111b21]">
            {/* Remote Video Mock / Simulation */}
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#111b21] to-[#202c33]">
              <Avatar src={activeCall.otherUser.avatar} name={activeCall.otherUser.name} size="xl" />
              <p className="mt-4 text-[#8696a0] text-sm">Remote Video Connected</p>
            </div>

            {/* Local Video Stream Preview */}
            <div className="absolute top-4 right-4 w-32 h-44 sm:w-48 sm:h-64 rounded-2xl overflow-hidden bg-black border-2 border-[#00a884] shadow-2xl z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-[#202c33] text-xs text-[#8696a0]">
                  Camera off
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Audio Call Screen */
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              {activeCall.status === 'connected' && (
                <div className="w-32 h-32 rounded-full bg-[#00a884]/15 animate-ping absolute inset-0 -m-4" />
              )}
              <Avatar src={activeCall.otherUser.avatar} name={activeCall.otherUser.name} size="xl" className="w-28 h-28" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{activeCall.otherUser.name}</h2>
            <p className="text-sm text-[#8696a0]">
              {activeCall.status === 'connected' ? `Connected • ${formatTimer(elapsed)}` : 'Calling...'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6 z-10">
        {/* Toggle Mic */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500 text-white' : 'bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef]'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Toggle Video if video call */}
        {activeCall.type === 'video' && (
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoOff ? 'bg-red-500 text-white' : 'bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef]'
            }`}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        {/* End Call */}
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110"
          title="End Call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
