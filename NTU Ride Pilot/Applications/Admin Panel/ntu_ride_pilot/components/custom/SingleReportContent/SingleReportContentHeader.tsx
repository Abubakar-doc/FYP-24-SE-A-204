"use client";
import React from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';
import { useRouter } from 'next/navigation';

interface SingleReportContentHeaderProps {
  onBackToReports?: () => void; // Optional callback if you want to handle it externally
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

const SingleReportContentHeader: React.FC<SingleReportContentHeaderProps> = ({
  onBackToReports,
  searchTerm,
  onSearchTermChange,
}) => {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackToReports) {
      onBackToReports();
    } else {
      // Corrected path to match your folder structure
      router.push('/dashboard/reports/view-reports');
    }
  };

  return (
    <div className="w-full h-32 bg-[#F5F5F5] rounded-md p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>
      <div className='flex items-start justify-between'>
        <div className="text-2xl font-semibold">
          <button
            onClick={handleBackClick}
            className="hover:text-gray-700"
          >
            View Reports
          </button>
          <span className='text-[#0686CB] font-semibold'> &gt; </span>
          <span className='text-[#0686CB] font-semibold'>View Single Report</span>
        </div>

        {/* Right side: Search Input Field */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className='w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300'
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
            {/* Optional Search Icon */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleReportContentHeader;
