"use client";

import { useState, useEffect } from "react";
import { auth, firestore } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import LoadingScreen from "@/app/components/loading/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        // Check if the user is an admin
        const adminDocRef = doc(firestore, "users", "user_roles", "admin", user.email!);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists() && adminDocSnap.data()?.role === "admin") {
          // Allow access to the dashboard
          setLoading(false);
        } else {
          // If the user is not an admin, redirect to the sign-in page
          await auth.signOut();
          router.push("/signin");
        }
      } else {
        // If the user is not signed in, redirect to the sign-in page
        router.push("/signin");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (!isMounted || loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}