"use client"
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import SessionsHeader from "./SessionComponents/SessionsHeader";
import ConfirmationModal from "./SessionComponents/ConfirmationModal";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

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
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToDeactivate, setSessionToDeactivate] = useState<Session | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "sessions"));
        const sessionsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            start_date: data.start_date ? data.start_date.toDate() : null,
            end_date: data.end_date ? data.end_date.toDate() : null,
            session_status: data.session_status,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        });

        const sortedSessions = sessionsData.sort((a, b) => {
          if (a.start_date === null) return 1;
          if (b.start_date === null) return -1;
          return b.start_date.getTime() - a.start_date.getTime();
        });

        setAllSessions(sortedSessions);
        const activeSessions = sortedSessions.filter((session) => session.session_status === "active");
        setSessions(activeSessions);
        setFilteredSessions(activeSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleDeactivateSession = async (sessionId: string) => {
    setIsDeactivating(true);
    try {
      const sessionRef = doc(firestore, "sessions", sessionId);
      await updateDoc(sessionRef, {
        session_status: "inactive",
        updated_at: Timestamp.now(),
      });
      const updatedSessions = allSessions.map((session) =>
        session.id === sessionId ? { ...session, session_status: "inactive" } : session
      );
      const sortedUpdatedSessions = updatedSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setAllSessions(sortedUpdatedSessions);
      const updatedActiveSessions = sortedUpdatedSessions.filter((session) => session.session_status === "active");
      setSessions(updatedActiveSessions);
      setFilteredSessions(updatedActiveSessions);
      setFilterStatus("active");
    } catch (error) {
      console.error("Error deactivating session:", error);
    } finally {
      setIsModalOpen(false);
      setIsDeactivating(false);
    }
  };

  const openConfirmationModal = (session: Session) => {
    setSessionToDeactivate(session);
    setIsModalOpen(true);
  };

  const handleEditSession = (session: Session) => {
    if (session.session_status !== "active") return;

    if (!session.start_date || !session.end_date) {
      console.error("Session start or end date is missing.");
      return;
    }

    const queryParams = new URLSearchParams({
      id: session.id,
      name: session.name,
      start_date: session.start_date.toISOString().split("T")[0],
      end_date: session.end_date.toISOString().split("T")[0],
      edit: "true",
    });

    router.push(`/dashboard/sessions/add-session?${queryParams}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toLowerCase();
    setSearchInput(inputValue);

    if (inputValue === '') {
      setFilteredSessions(sessions);
    } else {
      const sessionsToFilter = filterStatus === 'all' ? allSessions : 
                               filterStatus === 'suspended' ? allSessions.filter(session => session.session_status === 'inactive') :
                               sessions;

      const filtered = sessionsToFilter.filter(session => {
        const name = session.name?.toLowerCase() ?? '';
        const startDate = session.start_date?.toLocaleDateString().toLowerCase() ?? '';
        const endDate = session.end_date?.toLocaleDateString().toLowerCase() ?? '';
        const status = session.session_status?.toLowerCase() ?? '';

        return (
          name.includes(inputValue) ||
          startDate.includes(inputValue) ||
          endDate.includes(inputValue) ||
          status.includes(inputValue)
        );
      });

      setFilteredSessions(filtered);
    }
  };

  const handleFilterChange = (newFilterStatus: string) => {
    setFilterStatus(newFilterStatus);

    if (newFilterStatus === 'all') {
      const sortedSessions = allSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setSessions(sortedSessions);
      setFilteredSessions(sortedSessions);
    } else if (newFilterStatus === 'active') {
      const activeSessions = allSessions.filter(session => session.session_status === 'active');
      const sortedSessions = activeSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setSessions(sortedSessions);
      setFilteredSessions(sortedSessions);
    } else if (newFilterStatus === 'suspended') {
      const inactiveSessions = allSessions.filter(session => session.session_status === 'inactive');
      const sortedSessions = inactiveSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setSessions(sortedSessions);
      setFilteredSessions(sortedSessions);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white relative">
      {isLoading || isDeactivating ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <LoadingIndicator />
        </div>
      ) : null}

      <div className="rounded-lg mb-2">
        <SessionsHeader
          onAddSession={() => { }}
          allSessions={allSessions}
          setSessions={setSessions}
          setFilterStatus={handleFilterChange}
          searchInput={searchInput}
          handleSearch={handleSearch}
          isLoading={isLoading || isDeactivating} // Added isLoading prop
        />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <table className="w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%] border-b border-gray-300">Sr#</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%] border-b border-gray-300">Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Starting Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Ending Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">Session Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {filteredSessions.map((session, index) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap w-[5%] border-b border-gray-300">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis border-b border-gray-300">{session.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap w-[15%] border-b border-gray-300">{session.start_date ? session.start_date.toLocaleDateString() : "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap w-[15%] border-b border-gray-300">{session.end_date ? session.end_date.toLocaleDateString() : "N/A"}</td>
                  <td className="px-9 py-4 whitespace-nowrap w-[10%] border-b border-gray-300">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${session.session_status === "active"
                        ? "bg-green-500 text-white"
                        : "bg-red-600 text-white"
                        }`}
                    >
                      {session.session_status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex space-x-2 w-[15%] border-b border-gray-300">
                    <button
                      className={`${session.session_status === "active"
                        ? "text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2 "
                        : "text-white opacity-50 bg-blue-500 px-4 py-2 rounded-lg font-bold cursor-not-allowed"
                        }`}
                      onClick={() => handleEditSession(session)}
                      disabled={session.session_status !== "active"}
                    >
                      Edit
                    </button>
                    <button
                      className={`${session.session_status === "active"
                        ? "text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2"
                        : "text-white font-bold rounded-lg bg-slate-500 px-4 py-2 opacity-50 cursor-not-allowed"
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
          <div className="flex items-center justify-between m-6">
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
        </div>

     
      </div>

      {sessionToDeactivate && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={() => handleDeactivateSession(sessionToDeactivate.id)}
          sessionName={sessionToDeactivate.name}
        />
      )}
    </div>
  );
};

export default SessionsContent;
