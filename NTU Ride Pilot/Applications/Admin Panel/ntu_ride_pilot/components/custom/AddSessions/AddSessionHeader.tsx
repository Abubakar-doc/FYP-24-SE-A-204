"use client";
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type AddSessionHeaderProps = {
  onBackToSessions: () => void; // Callback to go back to sessions
  isEdit: boolean; // New prop to determine Add or Edit mode
};

const AddSessionHeader: React.FC<AddSessionHeaderProps> = ({ onBackToSessions, isEdit }) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>
      <div className='flex items-start'>
        <div className="text-2xl font-semibold">
          <button
            onClick={onBackToSessions}
            className="hover:text-gray-700"
          >
            Sessions
          </button>
          <span className='text-[#0686CB] font-semibold'> &gt; </span>
          <span className='text-[#0686CB] font-semibold'>
            {isEdit ? "Edit Session" : "Add Session"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AddSessionHeader;
