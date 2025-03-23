// components/custom/SessionsContent/DownloadFile.tsx
import React from 'react';
import { BsArrowDownCircle } from 'react-icons/bs'; // Import the download icon

const DownloadFile: React.FC = () => {
  return (
    <div className="w-full">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 w-80 focus:outline-none focus:ring focus:border-blue-300 rounded-md flex items-center justify-center">
        {/* Download Icon */}
        <BsArrowDownCircle className="w-5 h-5 mr-2 text-white text-2xl hover:bg-blue-700" />
        Download .XLSX File
      </button>
    </div>
  );
};

export default DownloadFile;
