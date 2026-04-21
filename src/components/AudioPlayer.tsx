import { useState, useRef } from "react";
import { motion } from "framer-motion";

export default ({ src }: { src: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime =
      (Number(e.target.value) / 100) * (audioRef.current?.duration || 0);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
    }
  };

  const updateProgress = () => {
    if (audioRef.current) {
      const value =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(value || 0);
    }
  };

  return (
    <div className="group relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all hover:bg-white/10">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={updateProgress}
        onEnded={() => setIsPlaying(false)}
        hidden
      />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all duration-300 ${
          isPlaying
            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40"
            : "bg-white/10 text-slate-300 hover:text-white"
        }`}
      >
        {isPlaying ? (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 translate-x-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Interactive Progress Scrubber */}
      <div className="relative flex flex-1 items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="absolute z-20 h-1.5 w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={`h-full rounded-full ${isPlaying ? "bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.6)]" : "bg-slate-400"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
