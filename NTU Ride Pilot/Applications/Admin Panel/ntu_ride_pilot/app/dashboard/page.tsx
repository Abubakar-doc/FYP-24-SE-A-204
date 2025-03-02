"use client"
import DashboardLayout from './DashboardLayout';
import DashboardContent from '@/components/custom/DashboardContent/DashboardContent';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { auth } from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authenticatedUser) => {
      if (!authenticatedUser) {
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
    return null;
  }



  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
