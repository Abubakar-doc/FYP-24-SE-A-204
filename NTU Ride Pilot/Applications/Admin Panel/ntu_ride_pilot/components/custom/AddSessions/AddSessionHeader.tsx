"use client"
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type AddSessionHeaderProps = {
  onBackToSessions: () => void; // Callback to go back to sessions
};


const AddSessionHeader: React.FC<AddSessionHeaderProps> = ({ onBackToSessions }) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-10 mr-4">
        <HeaderIcons />
      </div>
      <div className='flex items-start'>
        <div className="text-2xl font-semibold">
          <button
            onClick={onBackToSessions} // Use the callback function here
            className="hover:text-gray-700"
          >
            Sessions
          </button>
          <span className='text-[#0686CB] font-semibold'> &gt; </span>
          <span className='text-[#0686CB] font-semibold'>Create Session</span>
        </div>
      </div>
    </div>
  );
};

export default AddSessionHeader;
