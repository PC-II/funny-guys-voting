import { useEffect, useState } from "react";
import { MyNavbar } from "../components/MyNavbar";
import InstigateButton from "../components/InstigateButton";
import DiscordHostSoundboard from "../components/DiscordHostSoundboard";
import SendVoiceToDiscord from "../components/SendVoiceToDiscord";

export default () => {
  const [loading, setLoading] = useState(true);
  const [isSystemLocked, setSystemLocked] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      try {
        // if we need to load anything first then put it here...
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

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
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-10">
        {/* Dynamic & Bold Title Header */}
        <header className="mb-10 flex flex-col items-center justify-between gap-8 border-b border-white/5 pb-10 md:flex-row md:items-end">
          <div className="text-center md:text-left">
            <div className="mb-2 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black tracking-[0.3em] text-blue-400 uppercase">
              Discord Control Center
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic md:text-8xl">
              Discord{" "}
              <span className="bg-linear-to-b from-white to-slate-500 bg-clip-text text-transparent">
                Host
              </span>
            </h1>
          </div>

          {/* Real-time Status Badge positioned where the action button would be */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-4 shadow-2xl backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  isSystemLocked ? "bg-red-500" : "bg-emerald-500"
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  isSystemLocked ? "bg-red-500" : "bg-emerald-500"
                }`}
              />
            </span>
            <span className="font-mono text-xs font-black tracking-[0.15em] text-slate-300 uppercase">
              {isSystemLocked ? "Pipeline Locked" : "Ready to Send"}
            </span>
          </div>
        </header>

        {/* Interaction Components */}
        <DiscordHostSoundboard
          isSystemLocked={isSystemLocked}
          setSystemLocked={setSystemLocked}
        />

        <SendVoiceToDiscord
          isSystemLocked={isSystemLocked}
          setSystemLocked={setSystemLocked}
        />

        <InstigateButton />
      </div>
    </main>
  );
};
