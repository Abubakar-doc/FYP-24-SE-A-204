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
import Image from "next/image";

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
    <div className="flex h-screen">
      {/* Left Section with Sign-in Form */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="w-[350px]">
          <h2 className="text-2xl font-bold text-center">Welcome Back!</h2>
          <p className="text-gray-500 text-center mt-1">Only authorized administration can sign in</p>

          {error && <p className="text-red-500 text-center mt-3">{error}</p>}

          <form onSubmit={handleSignIn} className="mt-6">
            <div>
              <label className="block text-gray-600 text-sm">Email</label>
              <input
                type="email"
                placeholder="hassan@mail.com"
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-gray-600 text-sm">Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="**********"
                  className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="absolute right-3 top-3 cursor-pointer">🔒</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 mt-6 rounded-md hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? "Checking..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

{/* Right Section with Background and Centered Content */}
<div className="w-1/2 bg-[#0078D7] flex items-center justify-center m-6 rounded-lg shadow-lg p-6">
  <div className="text-center">
    <Image src="/images/mobile_app_mockup.png" alt="NTU Ride Pilot" width={400} height={400} />
    <h2 className="text-white text-2xl font-bold mt-4">NTU RIDE PILOT</h2>
  </div>
</div>




    </div>
  );
}
