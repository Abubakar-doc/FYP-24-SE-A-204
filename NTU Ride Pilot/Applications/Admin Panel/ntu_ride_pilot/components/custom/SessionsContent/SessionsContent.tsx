"use client";
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import SessionsHeader from "./SessionComponents/SessionsHeader";

type Session = {
  id: string;
  name: string;
  start_date: Date | null; // Keep start_date as Date type
  end_date: Date | null; // Keep end_date as Date type
  session_status: string;
  created_at: any;
  updated_at: any;
};

const SessionsContent: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "sessions"));
        const sessionsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            start_date: data.start_date ? data.start_date.toDate() : null, // Convert Firestore Timestamp to Date
            end_date: data.end_date ? data.end_date.toDate() : null, // Convert Firestore Timestamp to Date
            session_status: data.session_status,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        });

        // Sort all sessions by start date in descending order
        const sortedSessions = sessionsData.sort((a, b) => {
          if (a.start_date === null) return 1;
          if (b.start_date === null) return -1;
          return b.start_date.getTime() - a.start_date.getTime(); // Descending order
        });

        setAllSessions(sortedSessions);
        // Initially show only active sessions
        const activeSessions = sortedSessions.filter((session) => session.session_status === "active");
        setSessions(activeSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleDeactivateSession = async (sessionId: string) => {
    try {
      const sessionRef = doc(firestore, "sessions", sessionId);
      await updateDoc(sessionRef, {
        session_status: "inactive",
        updated_at: Timestamp.now(),
      });
      const updatedSessions = allSessions.map((session) =>
        session.id === sessionId ? { ...session, session_status: "inactive" } : session
      );
      // Sort updated sessions
      const sortedUpdatedSessions = updatedSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime(); // Descending order
      });
      setAllSessions(sortedUpdatedSessions);
      const updatedActiveSessions = sortedUpdatedSessions.filter((session) => session.session_status === "active");
      setSessions(updatedActiveSessions); // Update the displayed sessions
    } catch (error) {
      console.error("Error deactivating session:", error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white ">
      {/* Header Section */}
      <div className="rounded-lg mb-6">
        {/* Pass allSessions to SessionsHeader */}
        <SessionsHeader onAddSession={() => {}} allSessions={allSessions} setSessions={setSessions} setFilterStatus={setFilterStatus} />
      </div>

      {/* Loading Animation */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <svg
            className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"
            viewBox="0 0 24 24"
          />
          <span className="ml-3 text-gray-700 text-lg">Loading...</span>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto">
          {/* Table Section */}
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Starting Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ending Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Session Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session, index) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{session.name}</td>
                  {/* Safely format dates for display */}
                  <td className="px-6 py-4 whitespace-nowrap">{session.start_date ? session.start_date.toLocaleDateString() : "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{session.end_date ? session.end_date.toLocaleDateString() : "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        session.session_status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {session.session_status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex space-x-4">
                    <button className="text-blue-600 hover:underline">Edit</button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDeactivateSession(session.id)}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Section */}
          {(filterStatus === "all" || filterStatus === "suspended") && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center">
                <label htmlFor="rowsPerPage" className="mr-2 text-sm text-gray-700">
                  Rows per page:
                </label>
                <select
                  id="rowsPerPage"
                  className="px-3 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm"
                >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:border-blue-300">
                  &lt;
                </button>
                <button className="px-3 py-1 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:border-blue-300">
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionsContent;
