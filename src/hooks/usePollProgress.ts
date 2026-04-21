import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../utils/firebase";
import { useCountdown } from "./useCountDown";

export const usePollProgress = () => {
  const { activeYear } = useCountdown();

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Path is now dynamic based on your global config year
    const userRef = doc(
      db,
      "polls",
      String(activeYear),
      "ballots",
      auth.currentUser.uid,
    );

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const responseCount = Object.keys(data.responses || {}).length;
          setProgress(responseCount);
          setStatus(data.status || "draft");
        } else {
          setProgress(0);
          setStatus("not-started");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Poll Progress Error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [activeYear, auth.currentUser]); // Re-run if year changes or user logs in/out

  return { progress, status, loading };
};
