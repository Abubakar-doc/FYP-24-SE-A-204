// export default function Home() {
//   return (
//     <h1>Home Page</h1>
//   )
// }


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, firestore } from "@/lib/firebase"; // Assuming firestore is initialized here
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Add Firestore functions

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is an admin (add your admin role check here)
        const adminDocRef = doc(firestore, "users", "user_roles", "admin", user.email!); // Ensure you query correctly
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists() && adminDocSnap.data()?.role === "admin") {
          // If user is an admin, redirect to /dashboard
          router.push("/dashboard");
        } else {
          // If user is logged in but not an admin, stay on the homepage
          // Optionally, you could display a message like "You are not authorized to access the dashboard"
        }
      }
    });

    return () => unsubscribe(); // Cleanup the subscription
  }, [router]);

  return (
    <div>
      <h1>Redirecting to NTU-Ride-Pilot Admin Panel...</h1>
    </div>
  );
}
