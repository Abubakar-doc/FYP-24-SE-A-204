// components/custom/SessionsContent/AddStudentHeader.tsx
import React from 'react';
import { FaCog, FaBell } from 'react-icons/fa'; // Import icons
import Link from 'next/link';
import UploadFile from './UploadFile';
import DownloadFile from './DownloadFile';

const AddStudentHeader: React.FC = () => {
  return (
    <div className="w-full bg-[#F5F5F5] rounded-md p-4">
      {/* Top Row: Icons */}
      <div className="flex justify-end items-center space-x-4 mb-2">
        <FaCog className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
        <FaBell className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
      </div>

      {/* Bottom Row: Breadcrumbs and Buttons */}
      <div className="flex justify-between items-center">
        {/* Left Side: Breadcrumbs */}
        <div className="flex items-start">
          <div className="text-black font-bold text-xl">
            <Link href="/students" className="hover:text-gray-700">
              Students
            </Link>
            <span> &gt; </span>
            <span className="text-[#0686CB] font-bold">Add Students</span>
          </div>
        </div>

        {/* Right Side: Buttons */}
        <div className="flex items-center space-x-4 p-6">
          <DownloadFile />
          <UploadFile />
        </div>
      </div>
    </div>
  );
};

export default AddStudentHeader;
