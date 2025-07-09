"use client"
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type ViewComplaintsHeaderProps = {
  onBackToComplaints: () => void;
};

const ViewComplaintsHeader: React.FC<ViewComplaintsHeaderProps> = ({
  onBackToComplaints,
}) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>
      {/* Breadcrumbs */}
      <div className="flex items-start justify-between">
        <div className="text-2xl font-semibold">
          <button
            onClick={onBackToComplaints}
            className="hover:text-gray-700"
          >
            Complaints
          </button>
          <span className='text-[#0686CB] font-semibold'> &gt; </span>
          <span className='text-[#0686CB] font-semibold'>View Complaints</span>
        </div>
      </div>
    </div>
  );
};

export default ViewComplaintsHeader;
