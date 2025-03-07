"use client";
import Link from 'next/link';
import HeaderIcons from '../../HeaderIcons/HeaderIcons';
import SessionFilterDropdown from './SessionFilterDropdown';
import { useState } from 'react';

type SessionsHeaderProps = {
  onAddSession: () => void;
  allSessions: any[];
  setSessions: (sessions: any[]) => void; // Add this prop
  setFilterStatus: (filterStatus: string) => void; // Add this prop
};

const SessionsHeader: React.FC<SessionsHeaderProps> = ({ onAddSession, allSessions, setSessions, setFilterStatus }) => {
  
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
              {/* Search Icon */}
              {/* SVG code goes here */}
            </button>
          </div>

          {/* Pass the required props to SessionFilterDropdown */}
          <SessionFilterDropdown
            allSessions={allSessions}
            setSessions={setSessions}
            setFilterStatus={setFilterStatus}
          />

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
