import { useState, useRef, useEffect } from "react";
import { auth, storage } from "../utils/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

interface VoiceTransmitterProps {
  isSystemLocked: boolean;
  setSystemLocked: (locked: boolean) => void;
}

export default ({ isSystemLocked, setSystemLocked }: VoiceTransmitterProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {}, [isRecording]);

  const getSupportedMimeType = (): string => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/wav",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const startRecording = async () => {
    if (isSystemLocked) return;
    audioChunksRef.current = [];

    setSystemLocked(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const durationSec = (Date.now() - recordingStartTimeRef.current) / 1000;
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || "audio/webm",
        });
        await handleVoiceUploadAndSend(audioBlob, mimeType, durationSec);
      };

      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert(
        "Microphone access denied. Grant permissions in iOS Settings -> Safari.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceUploadAndSend = async (
    audioBlob: Blob,
    detectedMimeType: string,
    calculatedDuration: number,
  ) => {
    setIsSendingVoice(true);
    setSystemLocked(true); // Engages lock across BOTH panels
    const currentUserUid = auth.currentUser?.uid || "anonymous";

    let extension = "webm";
    if (detectedMimeType.includes("mp4")) extension = "m4a";
    if (detectedMimeType.includes("wav")) extension = "wav";

    const tempFileName = `memo_${Date.now()}_${currentUserUid}.${extension}`;
    const tempStoragePath = `discord_host_transient/${tempFileName}`;
    const fileRef = ref(storage, tempStoragePath);

    try {
      const uploadResult = await uploadBytes(fileRef, audioBlob, {
        contentType: detectedMimeType || "audio/webm",
      });
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const botUrl = import.meta.env.DEV
        ? "http://localhost:3000"
        : "https://bot.funny-guys-host.win";
      const userName = auth.currentUser?.displayName || "Host";

      const response = await fetch(`${botUrl}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          action: "soundboard",
          soundId: "transient_voice_memo",
          soundUrl: downloadUrl,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || "Failed to transmit audio.");
        setSystemLocked(false);
        setIsSendingVoice(false);
        return;
      }

      // Cleanup transient storage file after 15s
      setTimeout(async () => {
        await deleteObject(fileRef).catch((e) => console.warn(e));
      }, 15000);

      // Lock UI for the dynamic duration of the recording + 1.5s buffer
      const lockDurationMs = calculatedDuration * 1000 + 1500;
      console.log(`🎤 Voice lock engaged for ${lockDurationMs / 1000}s`);

      setTimeout(() => {
        setSystemLocked(false);
        setIsSendingVoice(false);
        console.log("🔓 Voice lock lifted.");
      }, lockDurationMs);
    } catch (error) {
      console.error(error);
      alert("Error sending voice memo.");
      setSystemLocked(false);
      setIsSendingVoice(false);
    }
  };

  return (
    <div
      className={`mt-8 rounded-3xl border border-white/5 bg-black/40 p-6 shadow-2xl ring-1 ring-white/5 backdrop-blur-2xl transition-opacity duration-300 ${isSystemLocked && !isRecording ? "opacity-80" : "opacity-100"}`}
    >
      <div className="mb-4">
        <h3 className="font-sans text-lg font-bold tracking-tight text-white uppercase">
          Live Voice Transmitter
        </h3>
        <p className="text-[11px] tracking-wide text-slate-400">
          {isSystemLocked && !isRecording
            ? "🔒 Voice pipeline is busy."
            : "Push a dynamic microphone message directly into Discord."}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isSendingVoice || isSystemLocked}
            className="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-red-500/20 bg-red-600/10 px-5 py-3 text-[11px] font-bold tracking-wider text-red-400 uppercase shadow-lg shadow-red-950/20 transition-all active:scale-95 enabled:hover:scale-[1.01] enabled:hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="text-xs">🎤</span> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex animate-pulse cursor-pointer items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-[11px] font-bold tracking-wider text-white uppercase transition-all hover:bg-white/20 active:scale-95"
          >
            <span className="text-xs">⏹️</span> Stop & Broadcast
          </button>
        )}

        {isSendingVoice && (
          <div className="flex items-center gap-2 text-[10px] tracking-widest text-amber-500 uppercase">
            <svg
              className="h-3.5 w-3.5 animate-spin text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Transmitting...
          </div>
        )}
      </div>
    </div>
  );
};
