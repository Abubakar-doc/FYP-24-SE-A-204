import React from 'react';
//import { ReactComponent as SearchIcon } from './SearchIcon.svg'; // Assuming you have a SearchIcon.svg file

interface HeaderSectionProps {
  onSearch?: (query: string) => void; // Optional search handler
  onFilter?: (filterValue: string) => void; // Optional filter handler
  onAddSession?: () => void; // Optional add session handler
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  onSearch,
  onFilter,
  onAddSession,
}) => {
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) {
      onSearch(event.target.value);
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (onFilter) {
      onFilter(event.target.value);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-semibold">Sessions</h2>
      <div className="flex items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            onChange={handleSearchInputChange}
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {/* Search Icon - Replace with your preferred icon */}
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
        <select
          className="ml-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          onChange={handleFilterChange}
        >
          <option>Filter by</option>
          {/* Add filter options here */}
          <option value="option1">Option 1</option>
          
        </select>
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
          onClick={onAddSession}
        >
          + Add Session
        </button>
      </div>
    </div>
  );
};

export default HeaderSection;
