// AddSessionForm.tsx
"use client";

import React, { useState } from 'react';
import AddSessionHeader from './AddSessionHeader';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, getDocs } from 'firebase/firestore';

type AddSessionFormProps = {
  onBack: () => void;
};

const AddSessionForm: React.FC<AddSessionFormProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true); // Set processing state to true

    try {
      const startDateTimestamp = Timestamp.fromDate(new Date(startDate));
      const endDateTimestamp = Timestamp.fromDate(new Date(endDate));
      const createdAt = Timestamp.now(); // Get current timestamp for Created_At

      // Fetch existing sessions from Firestore
      const sessionsRef = collection(firestore, 'sessions');
      const sessionsQuery = query(sessionsRef);
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsData = sessionsSnapshot.docs.map((doc) => doc.data());

      // Check if the selected dates overlap with existing sessions
      const isOverlapping = sessionsData.some((session) => {
        const sessionStartDate = session.startDate.toDate();
        const sessionEndDate = session.endDate.toDate();
        const userStartDate = new Date(startDate);
        const userEndDate = new Date(endDate);

        // Check if user's selected dates overlap with any existing session
        return (
          (userStartDate >= sessionStartDate && userStartDate <= sessionEndDate) ||
          (userEndDate >= sessionStartDate && userEndDate <= sessionEndDate) ||
          (userStartDate <= sessionStartDate && userEndDate >= sessionEndDate)
        );
      });

      if (isOverlapping) {
        setSuccessMessage('The selected dates overlap with an existing session.');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        setIsProcessing(false); // Reset processing state
        return;
      }

      // If no overlap, proceed with adding the session
      await addDoc(collection(firestore, 'sessions'), {
        name,
        startDate: startDateTimestamp,
        endDate: endDateTimestamp,
        Session_Status: true, // Set Session_Status to true by default
        Created_At: createdAt,
        Updated_At: createdAt, // Set Updated_At to the same as Created_At initially
      });
      console.log('Session added to Firestore');
      setSuccessMessage('The session has been successfully created!');
      // Clear the form fields
      setName('');
      setStartDate('');
      setEndDate('');
      // Clear the message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error adding session:', error);
      setSuccessMessage('Failed to create session');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } finally {
      setIsProcessing(false); // Reset processing state
    }
  };

  return (
    <div className="bg-white rounded-md shadow-md">
      {/* Header Component */}
      <AddSessionHeader onBackToSessions={onBack} />

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 p-3" // Added background color
            placeholder="Enter session name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Starting Date *
            </label>
            <div className="relative">
              <input
                type="date"
                id="startDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 p-3" // Added background color
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {/* Calendar Icon */}
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Ending Date *
            </label>
            <div className="relative">
              <input
                type="date"
                id="endDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 p-3" // Added background color
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {/* Calendar Icon */}
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Button Section */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing} // Disable button while processing
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 border-4 border-blue-500 rounded-full border-t-transparent"
                  viewBox="0 0 24 24"
                />
                <span>Adding...</span>
              </div>
            ) : (
              <span>Add</span>
            )}
          </button>
        </div>
      </form>
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500 text-white font-bold py-2 px-4 rounded">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AddSessionForm;
