import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useEffect, useState } from "react"; // Added useState
import { useCountdown } from "../hooks/useCountDown";

// Define what a Friend looks like for TypeScript
interface Friend {
  id: string;
  displayName?: string;
  photoURL?: string;
  status?: string;
}

export const WallOfShame = () => {
  // 1. Initialize the state
  const [friends, setFriends] = useState<Friend[]>([]);
  const { activeYear } = useCountdown();

  useEffect(() => {
    const ballotsRef = collection(db, "polls", String(activeYear), "ballots");

    const unsubscribe = onSnapshot(ballotsRef, (querySnapshot) => {
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Friend[];

      setFriends(usersList);
    });

    return () => unsubscribe();
  }, [activeYear]);

  return (
    <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-md">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Voter Status</h3>
          <p className="text-sm text-slate-400">
            Who's contributing and who's slacking?
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-3xl font-bold text-blue-400">
            {/* 2. Updated filter to check for "completed" status */}
            {friends.filter((f) => f.status === "completed").length}/
            {friends.length}
          </span>
          <p className="text-[10px] tracking-widest text-slate-500 uppercase">
            Ballots In
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {friends.map((friend) => {
          // 3. Helper variable for cleaner JSX
          const hasVoted = friend.status === "completed";

          return (
            <div key={friend.id} className="group flex flex-col items-center">
              <div className="relative">
                <img
                  src={friend.photoURL}
                  alt={friend.displayName}
                  className={`h-16 w-16 rounded-2xl border-2 transition-all duration-500 ${
                    hasVoted
                      ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)] grayscale-0"
                      : "border-white/10 opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                  }`}
                />

                <div
                  className={`absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900 ${
                    hasVoted ? "bg-green-500" : "bg-slate-700"
                  }`}
                >
                  {hasVoted ? (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-[10px] text-white">⏳</span>
                  )}
                </div>
              </div>

              <p
                className={`mt-3 text-sm font-medium transition-colors ${
                  hasVoted ? "text-white" : "text-slate-500"
                }`}
              >
                {friend.displayName || "Unknown Guy"}
              </p>
            </div>
          );
        })}
      </div>

      {friends.some((f) => f.status !== "completed") && (
        <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-center text-xs font-medium text-red-400 italic">
            "Some of y'all can't finish your votes - definitely broke boy energy
            there."
          </p>
        </div>
      )}
    </div>
  );
};
