import { motion, AnimatePresence } from "framer-motion";

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
  return (
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
                  <img
                    src={item.fileUrl}
                    className="max-h-80 w-full rounded-lg bg-black/40 object-contain"
                    alt="Evidence"
                  />
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
  );
};
