import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import categories from "./categories";

export const runAutoArchive = async (year: string) => {
  const archiveRef = doc(db, "hall_of_fame", year);

  try {
    // 1. CHECK: Has this year already been archived?
    const docSnap = await getDoc(archiveRef);
    if (docSnap.exists()) {
      return; // Already archived, exit silently
    }

    // 2. FETCH: Get all ballots for the year
    // Path: polls/{year}/ballots
    const ballotsSnapshot = await getDocs(
      collection(db, "polls", year, "ballots"),
    );

    if (ballotsSnapshot.empty) {
      console.log(`System: No ballots found for ${year}. Skipping archive.`);
      return;
    }

    const ballots = ballotsSnapshot.docs.map((doc) => doc.data());

    // 3. CALCULATE: Tally results from the 'responses' field
    const winners = categories.map((category) => {
      const voteCounts: Record<string, number> = {};

      ballots.forEach((ballot) => {
        // Accessing ballot.responses["q1"] etc based on category.id
        const selection = ballot.responses?.[category.id];

        if (selection && typeof selection === "string") {
          voteCounts[selection] = (voteCounts[selection] || 0) + 1;
        }
      });

      // Determine the winner(s)
      const counts = Object.values(voteCounts);
      const maxVotes = counts.length > 0 ? Math.max(...counts) : 0;

      const winnerNames = Object.keys(voteCounts).filter(
        (name) => voteCounts[name] === maxVotes && maxVotes > 0,
      );

      return {
        categoryTitle: category.title,
        winnerNames:
          winnerNames.length > 0 ? winnerNames : ["No Votes Recorded"],
        votes: maxVotes,
      };
    });

    // 4. WRITE: Save to Hall of Fame
    await setDoc(archiveRef, {
      year: parseInt(year),
      winners: winners, // Array of { categoryTitle, winnerNames[], votes }
      totalParticipants: ballots.length,
      archivedAt: new Date().toISOString(),
    });

    console.log(
      `System: ${year} results have been automatically archived to the Hall of Fame.`,
    );
  } catch (e) {
    console.error("Auto-archive error:", e);
  }
};
