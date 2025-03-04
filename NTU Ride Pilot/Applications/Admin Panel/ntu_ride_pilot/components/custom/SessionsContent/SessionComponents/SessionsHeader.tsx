"use client";
import Link from 'next/link';
import HeaderIcons from '../../HeaderIcons/HeaderIcons';

type SessionsHeaderProps = {
  onAddSession: () => void;
};

const SessionsHeader: React.FC<SessionsHeaderProps> = ({ onAddSession }) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] p-4">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-4">
        <HeaderIcons />
      </div>

      {/* Main Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Sessions</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Filter Dropdown Styled to Match the Button */}
          <div className="relative w-40">
            <select className="w-full bg-blue-500 text-white px-4 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300 appearance-none">
              <option>Filter by</option>
            </select>
            {/* Custom Dropdown Arrow */}
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Add Session Button with Same Width as Filter */}
          <Link href="/dashboard/sessions/add-session">
            <button
              className="w-40 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
              onClick={onAddSession}
            >
              + Add Session
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SessionsHeader;
