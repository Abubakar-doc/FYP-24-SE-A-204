"use client";
import React from "react";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionName: string;
  isProcessing?: boolean;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sessionName,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold text-center">Confirm Deactivation</h2>
        <p className="mt-4 text-center">
          Are you sure you want to deactivate <strong>{sessionName}</strong>?
        </p>
        <p className="mt-2 text-center">
          If you proceed, all Bus Cards of Students for this Session will be Inactive
        </p>

        {isProcessing && (
          <div className="flex justify-center my-4">
            {/* Simple spinner animation */}
            <svg
              className="animate-spin h-8 w-8 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
