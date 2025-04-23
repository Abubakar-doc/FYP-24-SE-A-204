"use client";

import React from "react";

interface StudentFilterDropdownProps {
  value: "Active" | "InActive" | "All";
  onChange: (value: "Active" | "InActive" | "All") => void;
}

const StudentFilterDropdown: React.FC<StudentFilterDropdownProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="relative w-auto">
      <select
        className="w-full bg-blue-500 text-white text-start px-6 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300 appearance-none"
        value={value}
        onChange={e => onChange(e.target.value as "Active" | "InActive" | "All")}
      >
        <option value="Active">Active</option>
        <option value="InActive">InActive</option>
        <option value="All">All</option>
      </select>
      {/* Custom Dropdown Arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white font-bold text-xl">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 .436 .445 .408 .197 .406 .418-.406-.418-.695-.502-.695-.502-.217-.223-.502-.335-.787-.335s-.57-.112-.789-.335c-.287z"/>
        </svg>
      </div>
    </div>
  );
};

export default StudentFilterDropdown;
