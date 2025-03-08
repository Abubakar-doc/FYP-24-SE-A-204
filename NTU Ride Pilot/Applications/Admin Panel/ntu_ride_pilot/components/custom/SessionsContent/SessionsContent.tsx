"use client";
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import SessionsHeader from "./SessionComponents/SessionsHeader";
import ConfirmationModal from "./SessionComponents/ConfirmationModal"; 
import { useRouter } from "next/navigation";

type Session = {
  id: string;
  name: string;
  start_date: Date | null;
  end_date: Date | null;
  session_status: string;
  created_at: any;
  updated_at: any;
};

const SessionsContent: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToDeactivate, setSessionToDeactivate] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "sessions"));
        const sessionsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            start_date: data.start_date?.toDate() || null,
            end_date: data.end_date?.toDate() || null,
            session_status: data.session_status,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        });

        const sortedSessions = sessionsData.sort((a, b) => {
          const aDate = a.start_date?.getTime() || 0;
          const bDate = b.start_date?.getTime() || 0;
          return bDate - aDate;
        });

        setAllSessions(sortedSessions);
        const activeSessions = sortedSessions.filter(session => session.session_status === "active");
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
    if (!sessionToDeactivate || sessionToDeactivate.id !== sessionId) return;
    
    try {
      const sessionRef = doc(firestore, "sessions", sessionId);
      await updateDoc(sessionRef, {
        session_status: "inactive",
        updated_at: Timestamp.now(),
      });
      
      const updatedSessions = allSessions.map(session => 
        session.id === sessionId ? { ...session, session_status: "inactive" } : session
      );

      const sortedUpdatedSessions = updatedSessions.sort((a, b) => {
        const aDate = a.start_date?.getTime() || 0;
        const bDate = b.start_date?.getTime() || 0;
        return bDate - aDate;
      });
      
      setAllSessions(sortedUpdatedSessions);
      const updatedActiveSessions = sortedUpdatedSessions.filter(session => session.session_status === "active");
      setSessions(updatedActiveSessions);
    } catch (error) {
      console.error("Error deactivating session:", error);
    } finally {
      setIsModalOpen(false);
    }
  };

  const openConfirmationModal = (session: Session) => {
    if (session.session_status !== "active") return;
    setSessionToDeactivate(session);
    setIsModalOpen(true);
  };

  const handleEditSession = (session: Session) => {
    if (session.session_status !== "active") return;
  
    // Construct URL with query parameters for the correct route
    const queryParams = new URLSearchParams({
      id: session.id,
      name: session.name,
      ...(session.start_date && { start_date: session.start_date.toISOString() }),
      ...(session.end_date && { end_date: session.end_date.toISOString() }),
    });
  
    // Navigate to the correct path
    router.push(`/dashboard/sessions/add-session?${queryParams}`);
  };
  
  
  

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="rounded-lg mb-6">
        <SessionsHeader 
          onAddSession={() => {}} 
          allSessions={allSessions} 
          setSessions={setSessions} 
          setFilterStatus={setFilterStatus} 
        />
      </div>

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
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Starting Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ending Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session, index) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{session.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {session.start_date?.toLocaleDateString() || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {session.end_date?.toLocaleDateString() || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      session.session_status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {session.session_status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex space-x-4">
                    <button
                      className={`text-blue-600 ${
                        session.session_status === "active" 
                          ? "hover:underline" 
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => handleEditSession(session)}
                      disabled={session.session_status !== "active"}
                    >
                      Edit
                    </button>
                    <button
                      className={`text-red-600 ${
                        session.session_status === "active" 
                          ? "hover:underline" 
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => openConfirmationModal(session)}
                      disabled={session.session_status !== "active"}
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
                <button className="px-3 py-1 border rounded-md hover:bg-gray-100">
                  &lt;
                </button>
                <button className="px-3 py-1 border rounded-md hover:bg-gray-100">
                  &gt;
                </button>
              </div>
            </div>
          )}

          {sessionToDeactivate && (
            <ConfirmationModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onConfirm={() => handleDeactivateSession(sessionToDeactivate.id)}
              sessionName={sessionToDeactivate.name}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SessionsContent;