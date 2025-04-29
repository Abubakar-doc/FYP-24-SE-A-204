'use client';
import React, { useState, useRef } from 'react';
import AddBusHeader from './AddBusHeader';
import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

type AddBusFormProps = {
  onBack: () => void;
};

const AddBusForm: React.FC<AddBusFormProps> = ({ onBack }) => {
  const regNoRef = useRef<HTMLInputElement>(null);
  const seatNoRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  // Notification states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) => {
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

    // Delay setting visibility to ensure message states are updated first
    setTimeout(() => {
      setIsNotificationVisible(true);
    }, 0);

    // Hide notification after 5 seconds
    setTimeout(() => {
      setIsNotificationVisible(false);
      setSuccessMessage('');
      setErrorMessage('');
      setWarningMessage('');
    }, 5000);
  };

  const handleReset = () => {
    if (regNoRef.current) regNoRef.current.value = '';
    if (seatNoRef.current) seatNoRef.current.value = '';
    setIsNotificationVisible(false);
    setSuccessMessage('');
    setErrorMessage('');
    setWarningMessage('');
  };

  // Normalize Bus Registration Number: remove all spaces (start, end, and in between)
  const normalizeBusId = (input: string) => {
    return input.replace(/\s+/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    let busIdRaw = regNoRef.current?.value || '';
    const seatCapacityStr = seatNoRef.current?.value.trim() || '';
    const seatCapacity = Number(seatCapacityStr);

    // Normalize busId by removing all spaces
    const busId = normalizeBusId(busIdRaw);

    if (!busId) {
      showNotification('Bus Registration Number is required.', 'error');
      return;
    }
    if (!seatCapacityStr || isNaN(seatCapacity) || seatCapacity <= 0) {
      showNotification('Please enter a valid number of seats.', 'error');
      return;
    }

    setLoading(true);
    setIsNotificationVisible(false);

    try {
      const busesCollectionRef = collection(firestore, 'buses');

      // Fetch existing buses to check for duplicates (case-insensitive)
      const busesSnapshot = await getDocs(busesCollectionRef);
      const busExists = busesSnapshot.docs.some(
        (doc) => doc.id.toLowerCase() === busId.toLowerCase()
      );

      if (busExists) {
        showNotification(`${busId} already exists!`, 'warning');
        setLoading(false);
        return;
      }

      // Add new bus document with busId as doc id
      const busDocRef = doc(busesCollectionRef, busId);
      await setDoc(busDocRef, {
        busId,
        seatCapacity,
        created_at: serverTimestamp(),
      });

      // Pass the exact success message you want here:
      showNotification('Bus Added Successfully!', 'success');

      // Reset form
      handleReset();
    } catch (error: any) {
      console.error('Error adding bus:', error);
      showNotification('Failed to add bus. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full min-h-screen relative">
      <AddBusHeader onBackToBus={onBack} />

      <form onSubmit={handleSubmit} className="space-y-4 p-4 mx-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="regNo" className="block text-sm font-semibold text-[#202020]">
              Registration No *
            </label>
            <input
              type="text"
              id="regNo"
              ref={regNoRef}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="seatNo" className="block text-sm font-semibold text-[#202020]">
              Number of Seats *
            </label>
            <input
              type="number"
              id="seatNo"
              ref={seatNoRef}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              required
              min={1}
              disabled={loading}
            />
          </div>
        </div>

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
            Add
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

export default AddBusForm;
