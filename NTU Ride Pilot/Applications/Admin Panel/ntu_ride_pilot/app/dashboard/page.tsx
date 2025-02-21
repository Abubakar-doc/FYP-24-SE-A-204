"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/ProtectedRoute";
import { User as FirebaseUser } from "firebase/auth";


export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authenticatedUser) => {
      setUser(authenticatedUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        {user && <p>Welcome, {user.email}!</p>}
        <button onClick={handleSignOut}>Sign Out</button>
       
      </div>
    </ProtectedRoute>
  );
}
