import { MyNavbar } from "../components/MyNavbar";
import { WallOfShame } from "../components/WallOfShame";
import { Button } from "flowbite-react";
import { usePollProgress } from "../hooks/usePollProgress";
import { useNavigate } from "react-router-dom";
import categories from "../utils/categories";
import { CountdownTimer } from "../components/CountdownTimer";
import { useCountdown } from "../hooks/useCountDown";
import { ActivityFeed } from "../components/ActivityFeed";
import { provisionUserForYear } from "../utils/provisionUser";
import { auth } from "../utils/firebase";
import { useEffect } from "react";

export default () => {
  const navigate = useNavigate();
  const { progress, status, loading } = usePollProgress();
  const totalQuestions = categories.length;
  const progressPercent = (progress / totalQuestions) * 100;
  const hasFinished = status === "completed";
  const { isVotingClosed, isResultsEra, activeYear } = useCountdown();

  useEffect(() => {
    if (auth.currentUser && activeYear) {
      provisionUserForYear(auth.currentUser, activeYear);
    }
  }, [activeYear, auth.currentUser]);

  if (loading)
    return (
      <main className="relative flex min-h-screen w-full items-center justify-center bg-slate-900">
        <div className="animate-pulse font-mono text-blue-400">
          Loading the Chaos...
        </div>
      </main>
    );

  return (
    <main className="relative min-h-screen w-full bg-slate-950 pb-20">
      <MyNavbar />

      {/* Background Decorations (The Blobs) */}
      <div className="pointer-events-none fixed top-20 -left-20 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none fixed -right-20 bottom-10 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-12">
        {/* Countdown */}
        <CountdownTimer />

        {/* Results Button */}
        {isResultsEra && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => navigate("/results")}
              className="group relative flex items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-yellow-300 via-yellow-500 to-orange-600 px-10 py-5 shadow-[0_20px_50px_rgba(234,179,8,0.3)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-yellow-500/50 active:scale-95"
            >
              {/* Animated Shimmer Streak */}
              <div className="absolute inset-0 z-10 w-full translate-x-[-150%] skew-x-[-20deg] animate-[shimmer_3s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent" />

              {/* Subtle Inner Glow for depth */}
              <div className="pointer-events-none absolute inset-px rounded-[14px] border border-white/20 bg-linear-to-b from-white/10 to-transparent" />

              <div className="relative z-20 flex items-center gap-4">
                <span className="text-3xl drop-shadow-sm">🏆</span>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black tracking-[0.3em] text-orange-950/60 uppercase">
                    {activeYear} Finals
                  </span>
                  <span className="text-2xl font-black tracking-tight text-white italic drop-shadow-md">
                    VIEW RESULTS
                  </span>
                </div>
                <svg
                  className="h-6 w-6 text-white transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Floating Frosty Hero Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl md:p-12">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex-1 space-y-2">
              <h2 className="text-sm font-semibold tracking-widest text-blue-400 uppercase">
                Current Progress
              </h2>
              <h1 className="text-4xl font-bold text-white">
                {hasFinished
                  ? "Ballot Submitted! 🎉"
                  : `The ${activeYear} Polls`}
              </h1>
              <p className="text-lg text-slate-400">
                {hasFinished
                  ? "Your votes are locked in. Sit back and watch the chaos."
                  : `You've completed ${progress} out of ${totalQuestions} categories.`}
              </p>
            </div>

            {/* Action Button */}
            <Button
              size="xl"
              pill
              className={`transform shadow-xl transition-all duration-300 hover:scale-105 ${
                isResultsEra
                  ? "cursor-pointer border-none bg-linear-to-r from-yellow-400 to-orange-500" // Golden look for results
                  : isVotingClosed && !isResultsEra
                    ? "cursor-not-allowed bg-slate-700 opacity-50" // Off-season look
                    : "cursor-pointer border-none bg-linear-to-r from-blue-500 to-purple-600" // Voting look
              }`}
              onClick={() => {
                if (isResultsEra) navigate("/results");
                else if (!isVotingClosed) navigate("/voting");
              }}
            >
              <span className="px-4 py-1 text-xl font-bold italic">
                {isResultsEra
                  ? "VIEW RESULTS"
                  : isVotingClosed
                    ? "POLLS CLOSED"
                    : !hasFinished
                      ? "VOTE NOW"
                      : "CHANGE VOTE"}
              </span>
            </Button>
          </div>

          {/* Frosty Progress Bar Section */}
          <div className="mt-10">
            <div className="mb-2 flex justify-between text-sm font-medium text-slate-300">
              <span>Overall Completion</span>
              <span>{(Number(progressPercent) || 0).toFixed(1)}%</span>
            </div>

            {/* Custom Styled Flowbite Progress */}
            <div className="h-4 w-full overflow-hidden rounded-full border border-white/5 bg-white/10 p-1">
              <div
                className="h-full rounded-full bg-linear-to-r from-blue-400 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* The Wall Of Shame */}
        <WallOfShame />

        {/* "Activity" cards later */}
        <div className="mt-12 flex justify-center pb-20">
          <div className="w-full max-w-2xl">
            {!isResultsEra ? (
              <ActivityFeed />
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
                <div className="text-4xl">🔒</div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Polls are Archived
                  </h3>
                  <p className="mt-1 text-slate-500">
                    Live activity is hidden during the Results Era.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
