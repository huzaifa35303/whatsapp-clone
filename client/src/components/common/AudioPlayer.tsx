import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number | null;
  senderAvatar?: string;
  isOutgoing?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration = 0,
  senderAvatar,
  isOutgoing = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * totalDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Static bars representing voice waveform
  const waveformBars = [40, 65, 85, 30, 45, 95, 70, 50, 80, 60, 40, 75, 90, 65, 35, 55, 80, 45, 60, 70, 50, 85, 30, 60];

  return (
    <div className="flex items-center gap-3 py-1 min-w-[260px] max-w-[340px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Mic Avatar Icon */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center">
          {senderAvatar ? (
            <img src={senderAvatar} alt="Sender" className="w-full h-full object-cover" />
          ) : (
            <Mic size={20} className="text-[#00a884]" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#00a884] rounded-full p-1 text-white shadow-sm">
          <Mic size={10} />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-transparent hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-[#8696a0] hover:text-[#00a884] transition-colors"
      >
        {isPlaying ? <Pause size={20} className="fill-current text-[#00a884]" /> : <Play size={20} className="fill-current" />}
      </button>

      {/* Waveform and Progress */}
      <div className="flex-1 flex flex-col justify-center gap-1 cursor-pointer" onClick={handleSeek}>
        <div className="h-6 flex items-center gap-[2px]">
          {waveformBars.map((height, i) => {
            const barPos = (i / waveformBars.length) * 100;
            const isPassed = barPos <= progress;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors ${
                  isPassed
                    ? isOutgoing
                      ? 'bg-[#00a884]'
                      : 'bg-[#53bdeb]'
                    : isOutgoing
                    ? 'bg-[#005c4b]/50 dark:bg-white/30'
                    : 'bg-[#8696a0]/40'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#8696a0]">
          <span>{formatTime(currentTime > 0 ? currentTime : totalDuration)}</span>
          {isPlaying && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSpeed();
              }}
              className="px-1 py-0.5 rounded bg-black/20 text-[10px] text-[#e9edef] font-semibold hover:bg-black/40"
            >
              {speed}x
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
