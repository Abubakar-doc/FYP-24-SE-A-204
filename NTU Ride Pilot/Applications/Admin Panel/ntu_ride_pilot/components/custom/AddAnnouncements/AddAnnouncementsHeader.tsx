"use client";
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type AddAnnouncementsHeaderProps = {
  onBackToBus: () => void;
  isViewMode: boolean;  // <-- NEW PROP
};

const AddAnnouncementsHeader: React.FC<AddAnnouncementsHeaderProps> = ({ onBackToBus, isViewMode }) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>
      <div className='flex items-start'>
        <div className="text-2xl font-semibold">
          <button
            onClick={onBackToBus}
            className="hover:text-gray-700"
          >
            Announcement
          </button>
          <span className='text-[#0686CB] font-semibold'> &gt; </span>
          <span className='text-[#0686CB] font-semibold'>
            {isViewMode ? 'View Announcement' : 'Add Announcement'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AddAnnouncementsHeader;
