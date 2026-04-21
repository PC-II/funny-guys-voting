import { useEffect, useState } from "react";
import { db, auth, storage } from "../utils/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { AnimatePresence, motion } from "framer-motion";
import categories from "../utils/categories";
import AudioPlayer from "./AudioPlayer";
import { TrashIcon } from "./FileEvidenceForm";

export default ({ activeYear }: { activeYear: number }) => {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "polls", String(activeYear), "evidence"),
      orderBy("timestamp", "desc"),
    );
    return onSnapshot(q, (snap) => {
      setEvidence(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [activeYear]);

  const handleDelete = async (item: any) => {
    if (!item) return;
    setIsDeleting(true); // Start loading

    try {
      // 1. Delete from Firestore
      await deleteDoc(
        doc(db, "polls", String(activeYear), "evidence", item.id),
      );

      // 2. Delete from Storage if there was a file
      if (item.fileUrl) {
        const fileRef = ref(storage, item.fileUrl);
        await deleteObject(fileRef).catch(() =>
          console.log("File already gone or external"),
        );
      }
      setDeletingId(null);
    } catch (error) {
      alert("Failed to retract evidence.");
    } finally {
      setIsDeleting(false); // Stop loading
    }
  };

  return (
    <div className="space-y-12">
      {/* Delete Evidence Nodal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl"
            >
              <h2 className="text-xl font-black tracking-tight text-white uppercase italic">
                Retract Evidence?
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                This action is permanent. The receipts will be scrubbed from the
                vault.
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setDeletingId(null)}
                  className={`flex-1 rounded-xl bg-white/5 py-3 text-sm font-bold text-white transition-all ${isDeleting ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:bg-white/10"}`}
                >
                  NEVERMIND
                </button>

                <button
                  disabled={isDeleting}
                  onClick={() =>
                    handleDelete(evidence.find((e) => e.id === deletingId))
                  }
                  className={`relative flex-1 overflow-hidden rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all ${
                    isDeleting
                      ? "cursor-not-allowed bg-red-900/50 shadow-none"
                      : "cursor-pointer bg-red-600 shadow-red-600/20 hover:bg-red-500"
                  }`}
                >
                  <span className={isDeleting ? "opacity-0" : "opacity-100"}>
                    DELETE
                  </span>

                  {/* Modern Spinner Overlay */}
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center">
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
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX OVERLAY */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-100 flex h-full cursor-zoom-out items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl"
          >
            <motion.img
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={selectedImage}
              className="max-h-[90vh] max-w-full rounded-2xl border border-white/10 shadow-2xl"
              alt="Evidence Fullscreen"
            />
            <div className="absolute top-6 right-6 font-mono text-xs tracking-widest text-white/50 uppercase">
              Click anywhere to close
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {categories.map((cat) => {
        const items = evidence.filter((e) => e.categoryId === cat.id);
        if (items.length === 0) return null;

        return (
          <div key={cat.id}>
            <h3 className="mb-6 text-sm font-black tracking-[0.3em] text-blue-500 uppercase italic">
              // {cat.title}
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md transition-all hover:bg-white/10"
                >
                  {/* DELETE BUTTON (Only shows for owner) */}
                  {auth.currentUser?.uid === item.authorId && (
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="absolute top-4 right-4 z-10 p-2 text-red-500"
                    >
                      <TrashIcon />
                    </button>
                  )}

                  <div className="mb-4 flex items-center gap-3">
                    <img
                      src={item.authorPhoto}
                      className="h-6 w-6 rounded-full ring-1 ring-white/20"
                      alt=""
                    />
                    <span className="text-xs font-bold text-slate-400">
                      {item.authorName}
                    </span>
                  </div>

                  {item.content && (
                    <p className="mb-4 text-sm leading-relaxed text-slate-200">
                      {item.content}
                    </p>
                  )}

                  {item.fileUrl && (
                    <div className="relative overflow-hidden rounded-xl bg-black/20">
                      {item.fileType === "image" && (
                        <div
                          className="group/img relative cursor-zoom-in overflow-hidden"
                          onClick={() => setSelectedImage(item.fileUrl)}
                        >
                          <img
                            src={item.fileUrl}
                            className="h-64 w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                            <span className="rounded-full bg-white/20 px-4 py-2 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                              View Full Receipt
                            </span>
                          </div>
                        </div>
                      )}

                      {item.fileType === "audio" && (
                        <div className="p-2">
                          <AudioPlayer src={item.fileUrl} />
                        </div>
                      )}

                      {item.fileType === "video" && (
                        <video
                          src={item.fileUrl}
                          playsInline
                          preload="metadata"
                          controls
                          className="w-full"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
