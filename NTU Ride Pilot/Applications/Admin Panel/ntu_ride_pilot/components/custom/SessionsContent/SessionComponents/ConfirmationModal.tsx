"use client"
import React from 'react';

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionName: string;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, sessionName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold text-center">Confirm Deactivation</h2>
        <p className="mt-4 text-center">
          Are you sure you want to deactivate <strong>{sessionName}</strong>?
        </p>
        <p className="mt-2 text-center">
          If you proceed, all records for this session and all student records related to this session will be lost.
        </p>
        <div className="mt-4 flex justify-end space-x-4">
          <button className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400" onClick={onClose}>
            Cancel
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" onClick={onConfirm}>
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
