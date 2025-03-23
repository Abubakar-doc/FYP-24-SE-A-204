"use client";
import React, { useState, useEffect } from 'react';

type SessionFilterDropdownProps = {
  allSessions: any[];
  setSessions: (sessions: any[]) => void;
  setFilterStatus: (filterStatus: string) => void;
  disabled: boolean;
};

const SessionFilterDropdown: React.FC<SessionFilterDropdownProps> = ({ 
  allSessions, 
  setSessions, 
  setFilterStatus,
  disabled 
}) => {
  const [filterStatusState, setFilterStatusState] = useState('active');

  useEffect(() => {
    handleFilterChange({ target: { value: 'active' } } as React.ChangeEvent<HTMLSelectElement>);
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = e.target.value;
    setFilterStatusState(selectedStatus);
    setFilterStatus(selectedStatus);

    if (selectedStatus === 'all') {
      const sortedSessions = sortSessions(allSessions);
      setSessions(sortedSessions);
    } else if (selectedStatus === 'active') {
      const activeSessions = allSessions.filter(session => session.session_status === 'active');
      const sortedSessions = sortSessions(activeSessions);
      setSessions(sortedSessions);
    } else if (selectedStatus === 'suspended') {
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
      return dateB.getTime() - dateA.getTime();
    });
  };

  return (
    <div className="relative w-auto">
      <select
        value={filterStatusState}
        onChange={handleFilterChange}
        className={`w-full bg-blue-500 text-white px-6 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300 appearance-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={disabled}
      >
        <option value="active">Active</option>
        <option value="all">All</option>
        <option value="suspended">Suspended</option>
      </select>

      {/* Custom Dropdown Arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white font-bold text-2xl">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"/>
        </svg>
      </div>
    </div>
  );
};

export default SessionFilterDropdown;
