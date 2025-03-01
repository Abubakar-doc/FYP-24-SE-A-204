// components/custom/SessionsContent/AddSessionForm.tsx
import React from 'react';

type AddSessionFormProps = {
  onBack: () => void;
};

const AddSessionForm: React.FC<AddSessionFormProps> = ({ onBack }) => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Add New Session</h2>
      {/* Add your form elements here */}
      <form>
        <div className="mb-4">
          <label htmlFor="sessionName" className="block text-gray-700 text-sm font-bold mb-2">
            Session Name:
          </label>
          <input
            type="text"
            id="sessionName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter session name"
          />
        </div>
        {/* Add more form fields as needed */}
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create Session
        </button>
        <button
          type="button"
          onClick={onBack}
          className="ml-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Back to Sessions
        </button>
      </form>
    </div>
  );
};

export default AddSessionForm;
