// "use client";

// import { useState } from "react";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth, firestore } from "@/lib/firebase";
// import { doc, getDoc } from "firebase/firestore";
// import { useRouter } from "next/navigation";

// export default function SignIn() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleSignIn = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       // Authenticate user
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       if (user) {
//         // Check Firestore for admin role
//         const adminDocRef = doc(firestore, "users", "user_roles", "admin", email);
//         const adminDocSnap = await getDoc(adminDocRef);

//         if (adminDocSnap.exists() && adminDocSnap.data()?.role === "admin") {
//           // Redirect to dashboard only if the user is an admin
//           router.push("/dashboard");
//         } else {
//           // If the user is not an admin, show an error and sign them out
//           setError("Unauthorized: You are not an admin.");
//           await auth.signOut();
//         }
//       }
//     } catch (err: any) {
//       setError("Invalid email or password.");
//       console.error("Error signing in:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <h1>Sign In</h1>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//       <form onSubmit={handleSignIn}>
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <button type="submit" disabled={loading}>
//           {loading ? "Checking..." : "Sign In"}
//         </button>
//       </form>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if user is already authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Check if user is an admin before redirecting
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Check Firestore for admin role
        const adminDocRef = doc(firestore, "users", "user_roles", "admin", email);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists() && adminDocSnap.data()?.role === "admin") {
          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          setError("Unauthorized: You are not an admin.");
          await auth.signOut(); // Sign out if not admin
        }
      }
    } catch (err: any) {
      setError("Invalid email or password.");
      console.error("Error signing in:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Sign In</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
