// components/custom/SessionsContent/UploadFile.tsx
import React from 'react';

const UploadFile: React.FC = () => {
  return (
    <div className="w-full">
      <button className="bg-[#0686CB] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center">
        {/* Upload Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.8-6.385m16.5 0a4.5 4.5 0 01-1.8 6.385M19.5 10.125a3 3 0 11-6 0 3 3 0 016 0zm-12 0a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Upload .XLSX File
      </button>
    </div>
  );
};

export default UploadFile;
