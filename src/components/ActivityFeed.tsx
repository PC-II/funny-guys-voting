import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "../hooks/useCountDown";
import { useNavigate } from "react-router-dom";

interface Activity {
  createdAt: any;
  id: string;
  displayName: string;
  photoURL: string;
  status: string;
  lastUpdated: any;
  type: "ballot" | "evidence";
}

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeYear } = useCountdown();
  const navigate = useNavigate();

  const handleActivityClick = (type: "ballot" | "evidence") => {
    if (type === "evidence") {
      navigate("/vault");
    } else {
      navigate("/voting");
    }
  };

  useEffect(() => {
    // 1. Query Ballots
    const qBallots = query(
      collection(db, "polls", String(activeYear), "ballots"),
      orderBy("lastUpdated", "desc"),
      limit(5),
    );

    // 2. Query Evidence
    const qEvidence = query(
      collection(db, "polls", String(activeYear), "evidence"),
      orderBy("timestamp", "desc"),
      limit(5),
    );

    let ballotData: Activity[] = [];
    let evidenceData: Activity[] = [];

    const updateCombinedFeed = () => {
      const combined = [...ballotData, ...evidenceData]
        .sort((a, b) => b.lastUpdated - a.lastUpdated) // Sort by newest first
        .slice(0, 8); // Keep top 8 total
      setActivities(combined);
      setLoading(false);
    };

    const unsubBallots = onSnapshot(qBallots, (snap) => {
      ballotData = snap.docs.map((d) => ({
        createdAt: d.data().createdAt,
        id: d.id,
        displayName: d.data().displayName,
        photoURL: d.data().photoURL,
        status: d.data().status,
        lastUpdated: d.data().lastUpdated?.seconds || 0,
        type: "ballot",
      }));
      updateCombinedFeed();
    });

    const unsubEvidence = onSnapshot(qEvidence, (snap) => {
      evidenceData = snap.docs.map((d) => ({
        createdAt: d.data().createdAt,
        id: d.id,
        displayName: d.data().authorName, // Note: field name differs in evidence
        photoURL: d.data().authorPhoto, // Note: field name differs in evidence
        status: "evidence_filed",
        lastUpdated: d.data().timestamp?.seconds || 0,
        type: "evidence",
      }));
      updateCombinedFeed();
    });

    return () => {
      unsubBallots();
      unsubEvidence();
    };
  }, [activeYear]);

  const getActivityDetails = (user: Activity) => {
    if (user.status === "evidence_filed") {
      return {
        label: "Filed Evidence",
        color: "text-red-500",
        dot: "bg-red-500 shadow-[0_0_10px_#ef4444]",
      };
    }

    const created = user.createdAt?.seconds || 0;
    const updated = user.lastUpdated || 0;

    const isNewJoin = created > 0 && Math.abs(updated - created) < 5;

    if (isNewJoin) {
      return {
        label: "Joined the chaos",
        color: "text-purple-400",
        dot: "bg-purple-500 shadow-[0_0_8px_#a855f7]",
      };
    }

    if (user.status === "completed") {
      return {
        label: "Finished voting",
        color: "text-green-400",
        dot: "bg-green-500 shadow-[0_0_8px_#22c55e]",
      };
    }

    return {
      label: "Updated ballot",
      color: "text-blue-400",
      dot: "bg-blue-500 shadow-[0_0_8px_#3b82f6]",
    };
  };

  if (loading) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="px-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
        Live Activity
      </h3>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activities.map((user) => {
            const details = getActivityDetails(user);

            return (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                /* --- INTERACTIVE LOGIC --- */
                onClick={() => handleActivityClick(user.type)}
                className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-white/20 hover:bg-white/10 active:scale-95"
              >
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-10 w-10 rounded-full border border-white/20 shadow-lg"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">
                    {user.displayName?.split(" ")[0]}
                  </span>
                  <span
                    className={`text-[10px] font-black tracking-wider uppercase ${details.color}`}
                  >
                    {details.label}
                  </span>
                </div>

                {/* Visual Arrow to hint clickability */}
                <div className="ml-auto flex items-center gap-3">
                  <div
                    className={`h-2 w-2 animate-pulse rounded-full ${details.dot}`}
                  />
                  <svg
                    className="h-4 w-4 text-slate-600 transition-colors group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
