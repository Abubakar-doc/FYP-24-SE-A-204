"use client";
import Link from 'next/link';
import HeaderIcons from '../HeaderIcons/HeaderIcons';
import ComplaintsFilterDropdown from './ComplaintsFilterDropdown';

type ComplaintsHeaderProps = {
  filter: "all" | "active" | "suspended";
  setFilter: (value: "all" | "active" | "suspended") => void;
  search: string;
  setSearch: (value: string) => void;
};

const ComplaintsHeader: React.FC<ComplaintsHeaderProps> = ({
  filter,
  setFilter,
  search,
  setSearch,
}) => {
  return (
    <div className="w-full h-32 bg-[#F5F5F5] p-4 rounded-md">
      {/* Header Icons Row */}
      <div className="flex justify-end mb-6 mr-4">
        <HeaderIcons />
      </div>

      {/* Main Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Complaints</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300'
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {/* Search Icon */}
              {/* SVG code goes here */}
            </button>
          </div>

          <ComplaintsFilterDropdown filter={filter} setFilter={setFilter} />
        </div>
      </div>
    </div>
  );
};

export default ComplaintsHeader;
