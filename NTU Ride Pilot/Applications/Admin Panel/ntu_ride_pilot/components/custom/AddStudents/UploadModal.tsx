import React from 'react';
import { FaCheck } from 'react-icons/fa';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  progress: number;
  step1Completed: boolean;
  step2Completed: boolean;
};

const UploadModal: React.FC<UploadModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  progress, 
  step1Completed, 
  step2Completed 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Steps */}
        <div className="mb-6">
          <div className={`flex items-center mb-2 ${step1Completed ? 'text-green-600' : 'text-red-600'}`}>
            {step1Completed && <FaCheck className="mr-2" />}
            <span>Step 1: Upload an Excel File (must be Standarized Excel format (.xlsx))</span>
          </div>
          <div className={`flex items-center ${step2Completed ? 'text-green-600' : 'text-red-600'}`}>
            {step2Completed && <FaCheck className="mr-2" />}
            <span>Step 2: Read the Uploaded Excel File</span>
          </div>
        </div>
        
        {children}
      </div>
    </div>
  );
};

export default UploadModal;