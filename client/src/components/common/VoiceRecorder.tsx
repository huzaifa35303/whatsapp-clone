import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send } from 'lucide-react';
import { getFullApiUrl } from '../../utils/config';

interface VoiceRecorderProps {
  onSend: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Unable to access microphone. Please allow microphone permissions.');
      onCancel();
    }
  };

  const stopRecordingCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleDiscard = () => {
    stopRecordingCleanup();
    onCancel();
  };

  const handleFinish = async () => {
    if (!mediaRecorderRef.current) return;
    setUploading(true);
    stopRecordingCleanup();

    // Small delay to let final data available event fire
    setTimeout(async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, `voice-note-${Date.now()}.webm`);

        const res = await fetch(getFullApiUrl('/api/upload'), {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.url) {
          onSend(data.url, seconds);
        } else {
          onCancel();
        }
      } catch (err) {
        console.error('Upload failed:', err);
        onCancel();
      } finally {
        setUploading(false);
      }
    }, 250);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-[#202c33] text-[#e9edef] rounded-full animate-fade-in shadow-md">
      {/* Delete / Trash */}
      <button
        onClick={handleDiscard}
        className="p-2 hover:bg-red-500/20 text-[#8696a0] hover:text-red-400 rounded-full transition-colors"
        title="Discard recording"
      >
        <Trash2 size={20} />
      </button>

      {/* Recording Indicator */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="font-mono text-sm tracking-wide text-[#e9edef]">{formatTimer(seconds)}</span>
        <span className="text-xs text-[#8696a0] hidden sm:inline">Recording voice note...</span>
      </div>

      {/* Send */}
      <button
        onClick={handleFinish}
        disabled={uploading}
        className="p-2 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
        title="Send voice note"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send size={18} className="translate-x-[1px]" />
        )}
      </button>
    </div>
  );
};
