"use client"
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type ViewComplaintsHeaderProps = {
  onBackToComplaints: () => void;
  onResolve: () => void;
  resolveDisabled: boolean;
};

const ViewComplaintsHeader: React.FC<ViewComplaintsHeaderProps> = ({
  onBackToComplaints,
  onResolve,
  resolveDisabled
}) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>
      {/* Breadcrumbs and Resolve button in one row, spaced apart */}
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
        <button
          className="w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300 cursor-pointer"
          onClick={onResolve}
          disabled={resolveDisabled}
        >
          Resolve
        </button>
      </div>
    </div>
  );
};

export default ViewComplaintsHeader;
