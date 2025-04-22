'use client';
import React, { useEffect, useRef, useState } from 'react';
import AddStudentHeader from './AddStudentHeader';
import { useSearchParams } from 'next/navigation';
import RollNumberEmailRow from './RollNumberEmailRow';
import NameFeePaidRow from './NameFeePaidRow';
import BusCardRow from './BusCardRow';
import { firestore } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
  getDoc,
  updateDoc,
  arrayUnion,
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
  bus_card_status?: string;
};

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onBack }) => {
  const searchParams = useSearchParams();
  const formType = searchParams.get('formType') || 'simpleForm';
  const sessionId = searchParams.get('sessionId');
  const studentId = searchParams.get('studentId');

  const [rollNumber, setRollNumber] = useState('00-NTU-AA-0000');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feePaid] = useState('Yes');
  const [busCardStatus, setBusCardStatus] = useState('Active');
  const [busCard, setBusCard] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [existingRollNumbers, setExistingRollNumbers] = useState<string[]>([]);

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const normalizeSpaces = (str: string) => str.trim().replace(/\s+/g, ' ');

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
      if (formType === 'editForm' && studentId) {
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
            setName(data.name);
            setBusCard(data.bus_card_id || '');
            setBusCardStatus(data.bus_card_status || 'Active');
          } else {
            setErrorMessage('Student not found.');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
          }
        } catch (error) {
          setErrorMessage('Failed to fetch student data.');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        }
      }
    };
    fetchStudent();
  }, [formType, studentId]);

  const validateInputs = () => {
    const rollNoRegex = /^\d{2}-NTU-[A-Z]{2}-\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-z\s]+$/;

    if (!rollNoRegex.test(rollNumber)) {
      setErrorMessage('Invalid Roll Number Format (e.g., 23-NTU-CS-0001)');
      return false;
    }

    if (!emailRegex.test(email)) {
      setErrorMessage('Invalid Email Format');
      return false;
    }

    if (!name || typeof name !== 'string' || name.length > 50) {
      setErrorMessage('Name must be a string with a maximum of 50 characters');
      return false;
    }
    if (!nameRegex.test(name)) {
      setErrorMessage('Name must contain letters and spaces only');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setRollNumber('00-NTU-AA-0000');
    setName('');
    setEmail('');
    setBusCardStatus('Active');
    setBusCard('');
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

    if (!sessionId && formType !== 'editForm') {
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

    setName(normalizedName);
    setEmail(normalizedEmail);

    if (
      validateInputs() &&
      normalizedName.length <= 50 &&
      /^[A-Za-z\s]+$/.test(normalizedName) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      if (formType !== 'editForm' && existingRollNumbers.includes(rollNumber)) {
        setErrorMessage(`${rollNumber} is already present!`);
        setSuccessMessage('');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        return;
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
        const studentData: Student = {
          roll_no: rollNumber,
          email: normalizedEmail,
          name: normalizedName,
          fee_paid: true,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        };
        const isActive = busCardStatus === 'Active';

        if (formType === 'editForm') {
          const existingStudentDoc = await getDoc(studentDocRef);
          const existingData = existingStudentDoc.data() as Student;
          const previousBusCardId = existingData.bus_card_id || '';

          // Handle bus card changes
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

            // Update previous bus card if exists
            if (previousBusCardId) {
              const prevBusCardRef = doc(firestore, 'bus_cards', previousBusCardId);
              await updateDoc(prevBusCardRef, {
                isActive: false,
                roll_no: '',
                updated_at: serverTimestamp(),
              });
            }
          }

          // Update bus card status (isActive) if busCard is present
          if (busCard) {
            const busCardDocRef = doc(firestore, 'bus_cards', busCard);
            await updateDoc(busCardDocRef, {
              isActive: isActive,
              updated_at: serverTimestamp(),
            });
          }

          await updateDoc(studentDocRef, {
            email: normalizedEmail,
            bus_card_id: busCard,
            bus_card_status: busCardStatus,
            updated_at: serverTimestamp(),
          });

          setSuccessMessage('Student updated successfully!');
          // Reset all fields after edit completes
          resetForm();
        } else {
          // Handle new student bus card
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

          studentData.bus_card_id = busCard;
          studentData.bus_card_status = busCardStatus;
          await setDoc(studentDocRef, studentData);

          // Update session
          const sessionDocRef = doc(firestore, 'sessions', sessionId!);
          const sessionDocSnap = await getDoc(sessionDocRef);

          if (sessionDocSnap.exists()) {
            const rollNos: string[] = sessionDocSnap.data()?.roll_no || [];
            if (!rollNos.includes(rollNumber)) {
              await updateDoc(sessionDocRef, {
                roll_no: arrayUnion(rollNumber),
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
        }

        setExistingRollNumbers((prev) => [...prev, rollNumber]);
        setErrorMessage('');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } catch (error) {
        console.error('Error saving student:', error);
        setErrorMessage('Failed to save student. Please try again.');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
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
      <AddStudentHeader onBackToStudents={onBack} />

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

        {formType === 'editForm' && (
          <BusCardRow
            busCard={busCard}
            setBusCard={setBusCard}
            busCardStatus={busCardStatus}
            setBusCardStatus={setBusCardStatus}
            disabled={loading}
          />
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className={`bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Reset
          </button>
          <button
            type="submit"
            ref={submitButtonRef}
            disabled={loading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-16 rounded focus:outline-none focus:shadow-outline ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : formType === 'editForm' ? 'Update' : 'Add'}
          </button>
        </div>
      </form>

      {showNotification && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-8 rounded-lg shadow-lg ${
            successMessage ? 'bg-green-500' : 'bg-red-500'
          } text-white font-bold transition duration-600 animate-out`}
        >
          {successMessage || errorMessage}
        </div>
      )}
    </div>
  );
};

export default AddStudentForm;
