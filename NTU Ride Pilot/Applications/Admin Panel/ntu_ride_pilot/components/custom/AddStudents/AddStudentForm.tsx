import React, { useState } from 'react';
import AddStudentHeader from './AddStudentHeader';
import { useSearchParams } from 'next/navigation';

type AddStudentFormProps = {
  onBack: () => void;
};

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onBack }) => {
  const searchParams = useSearchParams();
  const formType = searchParams.get('formType') || 'simpleForm';
  
  const [rollNumber, setRollNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feePaid, setFeePaid] = useState('Yes');
  const [busCardStatus, setBusCardStatus] = useState('Yes');
  const [busCard, setBusCard] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission and response
    if (rollNumber && name && email) {
      setSuccessMessage('Student added successfully!');
      setErrorMessage('');
      // Clear the message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } else {
      setErrorMessage('Unknown Error Occurred');
      setSuccessMessage('');
      // Clear the message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };

  return (
    <div className="bg-white w-full min-h-screen relative">
      <AddStudentHeader onBackToStudents={onBack} />

      <form onSubmit={handleSubmit} className="space-y-6 p-4 mx-6">
        {/* Row 1: Roll Number and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rollNumber" className="block text-sm font-semibold text-[#202020]">
              Roll Number *
            </label>
            <input
              type="text"
              id="rollNumber"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
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
              onChange={(e) => setFeePaid(e.target.value)}
              required
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