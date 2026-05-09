import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { createPortal } from "react-dom";

interface EvidenceItem {
  authorName: string;
  authorPhoto: string;
  content?: string;
  fileUrl?: string;
  fileType: string;
}

interface EvidenceBoardProps {
  items: EvidenceItem[];
  isVisible: boolean;
  innerRef: React.RefObject<HTMLDivElement | null>; // For the scroll-to effect
}

export const EvidenceBoard = ({
  items,
  isVisible,
  innerRef,
}: EvidenceBoardProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <AnimatePresence>
        {isVisible && items.length > 0 && (
          <motion.div
            ref={innerRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 bg-black/20"
          >
            <div className="space-y-4 p-6">
              <h4 className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">
                The Evidence Board
              </h4>

              {items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-inner"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <img
                      src={item.authorPhoto}
                      className="h-6 w-6 rounded-full border border-white/20"
                      alt=""
                    />
                    <span className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                      {item.authorName} filed a report:
                    </span>
                  </div>

                  {item.content && (
                    <p className="mb-3 text-sm leading-relaxed text-white">
                      "{item.content}"
                    </p>
                  )}

                  {item.fileType === "image" && (
                    /* Wrap image in a zoom-in cursor div and add onClick */
                    <div
                      className="group/img relative cursor-zoom-in overflow-hidden rounded-lg"
                      onClick={() => setSelectedImage(item.fileUrl || null)}
                    >
                      <img
                        src={item.fileUrl}
                        className="max-h-80 w-full bg-black/40 object-contain transition-transform duration-500 group-hover/img:scale-105"
                        alt="Evidence"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                        <span className="rounded-full bg-white/20 px-4 py-2 text-[10px] font-bold tracking-widest text-white uppercase backdrop-blur-md">
                          View Full Receipt
                        </span>
                      </div>
                    </div>
                  )}

                  {item.fileType === "video" && (
                    <video
                      src={item.fileUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full rounded-lg shadow-lg"
                    />
                  )}
                  {item.fileType === "audio" && (
                    <div className="rounded-lg bg-slate-800/50 p-2">
                      <audio
                        src={item.fileUrl}
                        controls
                        playsInline
                        className="h-8 w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. LIGHTBOX OVERLAY */}
      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedImage(null)}
                className="fixed inset-0 z-9999 flex h-screen w-screen cursor-zoom-out items-center justify-center bg-slate-950/95 p-4 backdrop-blur-xl"
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
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};
