"use client";

import Link from 'next/link';
import HeaderIcons from '../HeaderIcons/HeaderIcons';
import React from 'react';

type RoutesHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

const RoutesHeader: React.FC<RoutesHeaderProps> = ({ searchQuery, onSearchChange }) => {
  
  return (
    <div className="w-full h-32 bg-[#F5F5F5] p-4 rounded-md">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>

      {/* Main Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Routes</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className='w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300'
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2" type="button" aria-label="Search">
              {/* Search Icon */}
              {/* You can add SVG icon here if needed */}
            </button>
          </div>

          
          
          <Link href="/dashboard/routes/add-route">
            <button
              className="w-40 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
            >
              Add Route
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoutesHeader;
