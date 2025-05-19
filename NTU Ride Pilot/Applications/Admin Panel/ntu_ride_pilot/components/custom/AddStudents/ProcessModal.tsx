import React, { useState } from 'react';
import { FaCheck, FaSpinner } from 'react-icons/fa';
import {
  doc,
  setDoc,
  collection,
  serverTimestamp,
  getDocs,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useSearchParams } from 'next/navigation';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Initialize secondary Firebase app for auth to avoid logging out admin
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

interface ErrorReport {
  rowNumber: number;
  rollNo?: string;
  email?: string;
  name?: string;
  message?: string;
}

type ProcessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  dataCount: number;
  jsonData: any[];
};

const ProcessModal: React.FC<ProcessModalProps> = ({
  isOpen,
  onClose,
  fileName,
  dataCount,
  jsonData,
}) => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorReport, setErrorReport] = useState<ErrorReport[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);

  const steps = [
    'Check Missing Data',
    'Validate Roll No Format',
    'Validate Email Format',
    'Validate Name Format',
    'Add Students to Database and Authentication',
  ];

  const resetProcess = () => {
    setProgress(0);
    setCurrentStep(0);
    setErrorReport([]);
    setSuccessMessage(null);
    setErrorMessage(null);
    setProcessingComplete(false);
  };

  const handleClose = () => {
    resetProcess();
    onClose();
  };

  // Password generator meeting all criteria
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

  const validateRollNoFormat = (rollNo: string): boolean => {
    const regex = /^\d{2}-NTU-[A-Z]{2}-\d{4}$/;
    return regex.test(rollNo);
  };

  const validateEmailFormat = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateNameFormat = (name: string): boolean => {
    const regex = /^[A-Za-z\s]+$/;
    return regex.test(name);
  };

  const processCurrentStep = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrorReport([]);

    try {
      let report: ErrorReport[] = [];
      let isValid = true;

      switch (currentStep) {
        case 0: // Check Missing Data
          jsonData.forEach((row, index) => {
            const errors: Partial<ErrorReport> = {};
            let hasError = false;

            const rollNo = String(row['Roll No'] || '').trim();
            const email = String(row['Email'] || '').trim();
            const name = String(row['Name'] || '').trim();

            if (!rollNo) {
              errors.rollNo = 'Empty';
              hasError = true;
            }
            if (!email) {
              errors.email = 'Empty';
              hasError = true;
            }
            if (!name) {
              errors.name = 'Empty';
              hasError = true;
            }
            if (hasError) {
              report.push({
                rowNumber: index + 2,
                ...errors,
                message: 'Missing required data',
              });
              isValid = false;
            }
          });
          break;
        case 1: // Validate Roll No Format
          jsonData.forEach((row, index) => {
            const rollNo = String(row['Roll No'] || '').trim();
            if (!validateRollNoFormat(rollNo)) {
              report.push({
                rowNumber: index + 2,
                rollNo: rollNo,
                message: 'Invalid format. Expected: 00-NTU-AA-0000',
              });
              isValid = false;
            }
          });
          break;

        case 2: // Validate Email Format
          jsonData.forEach((row, index) => {
            const email = String(row['Email'] || '').trim();
            if (!validateEmailFormat(email)) {
              report.push({
                rowNumber: index + 2,
                email: email,
                message: 'Invalid email format',
              });
              isValid = false;
            }
          });
          break;

        case 3: // Validate Name Format
          jsonData.forEach((row, index) => {
            const name = String(row['Name'] || '').trim();
            if (!validateNameFormat(name)) {
              report.push({
                rowNumber: index + 2,
                name: name,
                message: 'Should contain only letters and spaces',
              });
              isValid = false;
            }
          });
          break;

        case 4: // REVERSED LOGIC: Add to Authentication FIRST, then Firestore
          const studentsCollection = collection(
            firestore,
            'users',
            'user_roles',
            'students'
          );
          const snapshot = await getDocs(studentsCollection);
          const existingStudents = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data()])
          );

          let newStudents = 0;
          let updatedStudents = 0;
          let skippedStudents = 0;
          const rollNosToAdd: string[] = [];

          for (let i = 0; i < jsonData.length; i++) {
            const student = jsonData[i];
            const rollNo = student['Roll No'];
            const email = student['Email'];
            const name = student['Name'];

            // Check if student already exists in Firestore
            const existingStudent = existingStudents.get(rollNo);

            // If student exists in Firestore, check if email and name match
            if (existingStudent) {
              // If details changed, update Firestore (no need to touch Auth)
              if (
                existingStudent.email !== email ||
                existingStudent.name !== name
              ) {
                const studentDocRef = doc(
                  firestore,
                  'users',
                  'user_roles',
                  'students',
                  rollNo
                );
                await setDoc(
                  studentDocRef,
                  {
                    ...existingStudent,
                    email: email,
                    name: name,
                    updated_at: serverTimestamp(),
                  },
                  { merge: true }
                );
                updatedStudents++;
              } else {
                skippedStudents++;
              }
              // No need to process Auth again for existing Firestore students
              continue;
            }

            // For NEW student: Try to create user in Auth FIRST
            let authCreated = false;
            let password = '';
            try {
              password = generatePassword();
              await createUserWithEmailAndPassword(secondaryAuth, email, password);
              authCreated = true;
            } catch (authError: any) {
              let message = 'Unknown auth error';
              if (authError.code === 'auth/email-already-in-use') {
                message = 'Email already registered in authentication system';
              } else if (authError.message) {
                message = authError.message;
              }
              // Report error and SKIP Firestore addition
              report.push({
                rowNumber: i + 2,
                rollNo,
                email,
                name,
                message,
              });
              continue;
            }

            // Only add to Firestore if Auth creation was successful
            if (authCreated) {
              const studentDocRef = doc(
                firestore,
                'users',
                'user_roles',
                'students',
                rollNo
              );
              await setDoc(studentDocRef, {
                roll_no: rollNo,
                email: email,
                name: name,
                fee_paid: true,
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                bus_card_status: "Inactive", // <-- NEW FIELD
              });
              newStudents++;
              rollNosToAdd.push(rollNo);
            }

            // Update progress after each student
            setProgress(((i + 1) / jsonData.length) * 100);
          }

          // Update session document if needed
          if (sessionId && rollNosToAdd.length > 0) {
            const sessionDocRef = doc(firestore, 'sessions', sessionId);
            await updateDoc(sessionDocRef, {
              roll_no: arrayUnion(...rollNosToAdd),
            });
          }

          let successMsg = '';
          if (newStudents > 0) successMsg += `Added ${newStudents} new student(s). `;
          if (updatedStudents > 0)
            successMsg += `Updated ${updatedStudents} existing student(s). `;
          if (skippedStudents > 0)
            successMsg += `Skipped ${skippedStudents} unchanged student(s). `;
          if (sessionId) successMsg += `Students added to session.`;

          setSuccessMessage(successMsg.trim());

          if (report.length > 0) {
            setErrorReport(report);
            setErrorMessage(
              'Some students encountered issues during authentication creation. Please review the report below.'
            );
          }
          break;

        default:
          break;
      }

      if (report.length > 0 && currentStep !== 4) {
        setErrorReport(report);
        setErrorMessage(`Validation failed for ${steps[currentStep]}`);
      }

      // Step success
      const newProgress = ((currentStep + 1) / steps.length) * 100;
      setProgress(newProgress);

      if (currentStep < steps.length - 1) {
        setSuccessMessage(`${steps[currentStep]} completed successfully!`);
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setSuccessMessage(null);
        }, 1500);
      } else {
        setProcessingComplete(true);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderErrorReport = () => {
    if (errorReport.length === 0) return null;

    return (
      <div className="mt-4 w-full max-h-60 overflow-auto">
        <h3 className="font-semibold text-red-600 mb-2">Issues Found:</h3>
        <div className="space-y-2">
          {errorReport.map((item, index) => (
            <div
              key={index}
              className="bg-red-50 p-3 rounded border border-red-100"
            >
              <p className="font-medium">Row {item.rowNumber}:</p>
              {item.rollNo && (
                <p>Roll No: {item.rollNo === 'Empty' ? 'Empty' : item.rollNo}</p>
              )}
              {item.email && (
                <p>Email: {item.email === 'Empty' ? 'Empty' : item.email}</p>
              )}
              {item.name && (
                <p>Name: {item.name === 'Empty' ? 'Empty' : item.name}</p>
              )}
              {item.message && (
                <p className="text-red-600">{item.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 relative max-h-[550px] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4">Data Processing</h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* File Info */}
        <div className="mb-6 bg-gray-50 p-3 rounded">
          <p className="font-medium">
            File: <span className="text-gray-700">{fileName}</span>
          </p>
          <p className="font-medium">
            Records: <span className="text-gray-700">{dataCount}</span>
          </p>
          {sessionId && (
            <p className="font-medium">
              Session ID: <span className="text-gray-700">{sessionId}</span>
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="mb-6 space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center p-2 rounded ${
                index < currentStep
                  ? 'bg-green-50 text-green-700'
                  : index === currentStep
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-50 text-gray-500'
              }`}
            >
              {index < currentStep ? (
                <FaCheck className="mr-3 text-green-500" />
              ) : (
                <div className="mr-3 w-4 h-4 flex items-center justify-center">
                  {index === currentStep && isProcessing ? (
                    <FaSpinner className="animate-spin text-blue-500" />
                  ) : (
                    <span className="text-gray-400">{index + 1}</span>
                  )}
                </div>
              )}
              <span className="font-medium">{step}</span>
            </div>
          ))}
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="text-red-500 mb-4 p-3 bg-red-50 rounded">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="text-green-600 mb-4 p-3 bg-green-50 rounded">
            {successMessage}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center mt-6">
          {processingComplete ? (
            <button
              onClick={handleClose}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-8 rounded"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={processCurrentStep}
              disabled={isProcessing}
              className={`flex items-center justify-center ${
                isProcessing
                  ? 'bg-blue-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-bold py-2 px-8 rounded min-w-40`}
            >
              {isProcessing ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Process ${steps[currentStep]}`
              )}
            </button>
          )}
        </div>

        {renderErrorReport()}
      </div>
    </div>
  );
};

export default ProcessModal;
