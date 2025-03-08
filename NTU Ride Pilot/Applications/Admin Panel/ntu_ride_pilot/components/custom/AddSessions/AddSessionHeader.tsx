"use client"
import React from 'react';
import { FaCog, FaBell } from 'react-icons/fa'; // Import icons

type AddSessionHeaderProps = {
  onBackToSessions: () => void; // Callback to go back to sessions
};


const AddSessionHeader: React.FC<AddSessionHeaderProps> = ({ onBackToSessions }) => {
  return (
    <div className="w-full bg-[#F5F5F5] rounded-md p-4">
        <div className='flex justify-end items-center space-x-4'>
            <FaCog className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
            <FaBell className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
        </div>
        <div className='flex items-start'>
             <div className="text-black font-bold text-xl">
                <button
                  onClick={onBackToSessions} // Use the callback function here
                  className="hover:text-gray-700"
                >
                    Sessions
                </button>
                <span> &gt; </span>
                <span className='text-[#0686CB] font-bold'>Create Session</span>
             </div>
        </div>
    </div>
  );
};

export default AddSessionHeader;
