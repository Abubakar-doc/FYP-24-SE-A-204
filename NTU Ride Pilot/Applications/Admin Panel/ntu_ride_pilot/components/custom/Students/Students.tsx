// StudentContent.tsx
import React from 'react';
import { useState } from 'react';

interface StudentContentProps {
  onSearch?: (query: string) => void; // Optional search handler
  onFilter?: (filterValue: string) => void; // Optional filter handler
  onAddStudent?: () => void; // Optional add student handler - now required!
}

const StudentContent: React.FC<StudentContentProps> = ({
  onSearch,
  onFilter,
  onAddStudent, // Destructure the onAddStudent prop
}) => {
  const [selectedSession, setSelectedSession] = useState<string>('Session BS Spring 2024');

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

  const handleSessionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSession(event.target.value);
  };

  return (
    <div className="p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Students</h2>
        <div className="flex items-center">

          {/* Session Dropdown */}
          <select
            className="mr-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            value={selectedSession}
            onChange={handleSessionChange}
          >
            <option>Session BS Spring 2024</option>
            {/* Add more session options here */}
            <option value="session2">Session 2</option>
            <option value="session3">Session 3</option>
            <option value="session3">Session 3</option>
          </select>

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
            <option value="option2">Option 2</option>
          </select>
          <button
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
            onClick={onAddStudent}  // Call the onAddStudent prop when the button is clicked
          >
            + Add Students
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roll No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bus Card
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">1</td>
              <td className="px-6 py-4 whitespace-nowrap">Ahad Raza</td>
              <td className="px-6 py-4 whitespace-nowrap">21-NTU-CS-1000</td>
              <td className="px-6 py-4 whitespace-nowrap">Paid</td>
              <td className="px-6 py-4 whitespace-nowrap">Active</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {/* Action Icons - Replace with your preferred icons */}
                <a href="#" className="text-blue-500 hover:text-blue-700">
                  Edit
                </a>
                <a href="#" className="text-red-500 hover:text-red-700 ml-2">
                  Delete
                </a>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">2</td>
              <td className="px-6 py-4 whitespace-nowrap">Muzamil Tahir</td>
              <td className="px-6 py-4 whitespace-nowrap">21-NTU-CS-1001</td>
              <td className="px-6 py-4 whitespace-nowrap">Not Paid</td>
              <td className="px-6 py-4 whitespace-nowrap">In Active</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {/* Action Icons - Replace with your preferred icons */}
                <a href="#" className="text-blue-500 hover:text-blue-700">
                  Edit
                </a>
                <a href="#" className="text-red-500 hover:text-red-700 ml-2">
                  Delete
                </a>
              </td>
            </tr>
            {/* Add more rows as needed */}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
          <label htmlFor="rowsPerPage" className="mr-2 text-sm text-gray-700">
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            className="px-2 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm"
          >
            <option>10</option>
            {/* Add more options here */}
          </select>
        </div>
        <div className="flex items-center">
          <button className="px-3 py-1 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:border-blue-300">
            &lt;
          </button>
          <button className="ml-2 px-3 py-1 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:border-blue-300">
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentContent;
