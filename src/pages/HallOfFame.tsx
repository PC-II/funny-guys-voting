import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../utils/firebase"; // Ensure this path is correct
import { motion } from "framer-motion";
import { Card } from "flowbite-react";
import { MyNavbar } from "../components/MyNavbar";

interface HistoricalWinner {
  categoryTitle: string;
  winnerNames: string[];
  votes: number;
}

interface YearlyResult {
  year: number;
  winners: HistoricalWinner[];
}

export default () => {
  const [archive, setArchive] = useState<YearlyResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        // Query the hall_of_fame collection ordered by year descending
        const q = query(
          collection(db, "hall_of_fame"),
          orderBy("year", "desc"),
        );
        const querySnapshot = await getDocs(q);

        const fetchedData = querySnapshot.docs.map((doc) => ({
          ...(doc.data() as YearlyResult),
        }));

        setArchive(fetchedData);
      } catch (error) {
        console.error("Error fetching Hall of Fame:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHallOfFame();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 font-mono text-yellow-500 italic">
        Polishing the trophies...
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-slate-950 pb-32">
      <MyNavbar />

      {/* Global Golden Glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-yellow-600/10 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-24 md:pt-32">
        <header className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 inline-block rounded-full border border-yellow-500/30 bg-yellow-500/5 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="font-mono text-[10px] font-bold tracking-[0.4em] text-yellow-500 uppercase">
              The Digital Archives
            </span>
          </motion.div>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic md:text-8xl">
            Hall of{" "}
            <span className="bg-linear-to-b from-yellow-200 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
              Fame
            </span>
          </h1>
        </header>

        <div className="space-y-32">
          {archive.map((period) => {
            // SEPARATION LOGIC:
            // Standard winners are everything EXCEPT the last one.
            // The "Funny Guy of the Year" is the very last item.
            const standardWinners = period.winners.slice(0, -1);
            const funnyGuy = period.winners[period.winners.length - 1];

            return (
              <section key={period.year} className="relative">
                {/* Year Header */}
                <div className="mb-12 flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] font-black tracking-tighter text-yellow-600 uppercase">
                      Season
                    </span>
                    <h2 className="text-5xl font-black text-white">
                      {period.year}
                    </h2>
                  </div>
                  <div className="h-px flex-1 bg-linear-to-r from-yellow-500/50 via-yellow-500/10 to-transparent" />
                </div>

                {/* Standard Winners Grid */}
                <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {standardWinners.map((winner, idx) => {
                    const isTie = winner.winnerNames.length > 1;
                    return (
                      <motion.div
                        key={`${period.year}-${winner.categoryTitle}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Card className="group relative overflow-hidden border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-yellow-500/40">
                          <div className="relative z-10 flex flex-col items-center py-6 text-center">
                            <div className="mb-4 text-2xl drop-shadow-md">
                              {isTie ? "⚔️" : "👑"}
                            </div>
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase">
                              {winner.categoryTitle}
                            </h3>
                            <p className="mt-3 text-2xl font-black text-white group-hover:text-yellow-400">
                              {winner.winnerNames.join(" & ")}
                            </p>
                            <div className="mt-6 flex w-full items-center justify-center gap-2 border-t border-white/10 pt-4">
                              <span className="font-mono text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                                {isTie
                                  ? `Tied at ${winner.votes} Votes`
                                  : `Final Count: ${winner.votes} Votes`}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Funny Guy of the Year */}
                {funnyGuy && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative mt-20"
                  >
                    {/* Backdrop Shine */}
                    <div className="absolute inset-0 -z-10 flex items-center justify-center">
                      <div className="h-64 w-full max-w-2xl animate-pulse bg-yellow-500/20 blur-[120px]" />
                    </div>

                    <Card className="group relative overflow-hidden border-yellow-500/30 bg-slate-900/40 py-12 shadow-[0_0_50px_rgba(234,179,8,0.15)] backdrop-blur-2xl transition-all duration-700 hover:border-yellow-500/60">
                      {/* Shimmer Border/Edge Effect */}
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute inset-0 translate-x-[-150%] skew-x-[-25deg] animate-[shimmer_6s_infinite] bg-linear-to-r from-transparent via-yellow-500/10 to-transparent" />
                      </div>

                      <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-yellow-300 to-orange-600 text-4xl shadow-lg">
                          {funnyGuy.winnerNames.length > 1 ? "⚔️" : "🏆"}
                        </div>

                        <motion.h3
                          animate={{
                            letterSpacing: ["0.4em", "0.5em", "0.4em"],
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="text-xs font-black tracking-[0.4em] text-yellow-500 uppercase md:text-sm"
                        >
                          {funnyGuy.categoryTitle}
                        </motion.h3>

                        <p className="mt-6 text-5xl font-black text-white italic transition-all group-hover:scale-105 group-hover:text-yellow-200 md:text-7xl lg:text-8xl">
                          {funnyGuy.winnerNames.join(" & ")}
                        </p>

                        <div className="mt-10 flex w-full max-w-md items-center justify-center gap-4 border-t border-white/10 pt-8">
                          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-yellow-500" />
                          <span className="font-mono text-xs font-bold tracking-[0.3em] text-slate-400 uppercase">
                            Legacy Score: {funnyGuy.votes} Votes
                          </span>
                          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-yellow-500" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
};
