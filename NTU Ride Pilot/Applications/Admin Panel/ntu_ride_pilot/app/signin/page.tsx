"use client";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"; // Import icons

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [popupError, setPopupError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to track password visibility
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPopupError("");
    setLoading(true);

    try {
      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Check Firestore for admin role
        const adminDocRef = doc(firestore, "users", "user_roles", "admin", email);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists() && adminDocSnap.data()?.role === "admin") {
          // Redirect to dashboard only if the user is an admin
          router.push("/dashboard");
        } else {
          // If the user is not an admin, show a popup error and sign them out
          setPopupError("Unauthorized: You are not an admin.");
          await auth.signOut();
        }
      }
    } catch (err: any) {
      setPopupError("Invalid email or password.");
      console.error("Error signing in:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (popupError) {
      const timer = setTimeout(() => {
        setPopupError("");
      }, 4000); // Hide popup after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [popupError]);

  return (
    <div className="flex h-screen">
      {/* Left Section with Sign-in Form */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="w-[350px]">
          <h2 className="text-2xl font-bold text-center">Welcome Back!</h2>
          <p className="text-gray-500 text-center mt-1">Only authorized administration can sign in</p>

          {error && <p className="text-red-500 text-center mt-3">{error}</p>}

          {popupError && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-3"
              role="alert"
            >
              <strong className="font-bold">{popupError}</strong>
            </div>
          )}

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
                  type={showPassword ? "text" : "password"} // Toggle input type based on showPassword state
                  placeholder="**********"
                  className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state on click
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} color="#666" /> // Use eye invisible icon when password is visible
                  ) : (
                    <AiOutlineEye size={20} color="#666" /> // Use eye icon when password is hidden
                  )}
                </span>
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
