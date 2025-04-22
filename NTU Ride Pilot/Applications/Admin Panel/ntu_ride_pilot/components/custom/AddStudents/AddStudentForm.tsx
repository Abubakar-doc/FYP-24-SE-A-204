'use client';
import React, { useEffect, useState } from 'react';
import AddStudentHeader from './AddStudentHeader';
import { useSearchParams } from 'next/navigation';
import RollNumberEmailRow from './RollNumberEmailRow';
import NameFeePaidRow from './NameFeePaidRow';
import BusCardRow from './BusCardRow';
import { firestore } from '@/lib/firebase';
import { doc, setDoc, getDocs, collection, serverTimestamp, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

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
};

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onBack }) => {
  const searchParams = useSearchParams();
  const formType = searchParams.get('formType') || 'simpleForm';
  const sessionId = searchParams.get('sessionId');
  const studentId = searchParams.get('studentId'); // The roll_no for editing

  const [rollNumber, setRollNumber] = useState('00-NTU-AA-0000');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feePaid] = useState('Yes');
  const [busCardStatus, setBusCardStatus] = useState('Yes');
  const [busCard, setBusCard] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [existingRollNumbers, setExistingRollNumbers] = useState<string[]>([]);

  const normalizeSpaces = (str: string) => str.trim().replace(/\s+/g, ' ');

  // Fetch all roll numbers for validation
  useEffect(() => {
    const fetchRollNumbers = async () => {
      try {
        const studentsCollection = collection(firestore, 'users', 'user_roles', 'students');
        const studentsSnapshot = await getDocs(studentsCollection);
        const rollNumbers = studentsSnapshot.docs.map(doc => doc.id);
        setExistingRollNumbers(rollNumbers);
      } catch (error) {
        console.error('Error fetching roll numbers:', error);
      }
    };

    fetchRollNumbers();
  }, []);

  // Fetch student data for editing
  useEffect(() => {
    const fetchStudent = async () => {
      if (formType === 'editForm' && studentId) {
        try {
          const studentDocRef = doc(firestore, 'users', 'user_roles', 'students', studentId);
          const studentDoc = await getDoc(studentDocRef);
          if (studentDoc.exists()) {
            const data = studentDoc.data() as Student;
            setRollNumber(data.roll_no);
            setEmail(data.email);
            setName(data.name);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (formType === 'editForm') {
      setBusCardStatus('Yes');
      setBusCard('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

        if (formType === 'editForm') {
          // Update existing student document
          await updateDoc(studentDocRef, {
            email: normalizedEmail,
            name: normalizedName,
            updated_at: serverTimestamp(),
          });
          setSuccessMessage('Student updated successfully!');
        } else {
          // Create new student document
          await setDoc(studentDocRef, studentData);

          // Update session document
          const sessionDocRef = doc(firestore, 'sessions', sessionId!);
          const sessionDocSnap = await getDoc(sessionDocRef);

          if (sessionDocSnap.exists()) {
            const sessionData = sessionDocSnap.data();
            const rollNos: string[] = sessionData?.roll_no || [];
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
        }

        setExistingRollNumbers(prev => [...prev, rollNumber]);
        setErrorMessage('');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);

        resetForm();

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
          disabled={loading || formType === 'editForm'} // roll_no should not be changed in edit mode
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
