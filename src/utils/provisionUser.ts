import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "firebase/auth";

export const provisionUserForYear = async (user: User, year: number) => {
  if (!user) return;

  const userRef = doc(db, "polls", String(year), "ballots", user.uid);
  const docSnap = await getDoc(userRef);

  // If the document doesn't exist for this year, create the "base" profile
  if (!docSnap.exists()) {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        email: user.email,
        photoURL: user.photoURL,
        status: "not-started",
        responses: {},
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      },
      { merge: true },
    );
  }
};
