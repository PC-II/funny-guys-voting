import { useState, useEffect, useRef } from "react";
import { auth, storage, db } from "../utils/firebase";
import {
  ref,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDoc,
} from "firebase/firestore";

interface DynamicSound {
  id: string;
  label: string;
  fileUrl: string;
  emoji: string;
  uploadedBy: string;
}

interface SoundboardProps {
  isSystemLocked: boolean;
  setSystemLocked: (locked: boolean) => void;
}

export default ({ isSystemLocked, setSystemLocked }: SoundboardProps) => {
  const [sounds, setSounds] = useState<DynamicSound[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [customEmojiInput, setCustomEmojiInput] = useState("🔊"); // Defaults to a speaker
  const [showRenameModal, setShowRenameModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserUid = auth.currentUser?.uid;

  useEffect(() => {
    const q = query(collection(db, "soundboard"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedSounds: DynamicSound[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            label: data.label || doc.id,
            fileUrl: data.fileUrl,
            uploadedBy: data.uploadedBy,
            emoji: data.emoji || "🔊",
          };
        });
        setSounds(loadedSounds);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error: ", error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  // Helper: Extract valid emojis from string and limit to a max of 3
  const getCleanEmojis = (input: string): string => {
    // Unicode regex to isolate native emojis
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
    const matches = input.match(emojiRegex) || [];

    // Slice to enforce maximum of 3 emojis
    return matches.slice(0, 3).join("");
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      alert("Please upload a valid audio file.");
      return;
    }

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.addEventListener("loadedmetadata", () => {
      if (audio.duration > 10) {
        alert(
          `Audio is too long (${audio.duration.toFixed(1)}s). Maximum duration allowed is 10 seconds.`,
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const defaultName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ");
        setPendingFile(file);
        setCustomName(defaultName);
        setCustomEmojiInput("🔊"); // Reset to default speaker
        setShowRenameModal(true);
      }
    });
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile || !customName.trim() || !currentUserUid) return;

    // Clean up the emoji string. Fall back to "🔊" if they cleared the field or typed gibberish.
    const processedEmojis = getCleanEmojis(customEmojiInput) || "🔊";

    setIsUploading(true);
    setShowRenameModal(false);

    try {
      const fileExtension = pendingFile.name.substring(
        pendingFile.name.lastIndexOf("."),
      );
      const uniqueId = `${Date.now()}_${currentUserUid}`;
      const storagePath = `discord_host_soundboard/${uniqueId}${fileExtension}`;

      const fileRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(fileRef, pendingFile);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      await setDoc(doc(db, "soundboard", uniqueId), {
        label: customName.trim(),
        fileUrl: downloadUrl,
        storagePath: storagePath,
        uploadedBy: currentUserUid,
        emoji: processedEmojis,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(error);
      alert("Failed to upload audio.");
    } finally {
      setIsUploading(false);
      setPendingFile(null);
      setCustomName("");
      setCustomEmojiInput("🔊");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteSound = async (
    soundId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    if (isSystemLocked) return;

    if (!confirm("Are you sure you want to permanently delete this sound?"))
      return;

    try {
      const docRef = doc(db, "soundboard", soundId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedStoragePath = data.storagePath;

        if (savedStoragePath) {
          const fileRef = ref(storage, savedStoragePath);
          await deleteObject(fileRef).catch((err) =>
            console.warn("Storage item already deleted:", err),
          );
        }
      }
      await deleteDoc(docRef);
    } catch (error) {
      console.error(error);
      alert("Error deleting sound.");
    }
  };

  const triggerSound = async (sound: DynamicSound | "random") => {
    if (isSystemLocked) return;

    let targetSoundId = "";
    let targetSoundUrl = "";
    let estimatedDuration = 5;

    if (sound === "random") {
      if (sounds.length === 0) return;
      const randomIndex = Math.floor(Math.random() * sounds.length);
      const chosenSound = sounds[randomIndex];

      targetSoundId = chosenSound.id;
      targetSoundUrl = chosenSound.fileUrl;
      setActiveSound("random");
    } else {
      targetSoundId = sound.id;
      targetSoundUrl = sound.fileUrl;
      setActiveSound(sound.id);
    }

    setSystemLocked(true);

    try {
      const audioObj = new Audio(targetSoundUrl);
      await new Promise<void>((resolve) => {
        audioObj.addEventListener("loadedmetadata", () => {
          estimatedDuration = audioObj.duration;
          resolve();
        });
        audioObj.addEventListener("error", () => resolve());
        setTimeout(() => resolve(), 1000);
      });
    } catch (e) {
      console.warn(
        "Failed to pre-fetch sound duration. Defaulting lock to 5s.",
      );
    }

    const userName = auth.currentUser?.displayName || "Host";
    const botUrl = import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://bot.funny-guys-host.win";

    try {
      const response = await fetch(`${botUrl}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          action: "soundboard",
          soundId: targetSoundId,
          soundUrl: targetSoundUrl,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || "Failed to trigger sound on Discord.");
        setSystemLocked(false);
        setActiveSound(null);
        return;
      }
    } catch (error) {
      console.error("Connection failed:", error);
      setSystemLocked(false);
      setActiveSound(null);
      return;
    }

    const lockDurationMs = estimatedDuration * 1000 + 1500;
    console.log(`🔒 Control Panel locked for ${lockDurationMs / 1000}s`);

    setTimeout(() => {
      setSystemLocked(false);
      setActiveSound(null);
      console.log("🔓 Control Panel unlocked.");
    }, lockDurationMs);
  };

  if (loading) {
    return (
      <div className="mt-8 rounded-3xl border border-white/5 bg-black/40 p-6 text-center backdrop-blur-2xl">
        <div className="animate-pulse font-mono text-xs text-amber-500/80">
          Syncing Soundboard...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-8 rounded-3xl border border-white/5 bg-black/40 p-6 shadow-2xl ring-1 ring-white/5 backdrop-blur-2xl transition-opacity duration-300 ${isSystemLocked ? "opacity-80" : "opacity-100"}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelection}
        accept="audio/*"
        className="hidden"
      />

      {/* Header and Buttons */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-sans text-lg font-bold tracking-tight text-white uppercase">
            Discord Soundboard
          </h3>
          <p className="text-[11px] font-light tracking-wide text-slate-400">
            {isSystemLocked
              ? "🔒 Transmitting sound... Please wait."
              : "Cloud sound bites. Up to 10 seconds max."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSystemLocked}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4.5 py-2 text-[11px] font-bold tracking-wider text-amber-400 uppercase transition-all hover:bg-amber-500/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {isUploading ? "Uploading..." : "📤 Add Soundbite"}
          </button>

          {sounds.length > 0 && (
            <button
              onClick={() => triggerSound("random")}
              disabled={isSystemLocked || isUploading}
              className={`cursor-pointer rounded-full border border-red-500/30 bg-red-600/10 px-4.5 py-2 text-[11px] font-bold tracking-wider text-red-400 uppercase shadow-lg shadow-red-950/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 ${
                activeSound === "random"
                  ? "ring-2 ring-red-500"
                  : "hover:scale-102 hover:bg-red-600/25"
              }`}
            >
              🎲 Random Chaos
            </button>
          )}
        </div>
      </div>

      {/* Sound Bite Grid */}
      {sounds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/5 bg-black/20 p-8 text-center text-sm font-light text-slate-500">
          No custom sounds added yet. Add your own soundbite!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sounds.map((sound) => {
            const isThisActive = activeSound === sound.id;
            const canDelete = sound.uploadedBy === currentUserUid;

            return (
              <button
                key={sound.id}
                onClick={() => triggerSound(sound)}
                disabled={isSystemLocked}
                className={`group relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30 ${
                  isThisActive
                    ? "scale-[0.98] border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.15)]"
                    : "border-white/5 bg-black/30 text-slate-300 enabled:hover:-translate-y-0.5 enabled:hover:border-amber-500/20 enabled:hover:bg-amber-500/5"
                }`}
              >
                {/* Delete button */}
                {canDelete && !isSystemLocked && (
                  <span
                    onClick={(e) => handleDeleteSound(sound.id, e)}
                    className="absolute top-2 right-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-red-500/20 bg-black/60 text-[9px] text-red-400"
                    title="Delete Soundbite"
                  >
                    ✕
                  </span>
                )}

                {/* Displaying up to three emojis cleanly */}
                <span className="text-xl tracking-tight drop-shadow-sm filter transition-transform duration-300 group-hover:scale-110">
                  {sound.emoji}
                </span>
                <span className="max-w-full truncate px-1 text-[11px] font-medium tracking-wide uppercase">
                  {sound.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Modern Frosted Modal with Emoji Input Customization */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/5 bg-black/95 p-6 shadow-2xl ring-1 ring-white/10">
            <h4 className="mb-1 text-base font-bold tracking-wider text-white uppercase">
              Configure Your Soundbite
            </h4>
            <p className="mb-4 text-[11px] leading-relaxed font-light text-slate-400">
              Define the display handle and up to 3 custom identity emojis for
              your cloud track.
            </p>

            {/* Title Label Input */}
            <label className="mb-1.5 block font-mono text-[9px] tracking-widest text-slate-500 uppercase">
              Soundbite Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Crazy Screaming"
              maxLength={24}
              className="mb-4 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-600 transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />

            {/* Custom Emoji Input Field */}
            <div className="mb-5">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">
                  Custom Emojis
                </label>
                <span className="font-mono text-[9px] text-amber-500 uppercase">
                  Max 3 Emojis
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={customEmojiInput}
                  onChange={(e) => setCustomEmojiInput(e.target.value)}
                  placeholder="Paste or type emojis here..."
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 pr-16 pl-4 text-xs text-white placeholder-slate-600 transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />

                {/* Visual Realtime Validation/Feedback Badge inside input */}
                <div className="absolute top-1.5 right-2 flex h-7 items-center justify-center rounded-lg border border-white/5 bg-white/5 px-2.5 font-mono text-[10px] text-slate-400">
                  {getCleanEmojis(customEmojiInput) ? (
                    <span className="tracking-tight">
                      {getCleanEmojis(customEmojiInput)}
                    </span>
                  ) : (
                    <span className="text-red-400">None ❌</span>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-[10px] leading-tight font-light text-slate-500">
                Any regular letters, symbols, or extra emojis you write will be
                filtered out automatically.
              </p>
            </div>

            {/* Action Controls */}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setPendingFile(null);
                }}
                className="cursor-pointer rounded-xl bg-white/5 px-4 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase transition-all hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadConfirm}
                disabled={!customName.trim()}
                className="cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-[10px] font-bold tracking-wider text-black uppercase transition-all hover:bg-amber-400 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
