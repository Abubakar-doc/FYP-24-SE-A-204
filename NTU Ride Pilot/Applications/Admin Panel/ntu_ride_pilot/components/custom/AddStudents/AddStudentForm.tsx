'use client';

import React, { useEffect, useRef, useState } from 'react';
import AddStudentHeader from './AddStudentHeader';
import { useSearchParams } from 'next/navigation';
import RollNumberEmailRow from './RollNumberEmailRow';
import NameFeePaidRow from './NameFeePaidRow';
import BusCardRow from './BusCardRow';
import { firestore } from '@/lib/firebase';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
} from 'firebase/firestore';

type AddStudentFormProps = {
  onBack: () => void;
};

type Student = {
  roll_no: string;
  email: string;
  name: string;
  fee_paid: boolean;
  created_at: any;
  updated_at: any;
  bus_card_id?: string;
  bus_card_status: string;
};

const secondaryApp = initializeApp(
  {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  'Secondary'
);
const secondaryAuth = getAuth(secondaryApp);

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onBack }) => {
  const searchParams = useSearchParams();
  const formType = searchParams.get('formType') || 'simpleForm';
  const sessionId = searchParams.get('sessionId');
  const studentId = searchParams.get('studentId');

  const [rollNumber, setRollNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feePaid] = useState('Yes');
  const [busCardStatus, setBusCardStatus] = useState('Inactive');
  const [busCard, setBusCard] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [existingRollNumbers, setExistingRollNumbers] = useState<string[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const normalizeSpaces = (str: string) => str.trim().replace(/\s+/g, ' ');

  const isEditMode = formType === 'editForm';

  const [originalEmail, setOriginalEmail] = useState('');

  useEffect(() => {
    const fetchRollNumbers = async () => {
      try {
        const studentsCollection = collection(
          firestore,
          'users',
          'user_roles',
          'students'
        );
        const studentsSnapshot = await getDocs(studentsCollection);
        const rollNumbers = studentsSnapshot.docs.map((doc) => doc.id);
        setExistingRollNumbers(rollNumbers);
      } catch (error) {
        console.error('Error fetching roll numbers:', error);
      }
    };
    fetchRollNumbers();
  }, []);

  useEffect(() => {
    const fetchStudent = async () => {
      if (isEditMode && studentId) {
        try {
          const studentDocRef = doc(
            firestore,
            'users',
            'user_roles',
            'students',
            studentId
          );
          const studentDoc = await getDoc(studentDocRef);
          if (studentDoc.exists()) {
            const data = studentDoc.data() as Student;
            setRollNumber(data.roll_no);
            setEmail(data.email);
            setOriginalEmail(data.email);
            setName(data.name);
            setBusCard(data.bus_card_id || '');
            // Only set the status from database if it exists, otherwise keep the current state
            if (data.bus_card_status) {
              setBusCardStatus(data.bus_card_status);
            }
          } else {
            setErrorMessage('Student not found.');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
          }
        } catch (error) {
          setErrorMessage('Failed to fetch student data.');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        } finally {
          setInitialLoadComplete(true);
        }
      } else {
        setInitialLoadComplete(true);
      }
    };
    fetchStudent();
  }, [isEditMode, studentId]);

  useEffect(() => {
    // Only auto-set to Inactive when not in edit mode and busCard is empty
    if (initialLoadComplete && !isEditMode && !busCard) {
      setBusCardStatus('Inactive');
    }
  }, [busCard, isEditMode, initialLoadComplete]);

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specials = '!@#$%^&*()';

    const getRandomChar = (str: string) =>
      str[Math.floor(Math.random() * str.length)];

    let password = [
      getRandomChar(uppercase),
      getRandomChar(lowercase),
      getRandomChar(digits),
      getRandomChar(specials),
      getRandomChar(specials),
    ];

    const allChars = uppercase + lowercase + digits + specials;
    for (let i = 0; i < 3; i++) {
      password.push(getRandomChar(allChars));
    }

    return password.sort(() => Math.random() - 0.5).join('');
  };

  const validateInputs = (nameToValidate: string, emailToValidate: string) => {
    const rollNoRegex = /^\d{2}-NTU-[A-Z]{2}-\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!rollNoRegex.test(rollNumber)) {
      setErrorMessage('Invalid Roll Number Format (e.g., 23-NTU-CS-0001)');
      return false;
    }

    if (!emailRegex.test(emailToValidate)) {
      setErrorMessage('Invalid Email Format');
      return false;
    }

    if (!nameToValidate || typeof nameToValidate !== 'string' || nameToValidate.length > 50) {
      setErrorMessage('Name must be a string with a maximum of 50 characters');
      return false;
    }
    if (!nameRegex.test(nameToValidate)) {
      setErrorMessage('Name must contain letters and spaces only');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setRollNumber('');
    setName('');
    setEmail('');
    setBusCardStatus('Inactive');
    setBusCard('');
  };

  const checkEmailExists = async (emailToCheck: string) => {
    try {
      const response = await fetch('/api/check-email-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck }),
      });
      const data = await response.json();
      if (response.ok) {
        return data.exists;
      } else {
        console.error('Failed to check email existence:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  };

  const deleteUserByEmail = async (emailToDelete: string) => {
    try {
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToDelete }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return true;
      } else {
        console.error('Failed to delete user:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  };

  const checkBusCardExistsByRollNo = async (rollNo: string) => {
    try {
      const busCardsCollection = collection(firestore, 'bus_cards');
      const q = query(busCardsCollection, where('roll_no', '==', rollNo));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return docSnap.id;
      }
      return null;
    } catch (error) {
      console.error('Error checking bus card existence:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nativeEvent = e.nativeEvent as SubmitEvent;
    if (
      nativeEvent?.submitter &&
      submitButtonRef.current &&
      nativeEvent.submitter !== submitButtonRef.current
    ) {
      return;
    }

    if (!sessionId && !isEditMode) {
      setErrorMessage('No session selected');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    const normalizedName = normalizeSpaces(name);
    const normalizedEmail = normalizeSpaces(email);
    if (!normalizedName || !normalizedEmail) {
      setErrorMessage('Name and Email cannot be empty or spaces only');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      return;
    }

    if (
      validateInputs(normalizedName, normalizedEmail) &&
      normalizedName.length <= 50 &&
      /^[A-Za-z\s]+$/.test(normalizedName) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      if (!isEditMode && existingRollNumbers.includes(rollNumber)) {
        try {
          const sessionDocRef = doc(firestore, 'sessions', sessionId!);
          const sessionDocSnap = await getDoc(sessionDocRef);

          if (sessionDocSnap.exists()) {
            const sessionData = sessionDocSnap.data();
            const sessionRollNos: string[] = sessionData?.roll_no || [];
            const sessionName: string = sessionData?.name || 'this session';
            if (sessionRollNos.includes(rollNumber)) {
              setErrorMessage(`${rollNumber} already present in ${sessionName}`);
              setSuccessMessage('');
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 3000);
              return;
            } else {
              const busCardId = await checkBusCardExistsByRollNo(rollNumber);

              const studentDocRef = doc(
                firestore,
                'users',
                'user_roles',
                'students',
                rollNumber
              );

              if (busCardId) {
                await updateDoc(studentDocRef, {
                  bus_card_status: 'Active',
                  updated_at: serverTimestamp(),
                });
                const busCardDocRef = doc(firestore, 'bus_cards', busCardId);
                await updateDoc(busCardDocRef, {
                  isActive: true,
                  updated_at: serverTimestamp(),
                });
              } else {
                await updateDoc(studentDocRef, {
                  bus_card_status: 'Inactive',
                  updated_at: serverTimestamp(),
                });
              }

              setSuccessMessage(`Student added to session successfully!`);
              resetForm();
              setExistingRollNumbers((prev) => [...prev, rollNumber]);
              setErrorMessage('');
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 3000);
              return;
            }
          } else {
            setErrorMessage('Selected session does not exist.');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
            return;
          }
        } catch (error) {
          console.error('Error checking session roll numbers:', error);
          setErrorMessage('Failed to verify student session membership.');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
          return;
        }
      }

      setLoading(true);

      try {
        const studentDocRef = doc(
          firestore,
          'users',
          'user_roles',
          'students',
          rollNumber
        );
        const isActive = busCard ? busCardStatus === 'Active' : false;

        if (isEditMode) {
          const existingStudentDoc = await getDoc(studentDocRef);
          if (!existingStudentDoc.exists()) {
            setErrorMessage('Student record not found.');
            setShowNotification(true);
            setLoading(false);
            return;
          }
          const existingData = existingStudentDoc.data() as Student;

          if (normalizedEmail !== originalEmail) {
            const emailExists = await checkEmailExists(normalizedEmail);
            if (emailExists) {
              setErrorMessage(`Email ${normalizedEmail} already exists in the system!`);
              setShowNotification(true);
              setLoading(false);
              return;
            }

            const deleted = await deleteUserByEmail(originalEmail);
            if (!deleted) {
              setErrorMessage('Failed to delete old user account.');
              setShowNotification(true);
              setLoading(false);
              return;
            }

            const generatedPassword = generatePassword();
            await createUserWithEmailAndPassword(
              secondaryAuth,
              normalizedEmail,
              generatedPassword
            );
          }

          const previousBusCardId = existingData.bus_card_id || '';

          if (busCard && busCard !== previousBusCardId) {
            const busCardDocRef = doc(firestore, 'bus_cards', busCard);
            const busCardDoc = await getDoc(busCardDocRef);

            if (busCardDoc.exists()) {
              const busCardData = busCardDoc.data();
              if (busCardData.roll_no && busCardData.roll_no !== rollNumber) {
                setErrorMessage(
                  `Bus Card is already assigned to ${busCardData.roll_no}`
                );
                setBusCard('');
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 3000);
                setLoading(false);
                return;
              }
            } else {
              await setDoc(busCardDocRef, {
                bus_card_id: busCard,
                isActive: isActive,
                roll_no: rollNumber,
                name: normalizedName,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
              });
            }
            if (previousBusCardId) {
              const prevBusCardRef = doc(
                firestore,
                'bus_cards',
                previousBusCardId
              );
              await updateDoc(prevBusCardRef, {
                isActive: false,
                roll_no: '',
                updated_at: serverTimestamp(),
              });
            }
          }
          if (busCard) {
            const busCardDocRef = doc(firestore, 'bus_cards', busCard);
            await updateDoc(busCardDocRef, {
              isActive: isActive,
              updated_at: serverTimestamp(),
            });
          }
          await updateDoc(studentDocRef, {
            email: normalizedEmail,
            bus_card_status: busCard ? busCardStatus : 'Inactive',
            ...(busCard ? { bus_card_id: busCard } : { bus_card_id: '' }),
            updated_at: serverTimestamp(),
          });

          setSuccessMessage('Student updated successfully!');
          resetForm();
          setExistingRollNumbers((prev) => [...prev, rollNumber]);
          setErrorMessage('');
          setShowNotification(true);
          setLoading(false);
          return;
        }

        const generatedPassword = generatePassword();

        await createUserWithEmailAndPassword(
          secondaryAuth,
          normalizedEmail,
          generatedPassword
        );

        if (busCard) {
          const busCardDocRef = doc(firestore, 'bus_cards', busCard);
          const busCardDoc = await getDoc(busCardDocRef);

          if (busCardDoc.exists()) {
            const busCardData = busCardDoc.data();
            if (busCardData.roll_no) {
              setErrorMessage(
                `Bus Card is already assigned to ${busCardData.roll_no}`
              );
              setBusCard('');
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 3000);
              setLoading(false);
              return;
            }
          }

          await setDoc(busCardDocRef, {
            bus_card_id: busCard,
            isActive: isActive,
            roll_no: rollNumber,
            name: normalizedName,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
        }

        const studentData: Student = {
          roll_no: rollNumber,
          email: normalizedEmail,
          name: normalizedName,
          fee_paid: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          bus_card_status: busCard ? busCardStatus : 'Inactive',
          ...(busCard ? { bus_card_id: busCard } : {}),
        };

        await setDoc(studentDocRef, studentData);

        const sessionDocRef = doc(firestore, 'sessions', sessionId!);
        const sessionDocSnap = await getDoc(sessionDocRef);

        if (sessionDocSnap.exists()) {
          const rollNos: string[] = sessionDocSnap.data()?.roll_no || [];
          if (!rollNos.includes(rollNumber)) {
            await updateDoc(sessionDocRef, {
              roll_no: arrayUnion(rollNumber),
              updated_at: serverTimestamp(),
            });
          }
        } else {
          await setDoc(sessionDocRef, {
            roll_no: [rollNumber],
            status: 'active',
            created_at: serverTimestamp(),
          });
        }

        setSuccessMessage('Student added successfully!');
        resetForm();
        setExistingRollNumbers((prev) => [...prev, rollNumber]);
        setErrorMessage('');
        setShowNotification(true);
      } catch (authError: any) {
        if (
          authError.code === 'auth/email-already-in-use' ||
          authError.message?.includes('auth/email-already-in-use')
        ) {
          setErrorMessage('Email already registered in authentication system');
        } else {
          setErrorMessage('Failed to create authentication user.');
        }
        setShowNotification(true);
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMessage('Please provide valid inputs');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  useEffect(() => {
    if (successMessage || errorMessage) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="bg-white w-full min-h-screen relative">
      <AddStudentHeader onBackToStudents={onBack} isEditMode={isEditMode} />

      <form onSubmit={handleSubmit} className="space-y-6 p-4 mx-6">
        <RollNumberEmailRow
          rollNumber={rollNumber}
          setRollNumber={setRollNumber}
          email={email}
          setEmail={setEmail}
          disabled={loading}
        />

        <NameFeePaidRow
          name={name}
          setName={setName}
          feePaid={feePaid}
          disabled={loading}
        />

        <BusCardRow
          busCard={busCard}
          setBusCard={setBusCard}
          busCardStatus={busCardStatus}
          setBusCardStatus={setBusCardStatus}
          disabled={loading}
          statusDisabled={!busCard || loading}
        />
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className={`bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Clear
          </button>
          <button
            type="submit"
            ref={submitButtonRef}
            disabled={loading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-16 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
          </button>
        </div>
      </form>

      {showNotification && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-8 rounded-lg shadow-lg ${successMessage ? 'bg-green-500' : 'bg-red-500'
            } text-white font-bold transition duration-600 animate-out`}
        >
          {successMessage || errorMessage}
        </div>
      )}
    </div>
  );
};

export default AddStudentForm;