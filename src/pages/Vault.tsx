import { useState } from "react";
import { MyNavbar } from "../components/MyNavbar";
import { useCountdown } from "../hooks/useCountDown";
import { FileEvidenceForm } from "../components/FileEvidenceForm";
import VaultFeed from "../components/VaultFeed";

export default () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { activeYear, isVotingClosed } = useCountdown();

  return (
    <main
      className={`relative min-h-screen bg-slate-950 pb-32 selection:bg-yellow-500/30 ${isFormOpen ? "h-screen overflow-hidden" : ""}`}
    >
      <MyNavbar />

      {/* --- AMBIENT BACKGROUND BLOBS --- */}
      <div className="pointer-events-none fixed top-20 -left-20 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none fixed -right-20 bottom-10 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 h-125 w-125 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-16">
        {/* --- HEADER SECTION --- */}
        <header className="mb-20 flex flex-col items-center justify-between gap-8 md:flex-row md:items-end">
          <div className="text-center md:text-left">
            <div className="mb-2 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase">
              Authenticated Access Only
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic md:text-8xl">
              The{" "}
              <span className="bg-linear-to-b from-white to-slate-500 bg-clip-text text-transparent">
                Vault
              </span>
            </h1>
            <p className="mt-4 font-mono text-sm tracking-[0.2em] text-slate-400 uppercase">
              Season {activeYear} // Certified Hood Classics
            </p>
          </div>

          {!isVotingClosed && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-yellow-300 via-yellow-500 to-orange-600 px-10 py-5 shadow-[0_20px_50px_rgba(234,179,8,0.3)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-yellow-500/50 active:scale-95"
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />

              <span className="flex items-center gap-3 text-sm font-black tracking-widest text-black uppercase">
                <PlusIcon /> File Evidence
              </span>
            </button>
          )}
        </header>

        {/* --- CONTENT SECTION --- */}
        <div className="relative">
          <VaultFeed activeYear={activeYear} />
        </div>
      </div>

      {/* --- DRAWER --- */}
      <FileEvidenceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        activeYear={activeYear}
      />
    </main>
  );
};

// Icon for the button
const PlusIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
