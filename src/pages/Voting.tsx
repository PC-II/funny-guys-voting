import { useState, useEffect, useRef } from "react";
import {
  doc,
  updateDoc,
  getDoc,
  query,
  collection,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../utils/firebase";
import { MyNavbar } from "../components/MyNavbar";
import { Button, Card } from "flowbite-react";
import { motion, AnimatePresence } from "framer-motion";
import categories from "../utils/categories";
import nominees from "../utils/nominees";
import { useCountdown } from "../hooks/useCountDown";
import { useNavigate } from "react-router-dom";
import { EvidenceBoard } from "../components/EvidenceBoard";

export default () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);
  const evidenceListRef = useRef<HTMLDivElement>(null);
  const { isVotingClosed, activeYear } = useCountdown();
  const currentCategory = categories[currentStep];

  useEffect(() => {
    const q = query(
      collection(db, "polls", String(activeYear), "evidence"),
      where("categoryId", "==", currentCategory.id),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvidence(snapshot.docs.map((doc) => doc.data()));
    });

    // Reset toggle when moving to a new category so it's fresh
    setShowEvidence(false);

    return () => unsubscribe();
  }, [currentCategory.id, activeYear]);

  const scrollToEvidence = () => {
    setShowEvidence(true);
    setTimeout(() => {
      evidenceListRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (isVotingClosed) {
      navigate("/home"); // Boot them out if the polls are closed
    }
  }, [isVotingClosed]);

  // Load existing votes if they have any
  useEffect(() => {
    const loadVotes = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(
        db,
        "polls",
        String(activeYear),
        "ballots",
        auth.currentUser.uid,
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const savedResponses = docSnap.data().responses || {};
        setSelections(savedResponses);

        const savedCount = Object.keys(savedResponses).length;

        if (savedCount > 0) {
          // If they finished all, keep them at the last page
          // Otherwise, set the step to the count (e.g., if 3 answered, index is 3 which is the 4th item)
          const nextStep =
            savedCount >= categories.length
              ? categories.length - 1
              : savedCount;
          setCurrentStep(nextStep);
        }
      }
      setIsInitialLoad(false);
    };
    loadVotes();
  }, []);

  // Prevent rendering the voting UI until we know which step they are on
  if (isInitialLoad) {
    return (
      <main className="relative flex min-h-screen w-full items-center justify-center bg-slate-900">
        <div className="animate-pulse font-mono text-blue-400">
          Resuming your progress...
        </div>
      </main>
    );
  }

  const handleSelect = async (nominee: string) => {
    if (!auth.currentUser) return;
    setIsSaving(true);

    const newSelections = { ...selections, [currentCategory.id]: nominee };
    setSelections(newSelections);

    // Save to Firestore immediately (Drafting mode)
    const userRef = doc(
      db,
      "polls",
      String(activeYear),
      "ballots",
      auth.currentUser.uid,
    );

    await updateDoc(userRef, {
      responses: newSelections,
      lastUpdated: new Date(),
      // If it's the last question, you can auto-mark as completed
      status:
        Object.keys(newSelections).length === categories.length
          ? "completed"
          : "in-progress",
    });

    setIsSaving(false);

    // Auto-advance after a short delay for feedback
    if (currentStep < categories.length - 1) {
      setTimeout(() => setCurrentStep((prev) => prev + 1), 200);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-900">
      <MyNavbar />

      {/* Background Blobs */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-2xl px-6 pt-10 pb-20">
        {/* Progress Tracker (Mini) */}
        <div className="mb-8 flex flex-col items-center justify-between space-y-2">
          <span className="font-mono text-sm tracking-widest text-blue-400 uppercase">
            Category {currentStep + 1} of {categories.length}
          </span>
          <div className="flex flex-wrap gap-1">
            {categories.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= currentStep ? "bg-blue-500" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="rounded-3xl border-white/10 bg-white/5 p-2! shadow-2xl backdrop-blur-xl">
              <div className="p-6">
                <h1 className="mb-2 text-3xl font-bold text-white">
                  {currentCategory.title}
                </h1>
                <p className="mb-4 text-slate-400">
                  {currentCategory.description}
                </p>

                {evidence.length > 0 && (
                  <button
                    onClick={scrollToEvidence}
                    className="mb-6 flex animate-pulse cursor-pointer items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/30 active:scale-95"
                  >
                    <span className="text-sm">📂</span>
                    {evidence.length} PIECE{evidence.length > 1 ? "S" : ""} OF
                    EVIDENCE FOUND
                  </button>
                )}

                <div className="grid grid-cols-1 gap-3">
                  {nominees.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleSelect(name)}
                      disabled={isSaving}
                      className={`group flex w-full cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                        selections[currentCategory.id] === name
                          ? "border-blue-500 bg-blue-600/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                          : "border-white/5 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-lg font-medium">{name}</span>
                      {selections[currentCategory.id] === name && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                          <svg
                            className="h-4 w-4 text-white"
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
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <EvidenceBoard
                items={evidence}
                isVisible={showEvidence}
                innerRef={evidenceListRef}
              />

              <div className="flex justify-between border-t border-white/5 p-4">
                <Button
                  color="gray"
                  pill
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentStep === 0}
                  className="cursor-pointer border-white/10 bg-transparent text-white"
                >
                  Back
                </Button>
                {currentStep === categories.length - 1 && (
                  <Button pill href="#/home" className="cursor-pointer">
                    Finish Ballot
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
      {currentStep === categories.length - 1 && (
        <button
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
          className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-md transition-all hover:scale-110 hover:bg-white/20 active:scale-95"
          aria-label="Scroll to bottom"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </main>
  );
};
