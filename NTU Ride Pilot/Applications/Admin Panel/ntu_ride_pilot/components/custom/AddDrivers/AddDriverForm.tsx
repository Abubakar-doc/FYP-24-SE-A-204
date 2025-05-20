"use client";
import React, { useState, useRef, useEffect } from 'react';
import AddDriverHeader from './AddDriverHeader';
import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  query,
} from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

// --- NEW IMPORTS FOR AUTH ---
import {
  initializeApp,
  getApps,
  FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  Auth,
} from "firebase/auth";

// --- PROVIDE YOUR FIREBASE CONFIG FOR SECONDARY APP ---
const SECONDARY_FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

type AddDriverFormProps = {
  onBack?: () => void;
};

const PAKISTAN_COUNTRY_CODE = '+92';
const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset';

const AddDriverForm: React.FC<AddDriverFormProps> = ({ onBack }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // States
  const [selectedCode] = useState<string>(PAKISTAN_COUNTRY_CODE);
  const [loading, setLoading] = useState<boolean>(false);

  // Notification states
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);

  // Refs for form inputs
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const profilePicRef = useRef<HTMLInputElement>(null);

  // Track if editing and the driver document ID
  const [isEditMode, setIsEditMode] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [existingProfilePic, setExistingProfilePic] = useState<string>(''); // Store existing profile pic URL
  const [existingProfilePicPublicId, setExistingProfilePicPublicId] = useState<string>(''); // Store existing profile pic public ID

  // Normalize and validation functions
  const normalizeName = (name: string) => {
    return name.trim().split(/\s+/).filter(Boolean).join(' ');
  };

  const isValidName = (name: string) => {
    const regex = /^[A-Za-z\s]+$/;
    return regex.test(name) && name.length <= 50;
  };

  const normalizeEmail = (email: string) => {
    return email.replace(/\s+/g, '').trim();
  };

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const normalizeContact = (contact: string) => {
    return contact.replace(/\s+/g, '').trim();
  };

  const isValidContact = (countryCode: string, contact: string) => {
    let fullNumber = countryCode + contact;
    if (fullNumber.startsWith('+')) {
      fullNumber = fullNumber.slice(1);
    }
    const regex = /^[0-9]{12}$/;
    return regex.test(fullNumber);
  };

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) => {
    setIsNotificationVisible(true);
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage('');
      setWarningMessage('');
    } else if (type === 'error') {
      setErrorMessage(message);
      setSuccessMessage('');
      setWarningMessage('');
    } else {
      setWarningMessage(message);
      setSuccessMessage('');
      setErrorMessage('');
    }
    setTimeout(() => {
      setIsNotificationVisible(false);
      setSuccessMessage('');
      setErrorMessage('');
      setWarningMessage('');
    }, 5000);
  };

  // Populate form if editing
  useEffect(() => {
    const driverParam = searchParams?.get('driver');
    if (driverParam) {
      try {
        const driver = JSON.parse(decodeURIComponent(driverParam));
        if (driver) {
          setIsEditMode(true);
          setDriverId(driver.id || null);

          if (nameRef.current) nameRef.current.value = driver.name || '';
          if (emailRef.current) emailRef.current.value = driver.email || '';

          let contactNumber = driver.contactNo || '';
          if (contactNumber.startsWith(PAKISTAN_COUNTRY_CODE)) {
            contactNumber = contactNumber.slice(PAKISTAN_COUNTRY_CODE.length);
          } else if (contactNumber.startsWith('+')) {
            contactNumber = contactNumber.slice(1);
          }
          if (contactRef.current) contactRef.current.value = contactNumber;

          setExistingProfilePic(driver.profilePicLink || '');
          setExistingProfilePicPublicId(driver.profilePicPublicId || '');
        }
      } catch (error) {
        console.error('Failed to parse driver data:', error);
      }
    }
  }, [searchParams]);

  // --- RANDOM PASSWORD GENERATOR ---
  const generateRandomPassword = (): string => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const specials = "!@#$%^&*()-_=+[]{}|;:,.<>?";

    // Ensure at least one of each required type
    let password = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specials[Math.floor(Math.random() * specials.length)],
      specials[Math.floor(Math.random() * specials.length)],
    ];

    // Fill remaining 3 characters randomly
    const all = upper + lower + digits + specials;
    for (let i = password.length; i < 8; i++) {
      password.push(all[Math.floor(Math.random() * all.length)]);
    }
    // Shuffle password to randomize character positions
    for (let i = password.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [password[i], password[j]] = [password[j], password[i]];
    }
    return password.join('');
  };

  // --- CLOUDINARY UPLOAD ---
  // UPDATED: Return both URL and publicId
  const uploadImageToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('Cloudinary cloud name not set in environment variables');
    }
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return { url: data.secure_url, publicId: data.public_id };
  };

  // --- MAIN SUBMIT HANDLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setIsNotificationVisible(false);

    try {
      let name = nameRef.current?.value || '';
      let email = emailRef.current?.value || '';
      let contact = contactRef.current?.value || '';
      const profilePicFile = profilePicRef.current?.files?.[0] || null;

      name = normalizeName(name);
      email = normalizeEmail(email);
      contact = normalizeContact(contact);

      if (!name) throw new Error('Driver name is required.');
      if (!isValidName(name)) throw new Error('Name must contain only letters and spaces, max 50 characters.');

      if (!email) throw new Error('Email is required.');
      if (!isValidEmail(email)) throw new Error('Invalid email format.');

      if (!contact) throw new Error('Contact number is required.');
      if (!isValidContact(selectedCode, contact)) throw new Error('Contact number must be exactly 12 digits including country code.');

      if (!profilePicFile && !isEditMode) {
        throw new Error('Profile picture is required.');
      }

      // Firestore path
      const userRolesDocRef = doc(firestore, 'users', 'user_roles');
      const driversCollectionRef = collection(userRolesDocRef, 'drivers');

      // Fetch all existing drivers for duplicate checks
      const q = query(driversCollectionRef);
      const querySnapshot = await getDocs(q);

      // Check for duplicate name except current driver in edit mode
      const existingDriverWithName = querySnapshot.docs.find(doc => {
        const data = doc.data();
        if (isEditMode && doc.id === driverId) return false;
        return data.name?.toLowerCase() === name.toLowerCase();
      });

      if (existingDriverWithName) {
        showNotification(`Driver name "${name}" already exists!`, 'warning');
        setLoading(false);
        return;
      }

      // Check for duplicate email except current driver in edit mode (Firestore)
      const existingDriverWithEmail = querySnapshot.docs.find(doc => {
        const data = doc.data();
        if (isEditMode && doc.id === driverId) return false;
        return data.email?.toLowerCase() === email.toLowerCase();
      });

      if (existingDriverWithEmail) {
        showNotification(`Email "${email}" already assigned to "${existingDriverWithEmail.data().name}"!`, 'warning');
        setLoading(false);
        return;
      }

      // --- AUTHENTICATION LOGIC: ONLY FOR ADD (NOT EDIT) ---
      if (!isEditMode) {
        // 1. Initialize secondary app (or get if already initialized)
        let secondaryApp: FirebaseApp | undefined;
        const existing = getApps().find(app => app.name === "Secondary");
        if (existing) {
          secondaryApp = existing;
        } else {
          secondaryApp = initializeApp(SECONDARY_FIREBASE_CONFIG, "Secondary");
        }
        const secondaryAuth: Auth = getAuth(secondaryApp);

        // 2. Check if email already exists in Firebase Auth
        let signInMethods: string[] = [];
        try {
          signInMethods = await fetchSignInMethodsForEmail(secondaryAuth, email);
        } catch (fetchError: any) {
          showNotification('Failed to check email in authentication table. Please try again.', 'error');
          setLoading(false);
          return;
        }

        if (signInMethods && signInMethods.length > 0) {
          showNotification(`Email "${email}" already exists in authentication table!`, 'warning');
          setLoading(false);
          return;
        }

        // 3. Generate random password
        const randomPassword = generateRandomPassword();

        // 4. Try to create user in Firebase Auth
        try {
          await createUserWithEmailAndPassword(secondaryAuth, email, randomPassword);
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            showNotification(`Email "${email}" already exists in authentication table!`, 'warning');
          } else {
            showNotification(authError.message || 'Failed to create driver authentication.', 'error');
          }
          setLoading(false);
          return;
        }
        // Optionally: send email to driver with password here (not implemented)
      }

      // --- IMAGE UPLOAD ---
      // Upload new profile pic if selected, else keep existing
      let profilePicUrl = existingProfilePic;
      let profilePicPublicId = existingProfilePicPublicId;
      if (profilePicFile) {
        const uploadResult = await uploadImageToCloudinary(profilePicFile);
        profilePicUrl = uploadResult.url;
        profilePicPublicId = uploadResult.publicId;
      }

      // --- PREPARE DATA ---
      const driverData = {
        name,
        email,
        contactNo: selectedCode + contact,
        profilePicLink: profilePicUrl,
        profilePicPublicId: profilePicPublicId || '',
        updated_at: serverTimestamp(),
        ...(isEditMode ? {} : { created_at: serverTimestamp() }),
      };

      // --- FIRESTORE WRITE ---
      if (isEditMode && driverId) {
        const driverDocRef = doc(driversCollectionRef, driverId);
        await setDoc(driverDocRef, driverData, { merge: true });
        showNotification('Driver updated successfully!', 'success');
        if (nameRef.current) nameRef.current.value = '';
        if (emailRef.current) emailRef.current.value = '';
        if (contactRef.current) contactRef.current.value = '';
        if (profilePicRef.current) profilePicRef.current.value = '';
        setExistingProfilePic('');
        setExistingProfilePicPublicId('');
      } else {
        const newDriverDocRef = doc(driversCollectionRef);
        await setDoc(newDriverDocRef, driverData);
        showNotification('Driver added successfully!', 'success');
        if (nameRef.current) nameRef.current.value = '';
        if (emailRef.current) emailRef.current.value = '';
        if (contactRef.current) contactRef.current.value = '';
        if (profilePicRef.current) profilePicRef.current.value = '';
        setExistingProfilePic('');
        setExistingProfilePicPublicId('');
      }
    } catch (error: any) {
      showNotification(error.message || 'Failed to add/update driver.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset handler
  const handleReset = () => {
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (contactRef.current) contactRef.current.value = '';
    if (profilePicRef.current) profilePicRef.current.value = '';
    setExistingProfilePic('');
    setExistingProfilePicPublicId('');
    setIsNotificationVisible(false);
    setSuccessMessage('');
    setErrorMessage('');
    setWarningMessage('');
  };

  return (
    <div className="bg-white w-full min-h-screen relative">
      <AddDriverHeader onBackToDriver={onBack ?? (() => {})} />

      <form onSubmit={handleSubmit} className="space-y-4 p-4 mx-6" noValidate>
        {/* Name and Email Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-[#202020]">
              Name *
            </label>
            <input
              type="text"
              id="name"
              ref={nameRef}
              placeholder="Enter driver name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              maxLength={50}
              required
              pattern="[A-Za-z\s]+"
              title="Name should contain only letters and spaces."
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#202020]">
              Email *
            </label>
            <input
              type="email"
              id="email"
              ref={emailRef}
              placeholder="Enter driver email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              required
              disabled={loading}
            />
          </div>
        </div>
        {/* Contact and Profile Picture Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact" className="block text-sm font-semibold text-[#202020]">
              Contact *
            </label>
            <div className="flex">
              <select
                value={selectedCode}
                className="rounded-md border-gray-300 bg-[#F5F5F5] focus:border-blue-500 focus:ring-blue-500 p-3 text-sm mr-2"
                style={{ minWidth: 90 }}
                required
                disabled
              >
                <option value={PAKISTAN_COUNTRY_CODE}>{PAKISTAN_COUNTRY_CODE}</option>
              </select>
              <input
                type="text"
                id="contact"
                ref={contactRef}
                placeholder="Enter 12-digit contact number"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
                maxLength={12}
                required
                pattern="\d{12}"
                title="Contact number must be exactly 12 digits."
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profilePicture" className="block text-sm font-semibold text-[#202020]">
              Profile Picture {isEditMode ? '(Optional)' : '*'}
            </label>
            <input
              type="file"
              id="profilePicture"
              ref={profilePicRef}
              accept="image/*"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-2"
              {...(!isEditMode ? { required: true } : {})}
              disabled={loading}
            />
            {existingProfilePic && (
              <img
                src={existingProfilePic}
                alt="Driver Profile"
                className="mb-2 w-32 h-32 object-cover rounded-md border border-gray-300"
              />
            )}
          </div>
        </div>
        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-16 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update' : 'Add')}
          </button>
        </div>
      </form>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          <style jsx>{`
            .loader {
              border-top-color: #3498db;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* Floating Notification */}
      {isNotificationVisible && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-6 rounded-lg shadow-lg max-w-xs w-full text-white font-semibold transition-opacity duration-500 ${
            successMessage
              ? 'bg-green-600'
              : warningMessage
              ? 'bg-yellow-600'
              : 'bg-red-600'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex justify-between items-center">
            <div>{successMessage || warningMessage || errorMessage}</div>
            <button
              onClick={() => setIsNotificationVisible(false)}
              aria-label="Close notification"
              className="ml-4 font-bold focus:outline-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDriverForm;
