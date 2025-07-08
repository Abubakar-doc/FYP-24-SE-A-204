// File: components/custom/ViewReportsHeader.tsx
"use client";
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';

type ViewReportsHeaderProps = {
  onBackToReports: () => void; // Callback to go back to sessions
  searchTerm: string; // For the search input
  onSearchTermChange: (value: string) => void; // For updating search term
  onDeleteAll: () => void; // For the Delete All button click
};

const ViewReportsHeader: React.FC<ViewReportsHeaderProps> = ({ 
  onBackToReports,
  searchTerm,
  onSearchTermChange,
  onDeleteAll
}) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>
      <div className='flex items-start justify-between'>
        <div className="text-2xl font-semibold">
          <button
            onClick={onBackToReports}
            className="hover:text-gray-700"
          >
            Reports
          </button>
          <span className='text-[#0686CB] font-semibold'> &gt; </span>
          <span className='text-[#0686CB] font-semibold'>View Reports</span>
        </div>

        {/* Right side: Search Input Field and Delete All button */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className='w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300'
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>

          <button
            onClick={onDeleteAll}
            className="w-40 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
          >
            Delete All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewReportsHeader;
