import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { Button, Card } from "flowbite-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../utils/firebase";

const SignIn = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/home");
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userBallotRef = doc(db, "polls", "2026", "ballots", user.uid);

      // Check if the document exists first
      const docSnap = await getDoc(userBallotRef);

      if (!docSnap.exists()) {
        // Create the document immediately on first login
        await setDoc(userBallotRef, {
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
          status: "in-progress", // Default status
          responses: {}, // Empty votes
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
        console.log("New ballot created for:", user.displayName);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900">
      {/* Background Blobs */}
      <div className="animate-blob absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-500 opacity-20 mix-blend-multiply blur-xl filter"></div>
      <div className="animate-blob animation-delay-2000 absolute top-0 -right-4 h-72 w-72 rounded-full bg-blue-500 opacity-20 mix-blend-multiply blur-xl filter"></div>
      <div className="animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-pink-500 opacity-20 mix-blend-multiply blur-xl filter"></div>

      {/* Frosty Card */}
      <Card className="z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-0! shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center pt-6 pb-8">
          {/* Replacement for Lucide Icon (Simple Keyhole SVG) */}
          <div className="mb-6 rounded-full border border-white/30 bg-white/10 p-4">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Funny Guys <span className="text-blue-400">Voting</span>
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Sign in to access the voting dashboard.
          </p>
        </div>

        <div className="space-y-4 px-6 pb-8">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 focus:ring-4 focus:ring-blue-500/50"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </div>
          </Button>

          <div className="border-t border-white/10 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Only authorized "Funny Guys" can enter.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignIn;
