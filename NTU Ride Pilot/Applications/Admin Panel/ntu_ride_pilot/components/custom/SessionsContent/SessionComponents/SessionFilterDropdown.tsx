"use client";
import React, { useState } from 'react';

type SessionFilterDropdownProps = {
  allSessions: any[];
  setSessions: (sessions: any[]) => void;
  setFilterStatus: (filterStatus: string) => void;
};

const SessionFilterDropdown: React.FC<SessionFilterDropdownProps> = ({ allSessions, setSessions, setFilterStatus }) => {
  const [filterStatusState, setFilterStatusState] = useState('');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = e.target.value;
    setFilterStatusState(selectedStatus);
    setFilterStatus(selectedStatus);

    let filteredSessions = allSessions;
    
    if (selectedStatus === 'active') {
      filteredSessions = allSessions.filter(session => session.session_status === 'active');
    } else if (selectedStatus === 'suspended') {
      filteredSessions = allSessions.filter(session => session.session_status === 'inactive');
    } else if (selectedStatus === '') {
      filteredSessions = allSessions.filter(session => session.session_status === 'active');
    }

    const sortedSessions = sortSessions(filteredSessions);
    setSessions(sortedSessions);
  };

  const sortSessions = (sessions: any[]) => {
    return sessions.sort((a, b) => {
      if (a.start_date === null) return 1;
      if (b.start_date === null) return -1;
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateB.getTime() - dateA.getTime(); // Descending order
    });
  };

  return (
    <div className="relative w-auto">
      <select
        value={filterStatusState}
        onChange={handleFilterChange}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300 appearance-none"
      >
        <option value="">Filter by</option>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>
  );
};

export default SessionFilterDropdown;