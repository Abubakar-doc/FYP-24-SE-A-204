'use client';

import React, { useState } from 'react';
import AddStudentHeader from './AddStudentHeader';
import { useSearchParams } from 'next/navigation';

type AddStudentFormProps = {
  onBack: () => void;
};

type Student = {
  rollNo: string;
  email: string;
  name: string;
  fee_paid: boolean;
};

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onBack }) => {
  const searchParams = useSearchParams();
  const formType = searchParams.get('formType') || 'simpleForm';

  const [rollNumber, setRollNumber] = useState('00-NTU-AA-0000');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feePaid] = useState('Yes');
  const [busCardStatus, setBusCardStatus] = useState('Yes');
  const [busCard, setBusCard] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [studentsArray, setStudentsArray] = useState<Student[]>([]);

  const validateInputs = () => {
    const rollNoRegex = /^\d{2}-NTU-[A-Z]{2}-\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateInputs()) {
      const newStudent: Student = {
        rollNo: rollNumber,
        email,
        name,
        fee_paid: feePaid === 'Yes',
      };

      setStudentsArray((prev) => {
        const updated = [...prev, newStudent];
        console.log('Updated Students Array:', updated);
        return updated;
      });

      setSuccessMessage('Student added successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <div className="bg-white w-full min-h-screen relative">
      <AddStudentHeader onBackToStudents={onBack} />

      <form onSubmit={handleSubmit} className="space-y-6 p-4 mx-6">
        {/* Row 1: Roll Number and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rollNumber" className="block text-sm font-semibold text-[#202020] mb-1">
              Roll Number *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                maxLength={2}
                pattern="\d{2}"
                title="Enter 2 digits"
                className="w-12 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
                value={rollNumber.split('-')[0] || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                  const parts = rollNumber.split('-');
                  parts[0] = val;
                  setRollNumber(`${parts[0] || ''}-NTU-${parts[2] || ''}-${parts[3] || ''}`);
                }}
                required
              />

              <span className="text-2xl font-bold">-NTU-</span>

              <input
                type="text"
                maxLength={2}
                pattern="[A-Za-z]{2}"
                title="Enter 2 letters"
                className="w-12 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 uppercase"
                value={rollNumber.split('-')[2] || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
                  const parts = rollNumber.split('-');
                  parts[2] = val;
                  setRollNumber(`${parts[0] || ''}-NTU-${parts[2] || ''}-${parts[3] || ''}`);
                }}
                required
              />

              <span className="text-2xl font-bold">-</span>

              <input
                type="text"
                maxLength={4}
                pattern="\d{4}"
                title="Enter 4 digits"
                className="w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
                value={rollNumber.split('-')[3] || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  const parts = rollNumber.split('-');
                  parts[3] = val;
                  setRollNumber(`${parts[0] || ''}-NTU-${parts[2] || ''}-${parts[3] || ''}`);
                }}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#202020]">
              Email *
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Row 2: Name and Fee Paid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-[#202020]">
              Name *
            </label>
            <input
              type="text"
              id="name"
              maxLength={50}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="feePaid" className="block text-sm font-semibold text-[#202020]">
              Fee Paid *
            </label>
            <select
              id="feePaid"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              value={feePaid}
              disabled
            >
              <option>Yes</option>
            </select>
          </div>
        </div>

        {/* Row 3: Bus Card Status and Bus Card - Conditionally rendered */}
        {formType === 'editForm' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="busCard" className="block text-sm font-semibold text-[#202020]">
                Bus Card
              </label>
              <input
                type="text"
                id="busCard"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
                placeholder="Tap here..."
                value={busCard}
                onChange={(e) => setBusCard(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="busCardStatus" className="block text-sm font-semibold text-[#202020]">
                Bus Card Status *
              </label>
              <select
                id="busCardStatus"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
                value={busCardStatus}
                onChange={(e) => setBusCardStatus(e.target.value)}
                required
              >
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-16 rounded focus:outline-none focus:shadow-outline"
          >
            {formType === 'editForm' ? 'Update' : 'Add'}
          </button>
        </div>
      </form>

      {/* Success and Error Messages */}
      {successMessage && (
        <div className="bg-green-500 text-white font-bold py-2 px-4 rounded mt-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-500 text-white font-bold py-2 px-4 rounded mt-4">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default AddStudentForm;
