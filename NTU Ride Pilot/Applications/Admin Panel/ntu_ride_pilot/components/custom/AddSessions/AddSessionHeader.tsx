// components/custom/SessionsContent/AddSessionHeader.tsx
import React from 'react';
import { FaCog, FaBell } from 'react-icons/fa'; // Import icons
import Link from 'next/link';

const AddSessionHeader: React.FC = () => {
  return (
    <div className="w-full bg-[#F5F5F5] rounded-md p-4">
        <div className='flex justify-end items-center space-x-4'>
            <FaCog className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
            <FaBell className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
        </div>
        <div className='flex items-start'>
             <div className="text-black font-bold text-xl">
                <Link href="/sessions" className="hover:text-gray-700">
                    Sessions
                </Link>
                <span> &gt; </span>
                <span className='text-[#0686CB] font-bold'>Create Session</span>
             </div>
        </div>
    </div>
  );
};

export default AddSessionHeader;
