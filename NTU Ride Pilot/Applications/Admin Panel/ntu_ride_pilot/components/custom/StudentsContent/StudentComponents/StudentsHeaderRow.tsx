"use client";
import React, { useEffect } from "react";

interface Session {
  id: string;
  name: string;
}

interface StudentsHeaderRowProps {
  sessions: Session[];
  onSessionSelect: (sessionId: string) => void;
  loading: boolean;
}

const StudentsHeaderRow: React.FC<StudentsHeaderRowProps> = ({
  sessions,
  onSessionSelect,
  loading,
}) => {
  useEffect(() => {
    if (!loading && sessions.length > 0) {
      onSessionSelect(sessions[0].id);
    }
  }, [sessions, onSessionSelect, loading]);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    onSessionSelect(selectedId);
  };

  return (
    <div className="flex items-center justify-between mb-4 mr-4">
      <h2 className="text-2xl font-semibold">Students</h2>
      <div className="relative w-[800px]">
        <select
          onChange={handleSessionChange}
          className="w-full bg-blue-500 text-white px-6 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300 appearance-none"
          disabled={loading}
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? (
            <option>Session Loading....</option>
          ) : sessions.length === 0 ? (
            <option>No Active Session</option>
          ) : (
            sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))
          )}
        </select>

        {/* Custom Dropdown Arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white font-bold text-2xl">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StudentsHeaderRow;
