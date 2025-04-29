"use client";
import Link from "next/link";
import HeaderIcons from "../HeaderIcons/HeaderIcons";
import DriverFilterDropdown from "./DriverFilterDropdown";
import React from "react";

type DriversHeaderProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

const DriversHeader: React.FC<DriversHeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] p-4 rounded-md">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>

      {/* Main Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Drivers</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search drivers by name, contact or email"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2" type="button" aria-label="Search">
              {/* You can put a search icon SVG here */}
            </button>
          </div>

          <DriverFilterDropdown />
          <Link href="/dashboard/drivers/add-driver">
            <button
              className="w-40 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
            >
              Add Driver
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DriversHeader;
