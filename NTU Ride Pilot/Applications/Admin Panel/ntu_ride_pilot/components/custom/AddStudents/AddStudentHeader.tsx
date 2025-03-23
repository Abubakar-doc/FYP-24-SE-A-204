// AddStudentHeader.tsx
import React from 'react';
import { FaCog, FaBell } from 'react-icons/fa'; // Import icons
import Link from 'next/link';
import UploadFile from './UploadFile';
import DownloadFile from './DownloadFile';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type AddStudentHeaderProps = {
  onBackToStudents: () => void;
};

const AddStudentHeader: React.FC<AddStudentHeaderProps> = ({ onBackToStudents }) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4 mb-4">
       {/* Header Icons Row */}
       <div className="flex justify-end mb-2 mr-4">
        <HeaderIcons />
      </div>

      {/* Bottom Row: Breadcrumbs and Buttons */}
      <div className="flex justify-between items-center">
        {/* Left Side: Breadcrumbs */}
        <div className="flex items-start">
          <div className="text-2xl font-semibold">
            <button onClick={onBackToStudents} className="hover:text-gray-700">
              Students
            </button>
            <span className='text-[#0686CB] font-semibold'> &gt; </span>
            <span className='text-[#0686CB] font-semibold'>Add Student</span>
          </div>
        </div>

        {/* Right Side: Buttons */}
        <div className="flex items-center space-x-4 p-4">
          <DownloadFile />
          <UploadFile />
        </div>
      </div>
    </div>
  );
};

export default AddStudentHeader;
