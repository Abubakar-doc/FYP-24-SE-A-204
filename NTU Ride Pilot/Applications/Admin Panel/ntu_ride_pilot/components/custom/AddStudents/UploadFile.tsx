// components/custom/SessionsContent/UploadFile.tsx
import React from 'react';
import { BsArrowUpCircle } from 'react-icons/bs'; // Import the upload icon

const UploadFile: React.FC = () => {
  return (
    <div className="w-full">
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 w-80 rounded-md focus:outline-none focus:ring focus:border-blue-300 flex items-center justify-center">
        {/* Upload Icon */}
        <BsArrowUpCircle className="w-5 h-5 mr-2 text-white text-2xl hover:bg-blue-700" />
        Upload .XLSX File
      </button>
    </div>
  );
};

export default UploadFile;
