"use client"
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type AddDriverHeaderProps = {
  onBackToDriver: () => void; // Callback to go back to sessions
};


const AddDriverHeader: React.FC<AddDriverHeaderProps> = ({ onBackToDriver }) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>
      <div className='flex items-start'>
        <div className="text-2xl font-semibold">
          <button
            onClick={onBackToDriver} // Use the callback function here
            className="hover:text-gray-700"
          >
            Driver
          </button>
          <span className='text-[#0686CB] font-semibold'> &gt; </span>
          <span className='text-[#0686CB] font-semibold'>Add Driver</span>
        </div>
      </div>
    </div>
  );
};

export default AddDriverHeader;
