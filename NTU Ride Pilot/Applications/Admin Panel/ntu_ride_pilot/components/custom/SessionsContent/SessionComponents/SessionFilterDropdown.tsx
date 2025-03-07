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

    if (selectedStatus === '') {
      // Reset filter to normal case (show only active sessions)
      const activeSessions = allSessions.filter(session => session.session_status === 'active');
      const sortedSessions = sortSessions(activeSessions);
      setSessions(sortedSessions);
    } else if (selectedStatus === 'all') {
      // Show all sessions
      const sortedSessions = sortSessions(allSessions);
      setSessions(sortedSessions);
    } else if (selectedStatus === 'active') {
      // Show only active sessions
      const activeSessions = allSessions.filter(session => session.session_status === 'active');
      const sortedSessions = sortSessions(activeSessions);
      setSessions(sortedSessions);
    } else if (selectedStatus === 'suspended') {
      // Show only inactive sessions
      const inactiveSessions = allSessions.filter(session => session.session_status === 'inactive');
      const sortedSessions = sortSessions(inactiveSessions);
      setSessions(sortedSessions);
    }
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

      {/* Custom Dropdown Arrow */}
      {/* SVG for dropdown arrow goes here */}
    </div>
  );
};

export default SessionFilterDropdown;
