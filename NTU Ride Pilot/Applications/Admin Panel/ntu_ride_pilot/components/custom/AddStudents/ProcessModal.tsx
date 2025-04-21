import React, { useState } from 'react';
import { FaCheck, FaSpinner } from 'react-icons/fa';
import { doc, setDoc, collection, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

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
  jsonData
}) => {
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
    'Add Students to Database'
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
                message: 'Missing required data'
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
                message: 'Invalid format. Expected: 00-NTU-AA-0000'
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
                message: 'Invalid email format'
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
                message: 'Should contain only letters and spaces'
              });
              isValid = false;
            }
          });
          break;

        case 4: // Add to Database
          // First, fetch all existing student roll numbers
          const studentsCollection = collection(firestore, 'users', 'user_roles', 'students');
          const snapshot = await getDocs(studentsCollection);
          const existingRollNos = new Set(snapshot.docs.map(doc => doc.id));

          // Filter out students that already exist
          const newStudents = jsonData.filter(student => 
            !existingRollNos.has(student['Roll No'])
          );

          if (newStudents.length === 0) {
            setSuccessMessage('All students already exist in the database. No new records added.');
            setProcessingComplete(true);
            return;
          }

          // Only add new students that don't exist
          const batchPromises = newStudents.map((student) => {
            const studentDocRef = doc(
              firestore,
              'users',
              'user_roles',
              'students',
              student['Roll No']
            );
            const timestamp = serverTimestamp();
            return setDoc(studentDocRef, {
              roll_no: student['Roll No'],
              email: student['Email'],
              name: student['Name'],
              fee_paid: true,
              created_at: timestamp,
              updated_at: timestamp
            });
          });

          await Promise.all(batchPromises);
          setSuccessMessage(`Added ${newStudents.length} new student(s). ${jsonData.length - newStudents.length} student(s) already existed.`);
          break;

        default:
          break;
      }

      if (report.length > 0) {
        setErrorReport(report);
        throw new Error(`Validation failed for ${steps[currentStep]}`);
      }

      // If we get here, the step was successful
      const newProgress = ((currentStep + 1) / steps.length) * 100;
      setProgress(newProgress);

      // Only show step completion message if not the last step
      if (currentStep < steps.length - 1) {
        setSuccessMessage(`${steps[currentStep]} completed successfully!`);
      }

      // Move to next step or complete
      if (currentStep < steps.length - 1) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setSuccessMessage(null);
        }, 1500);
      } else {
        setProcessingComplete(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderErrorReport = () => {
    if (errorReport.length === 0) return null;

    return (
      <div className="mt-4 w-full max-h-60">
        <h3 className="font-semibold text-red-600 mb-2">Issues Found:</h3>
        <div className="space-y-2">
          {errorReport.map((item, index) => (
            <div key={index} className="bg-red-50 p-3 rounded border border-red-100">
              <p className="font-medium">Row {item.rowNumber}:</p>
              {item.rollNo && <p>Roll No: {item.rollNo === 'Empty' ? 'Empty' : item.rollNo}</p>}
              {item.email && <p>Email: {item.email === 'Empty' ? 'Empty' : item.email}</p>}
              {item.name && <p>Name: {item.name === 'Empty' ? 'Empty' : item.name}</p>}
              {item.message && <p className="text-red-600">{item.message}</p>}
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
          <p className="font-medium">File: <span className="text-gray-700">{fileName}</span></p>
          <p className="font-medium">Records: <span className="text-gray-700">{dataCount}</span></p>
        </div>

        {/* Steps */}
        <div className="mb-6 space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center p-2 rounded ${index < currentStep ? 'bg-green-50 text-green-700' : index === currentStep ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}
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
              className={`flex items-center justify-center ${isProcessing ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold py-2 px-8 rounded min-w-40`}
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