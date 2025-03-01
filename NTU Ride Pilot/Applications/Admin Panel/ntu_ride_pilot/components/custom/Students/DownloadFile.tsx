// components/custom/SessionsContent/DownloadFile.tsx
import React from 'react';

const DownloadFile: React.FC = () => {
  return (
    <div className="w-full">
      <button className="bg-[#0686CB] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center">
        {/* Download Icon */}
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
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-2.25m-9-6l4.5 4.5M12 9v7.25a2.25 2.25 0 002.25 2.25h.75"
          />
        </svg>
        Download .XLSX File
      </button>
    </div>
  );
};

export default DownloadFile;
