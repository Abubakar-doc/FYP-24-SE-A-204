"use client"
import DashboardLayout from './DashboardLayout';
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { User as FirebaseUser } from "firebase/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authenticatedUser) => {
      if (!authenticatedUser) {
        // If user is not authenticated, redirect to sign-in page
        router.push("/signin");
      } else {
        setUser(authenticatedUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    // Prevent rendering dashboard if user is not authenticated
    return null;
  }

  return (
    <DashboardLayout user={user} handleSignOut={handleSignOut}>
      {/* Any additional content specific to this page */}
    </DashboardLayout>
  );
}