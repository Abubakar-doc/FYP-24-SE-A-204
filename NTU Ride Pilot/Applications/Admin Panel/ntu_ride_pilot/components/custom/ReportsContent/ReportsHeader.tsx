"use client";
import HeaderIcons from '../HeaderIcons/HeaderIcons';
import ReportFilterDropdown from './ReportFilterDropdown';
import { useState } from 'react';

interface ReportsHeaderProps {
  onGenerateReport: (filter: string) => void;
}

const ReportsHeader: React.FC<ReportsHeaderProps> = ({ onGenerateReport }) => {
  const [filter, setFilter] = useState("active"); // default One Day

  return (
    <div className="w-full h-32 bg-[#F5F5F5] p-4 rounded-md">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>

      {/* Main Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reports</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className='w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300'
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {/* Search Icon */}
              {/* SVG code goes here */}
            </button>
          </div>

          <ReportFilterDropdown value={filter} onChange={setFilter} />

          <button
            onClick={() => onGenerateReport(filter)}
            className="w-40 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsHeader;
