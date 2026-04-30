import { auth, model } from "../utils/firebase";
import { useState } from "react";
import nominees from "../utils/nominees";

export default () => {
  const [isSending, setIsSending] = useState(false);

  const generateRoast = async () => {
    const nomineeList = nominees.join(", ");

    try {
      const prompt = `
        Context: You're meant to be instigating a friend group in Discord.
        Roastees: ${nomineeList}
        Task: Instigate an argument between two of the roastees. 
        Style: Daniel Tosh like, brutal but not personal, with similes, under 30 words, use emojis. 
        Something the dudes would like; immature with sex, or talking shit about skills, or similar.
        Don't be afraid to swear or be out of pocket. We play a lot of video games.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;

      const text = response.text();

      console.log("AI Output:", text);
      return text;
    } catch (err) {
      console.error("AI Logic Error:", err);
      return "is just generally a menace to society. 💀";
    }
  };

  const handleInstigate = async () => {
    setIsSending(true);
    const userName = auth.currentUser?.displayName;

    // 1. Generate the roast
    const aiRoast = await generateRoast();

    const botUrl = import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://bot.funny-guys-host.win";

    try {
      // 2. Send both the User Name AND the AI Roast
      const response = await fetch(`${botUrl}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          action: "instigate",
          customMessage: aiRoast,
        }),
      });

      if (response.ok) {
        console.log(`Successfully reached the Host at ${botUrl}`);
      }
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setTimeout(() => setIsSending(false), 1000);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center space-y-4">
      {/* Subtle Divider to separate from Activity Feed */}
      <div className="h-px w-full max-w-md bg-linear-to-r from-transparent via-white/10 to-transparent" />

      <div className="group relative">
        {/* Animated Glow Backdrop */}
        <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-red-600 to-pink-600 opacity-25 blur-lg transition duration-1000 group-hover:opacity-75 group-hover:duration-200" />

        <button
          onClick={handleInstigate}
          disabled={isSending}
          className={`relative flex cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl px-8 py-4 transition-all duration-300 active:scale-95 ${
            isSending
              ? "cursor-not-allowed bg-slate-800 text-slate-500"
              : "border border-white/10 bg-slate-950 text-white shadow-2xl hover:border-red-500/50"
          }`}
        >
          {/* Inner Shimmer Effect */}
          {!isSending && (
            <div className="animate-shimmer absolute inset-0 z-10 w-full bg-linear-to-r from-transparent via-red-500/20 to-transparent" />
          )}

          <span
            className={`text-2xl transition-transform ${isSending ? "animate-spin" : "group-hover:rotate-12"}`}
          >
            {isSending ? "⏳" : "🔥"}
          </span>

          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black tracking-[0.3em] text-red-500 uppercase">
              Agent of Chaos
            </span>
            <span className="text-xl font-black tracking-tight italic">
              {isSending ? "INSTIGATING..." : "INSTIGATE"}
            </span>
          </div>
        </button>
      </div>

      <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">
        Let's stir the pot in Discord
      </p>
    </div>
  );
};
