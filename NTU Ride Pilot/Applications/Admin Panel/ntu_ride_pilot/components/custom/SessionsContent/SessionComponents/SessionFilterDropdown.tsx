"use client";
import React, { useState } from 'react';

type SessionFilterDropdownProps = {
  sessions: any[];
  allSessions: any[];
  setSessions: (sessions: any[]) => void;
};

const SessionFilterDropdown: React.FC<SessionFilterDropdownProps> = ({ sessions, allSessions, setSessions }) => {
  const [filterStatus, setFilterStatus] = useState('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = e.target.value;
    setFilterStatus(selectedStatus);

    if (selectedStatus === 'all') {
      // Show all sessions
      setSessions(allSessions);
    } else if (selectedStatus === 'active') {
      // Show only active sessions
      const activeSessions = allSessions.filter(session => session.session_status === 'active');
      setSessions(activeSessions);
    } else if (selectedStatus === 'suspended') {
      // Show only inactive sessions
      const inactiveSessions = allSessions.filter(session => session.session_status === 'inactive');
      setSessions(inactiveSessions);
    }
  };

  return (
    <div className="relative w-40">
      <select
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300 appearance-none"
        value={filterStatus}
        onChange={handleFilterChange}
      >
        <option value="">Filter by</option>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
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
  );
};

export default SessionFilterDropdown;