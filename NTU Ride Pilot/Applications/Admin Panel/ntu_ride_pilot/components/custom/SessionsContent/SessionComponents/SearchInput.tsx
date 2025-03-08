"use client";

import React, { useEffect } from "react";

type SearchInputProps = {
  allSessions: any[];
  setSessions: (sessions: any[]) => void;
  filterStatus: string; // Added prop to determine current filter status
  searchTerm: string; // Controlled search term state
  setSearchTerm: (term: string) => void; // Function to update search term state
};

const SearchInput: React.FC<SearchInputProps> = ({ allSessions, setSessions, filterStatus, searchTerm, setSearchTerm }) => {

  useEffect(() => {
    handleSearch(); // Call search whenever the search term or filter changes
  }, [searchTerm, filterStatus]);

  const handleSearch = () => {
    let filteredSessions = allSessions;

    // Filter sessions based on the selected filter status
    if (filterStatus === "active") {
      filteredSessions = allSessions.filter(session => session.session_status === "active");
    } else if (filterStatus === "suspended") {
      filteredSessions = allSessions.filter(session => session.session_status === "inactive");
    } else if (filterStatus === "all") {
      filteredSessions = allSessions; // Show all sessions for "All"
    }

    // Further filter based on the search term
    if (searchTerm) {
      filteredSessions = filteredSessions.filter((session) =>
        session.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Update the sessions in the parent component
    setSessions(filteredSessions);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
      />
      <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
        {/* Search Icon */}
        {/* SVG code for search icon can be added here */}
      </button>
    </div>
  );
};

export default SearchInput;
