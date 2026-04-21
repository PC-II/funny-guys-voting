// components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../utils/firebase";
import { useEffect, useState } from "react";

export const ProtectedRoute = () => {
  // Using a simple state check here for example purposes
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <main className="relative flex min-h-screen w-full items-center justify-center bg-slate-900">
        <div className="animate-pulse font-mono text-blue-400">Loading...</div>
      </main>
    );

  // If no user, redirect to login.
  // Otherwise, render the "Outlet" (the child routes)
  return user ? <Outlet /> : <Navigate to="/SignIn" replace />;
};
