import { useState, useRef } from "react";
import { db, auth, storage } from "../utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { Button, Label, Select, Textarea, FileInput } from "flowbite-react";
import { AnimatePresence, motion } from "framer-motion";
import categories from "../utils/categories";
import { useCountdown } from "../hooks/useCountDown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeYear: number;
}

export const FileEvidenceForm = ({ isOpen, onClose, activeYear }: Props) => {
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { isVotingClosed } = useCountdown();
  const [uploadProgress, setUploadProgress] = useState(0);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const types = ["audio/mp4", "audio/webm", "audio/ogg"];
    const supportedType = types.find((type) =>
      MediaRecorder.isTypeSupported(type),
    );

    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: supportedType,
    });
    audioChunks.current = [];
    mediaRecorder.current.ondataavailable = (e) =>
      audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const mimeType = mediaRecorder.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunks.current, { type: mimeType });
      setAudioUrl(URL.createObjectURL(audioBlob));
      setFile(audioBlob);
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
    mediaRecorder.current?.stream.getTracks().forEach((t) => t.stop());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Sign in to snitch!");

    const hasText = text.trim().length > 0;
    const hasMedia = file !== null;

    if (!hasText && !hasMedia) {
      alert(
        "You can't file evidence without proof! Add a note, a voice memo, or an attachment.",
      );
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl = "";
      let fileType = "text";

      if (file) {
        const extension = file.type.split("/")[1] || "bin";
        const fileName =
          file instanceof File ? file.name : `memo_${Date.now()}.${extension}`;
        const fileRef = ref(storage, `evidence/${Date.now()}_${fileName}`);

        const uploadTask = uploadBytesResumable(fileRef, file);

        // Listen for state changes, errors, and completion of the upload.
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log("Upload is " + progress + "% done");
              setUploadProgress(progress);
            },
            (error) => reject(error),
            () => resolve(true),
          );
        });

        fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
        fileType = file.type.split("/")[0];
      }

      await addDoc(collection(db, "polls", String(activeYear), "evidence"), {
        categoryId,
        content: text,
        fileUrl,
        fileType,
        authorName: auth.currentUser.displayName,
        authorPhoto: auth.currentUser.photoURL,
        authorId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      });

      setText("");
      setFile(null);
      setAudioUrl(null);
      onClose(); // Close drawer on success
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check if it's a video
    if (selectedFile.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        // Release memory
        window.URL.revokeObjectURL(video.src);

        if (video.duration > 30.5) {
          // 0.5s buffer for rounding
          alert("Evidence is too long! Videos must be under 30 seconds.");
          e.target.value = ""; // Clear the input
          setFile(null);
          return;
        }

        setFile(selectedFile);
        setAudioUrl(null);
      };

      video.src = URL.createObjectURL(selectedFile);
    } else {
      // If it's an image, just set it
      setFile(selectedFile);
      setAudioUrl(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-2xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white italic">
                FILE EVIDENCE
              </h2>
              <button
                onClick={onClose}
                className="cursor-pointer text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <Label className="mb-2 block text-xs font-bold tracking-widest text-white uppercase">
                  Category
                </Label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-bold tracking-widest text-white uppercase">
                  What Happened?
                </Label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="Context..."
                />
              </div>

              {/* Recorder and Upload UI (Compressed for drawer) */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner">
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    Voice Evidence
                  </Label>
                  {isRecording && (
                    <span className="flex animate-pulse items-center gap-1.5 text-[10px] font-bold text-red-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      REC
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isVotingClosed}
                      className={`group relative flex h-12 items-center justify-center rounded-xl px-6 transition-all duration-300 active:scale-95 ${
                        isRecording
                          ? "w-full bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                          : "w-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                      } ${isVotingClosed ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {isRecording ? (
                          <>
                            <div className="h-3 w-3 animate-pulse rounded-sm bg-white" />
                            <span className="text-sm font-bold tracking-wide">
                              STOP RECORDING
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-3 w-3 rounded-full bg-red-600 transition-all group-hover:shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                            <span className="text-sm font-bold tracking-wide">
                              START MEMO
                            </span>
                          </>
                        )}
                      </div>
                    </button>

                    {audioUrl && !isRecording && (
                      <button
                        type="button"
                        onClick={() => {
                          setAudioUrl(null);
                          setFile(null);
                        }}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-500"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {audioUrl && !isRecording && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="rounded-lg border border-white/5 bg-white/5 p-2"
                      >
                        <audio
                          src={audioUrl}
                          controls
                          className="h-8 w-full opacity-80 invert"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-5">
                <div className="h-0.5 w-[20%] rounded-full bg-white/20" />
                <span className="text-white/20">or</span>
                <div className="h-0.5 w-[20%] rounded-full bg-white/20" />
              </div>

              <div>
                <Label className="mb-2 block text-xs font-bold tracking-widest text-white uppercase">
                  Media Attachment
                </Label>
                <FileInput
                  accept="video/mp4,video/quicktime,video/x-m4v,image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="mt-1 flex items-center justify-between px-1">
                <span className="text-[10px] tracking-widest text-slate-500 uppercase">
                  Max Video Duration: 30s
                </span>
                {file && file.type.startsWith("video/") && (
                  <span className="text-[10px] font-bold text-blue-400 uppercase">
                    Video Validated
                  </span>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  isUploading || isVotingClosed || (!text.trim() && !file)
                }
                className={`relative cursor-pointer overflow-hidden border-none transition-all duration-300 ${
                  isVotingClosed || (!text.trim() && !file)
                    ? "cursor-not-allowed bg-slate-700 opacity-50"
                    : isUploading
                      ? "cursor-wait bg-blue-800"
                      : "bg-linear-to-r from-purple-600 to-blue-500 shadow-lg shadow-blue-500/20 hover:scale-105"
                }`}
              >
                {/* The Text - Hidden while uploading */}
                <span
                  className={
                    isUploading
                      ? "opacity-0"
                      : "flex items-center gap-2 opacity-100"
                  }
                >
                  {isVotingClosed ? "Submissions Closed" : "Submit Evidence"}
                </span>

                {/* The Spinner - Visible only while uploading */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 animate-spin text-white"
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
                      <span className="text-xs font-bold tracking-widest uppercase">
                        Filing Receipt...
                      </span>
                    </div>
                  </div>
                )}
              </Button>
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 space-y-2"
                  >
                    <div className="flex justify-between text-[10px] font-black tracking-widest text-blue-400 uppercase">
                      <span>Uploading Evidence</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-linear-to-r from-blue-600 to-purple-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{
                          type: "spring",
                          bounce: 0,
                          duration: 0.2,
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const TrashIcon = () => (
  <svg
    className="h-5 w-5 cursor-pointer"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
