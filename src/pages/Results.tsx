import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { MyNavbar } from "../components/MyNavbar";
import categories from "../utils/categories";
import { Card } from "flowbite-react";
import { motion } from "framer-motion";
import { useCountdown } from "../hooks/useCountDown";
import { useNavigate } from "react-router-dom";
import { runAutoArchive } from "../utils/autoArchive";

interface Winner {
  categoryTitle: string;
  names: string[];
  votes: number;
}

export default () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const { isVotingClosed, isResultsEra } = useCountdown();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isVotingClosed) navigate("/home");
  }, [isVotingClosed]);

  useEffect(() => {
    if (isResultsEra) runAutoArchive(String(currentYear));
  }, [isResultsEra, currentYear]);

  useEffect(() => {
    const calculateResults = async () => {
      const ballotsRef = collection(db, "polls", "2026", "ballots");
      const querySnapshot = await getDocs(ballotsRef);

      const voteCounts: Record<string, Record<string, number>> = {};

      // Initialize counters for each category
      categories.forEach((cat) => {
        voteCounts[cat.id] = {};
      });

      // Tally the votes
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const responses = data.responses || {};

        Object.entries(responses).forEach(([catId, nomineeName]) => {
          if (voteCounts[catId]) {
            const name = nomineeName as string;
            voteCounts[catId][name] = (voteCounts[catId][name] || 0) + 1;
          }
        });
      });

      // Find the top name for each category
      const results: Winner[] = categories.map((cat) => {
        const counts = voteCounts[cat.id];
        const nomineeNames = Object.keys(counts);

        if (nomineeNames.length === 0) {
          return { categoryTitle: cat.title, names: ["No Votes"], votes: 0 };
        }

        // 1. Find the highest number of votes in this category
        const maxVotes = Math.max(...Object.values(counts));

        // 2. Get all names that have that many votes
        const winnersList = nomineeNames.filter(
          (name) => counts[name] === maxVotes,
        );

        return {
          categoryTitle: cat.title,
          names: winnersList,
          votes: maxVotes,
        };
      });

      setWinners(results);
      setLoading(false);
    };

    calculateResults();
  }, []);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 font-mono text-blue-400 italic">
        Calculating the 2026 legends...
      </div>
    );

  return (
    <main className="relative min-h-screen w-full bg-slate-900 pb-20">
      <MyNavbar />

      {/* Golden Background Glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-10">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black tracking-tighter text-white md:text-7xl">
            2026{" "}
            <span className="bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              WINNERS
            </span>
          </h1>
          <p className="mt-4 text-slate-400">
            The people have spoken. The results are final.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {winners.map((winner, index) => (
            <motion.div
              key={winner.categoryTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group border-white/10 bg-white/5 shadow-xl backdrop-blur-xl transition-all hover:border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                      {winner.categoryTitle}
                    </h3>
                    <p className="mt-1 text-2xl font-bold text-white transition-colors group-hover:text-yellow-400">
                      {winner.names.join(" & ")}
                    </p>
                    {winner.names.length > 1 && (
                      <span className="ml-2 inline-block rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                        TIE
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-slate-500">
                      {winner.votes} VOTES
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Closing Footnote */}
        <footer className="mt-20 text-center text-slate-600">
          <p className="text-sm italic">
            Generated by the Funny Guys Voting Committee • 2026
          </p>
        </footer>
      </div>
    </main>
  );
};
