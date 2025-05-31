"use client";

import React, { useState, useEffect, useRef } from "react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  query,
  where,
  getDoc,
} from "firebase/firestore";
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
  roll_no: string[];
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
  const [searchInput, setSearchInput] = useState("");
  const [activationError, setActivationError] = useState<string>("");

  // Ref to track previous roll_no array for active session to detect changes
  const previousRollNoRef = useRef<string[]>([]);

  // Track the currently active session (assuming only one active session)
  const activeSession = sessions.find((s) => s.session_status === "active") || null;

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
            roll_no: data.roll_no || [],
          };
        });

        // Sort sessions by start_date descending, nulls last
        const sortedSessions = sessionsData.sort((a, b) => {
          if (a.start_date === null) return 1;
          if (b.start_date === null) return -1;
          return b.start_date.getTime() - a.start_date.getTime();
        });

        setAllSessions(sortedSessions);

        // Filter active sessions initially
        const activeSessions = sortedSessions.filter(
          (session) => session.session_status === "active"
        );
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

  // New useEffect to watch roll_no changes in active session and update students/bus cards accordingly
  useEffect(() => {
    if (!activeSession) {
      previousRollNoRef.current = [];
      return;
    }

    const previousRollNos = previousRollNoRef.current;
    const currentRollNos = activeSession.roll_no || [];

    // Detect new roll numbers added to the active session
    const newRollNos = currentRollNos.filter((rollNo) => !previousRollNos.includes(rollNo));

    if (newRollNos.length > 0) {
      // Update students and bus cards for these new roll numbers
      const updateStudentsAndBusCards = async () => {
        try {
          const studentsCollection = collection(
            firestore,
            "users",
            "user_roles",
            "students"
          );
          const busCardsCollection = collection(firestore, "bus_cards");

          for (const rollNo of newRollNos) {
            // Update student bus_card_status to "Active"
            const studentQuery = query(studentsCollection, where("roll_no", "==", rollNo));
            const studentQuerySnapshot = await getDocs(studentQuery);

            for (const studentDoc of studentQuerySnapshot.docs) {
              const studentRef = doc(firestore, "users", "user_roles", "students", studentDoc.id);
              await updateDoc(studentRef, {
                bus_card_status: "Active",
                updated_at: Timestamp.now(),
              });
            }

            // Update bus card isActive flag to true
            const busCardQuery = query(busCardsCollection, where("roll_no", "==", rollNo));
            const busCardQuerySnapshot = await getDocs(busCardQuery);

            for (const busCardDoc of busCardQuerySnapshot.docs) {
              const busCardRef = doc(firestore, "bus_cards", busCardDoc.id);
              await updateDoc(busCardRef, {
                isActive: true,
                updated_at: Timestamp.now(),
              });
            }
          }
        } catch (error) {
          console.error("Error updating students/bus cards on roll_no change:", error);
        }
      };

      updateStudentsAndBusCards();
    }

    // Update ref to current roll_no array for next comparison
    previousRollNoRef.current = currentRollNos;
  }, [activeSession]);

  // Deactivate session and update related students and bus cards
  const handleDeactivateSession = async (sessionId: string) => {
    if (!sessionToDeactivate) return;

    setIsDeactivating(true);
    try {
      // Update session status to inactive
      const sessionRef = doc(firestore, "sessions", sessionId);
      await updateDoc(sessionRef, {
        session_status: "inactive",
        updated_at: Timestamp.now(),
      });

      const studentsCollection = collection(
        firestore,
        "users",
        "user_roles",
        "students"
      );

      const busCardsCollection = collection(firestore, "bus_cards");

      const rollNumbers = sessionToDeactivate.roll_no || [];

      // For each student roll_no in session, update student and bus card documents
      for (const rollNo of rollNumbers) {
        // Update student bus_card_status to "Inactive"
        const studentQuery = query(studentsCollection, where("roll_no", "==", rollNo));
        const studentQuerySnapshot = await getDocs(studentQuery);

        for (const studentDoc of studentQuerySnapshot.docs) {
          const studentRef = doc(firestore, "users", "user_roles", "students", studentDoc.id);
          await updateDoc(studentRef, {
            bus_card_status: "Inactive",
            updated_at: Timestamp.now(),
          });
        }

        // Update bus card isActive flag to false
        const busCardQuery = query(busCardsCollection, where("roll_no", "==", rollNo));
        const busCardQuerySnapshot = await getDocs(busCardQuery);

        for (const busCardDoc of busCardQuerySnapshot.docs) {
          const busCardRef = doc(firestore, "bus_cards", busCardDoc.id);
          await updateDoc(busCardRef, {
            isActive: false,
            updated_at: Timestamp.now(),
          });
        }
      }

      // Update local state to reflect deactivation
      const updatedSessions = allSessions.map((session) =>
        session.id === sessionId ? { ...session, session_status: "inactive" } : session
      );
      const sortedUpdatedSessions = updatedSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setAllSessions(sortedUpdatedSessions);
      const updatedActiveSessions = sortedUpdatedSessions.filter(
        (session) => session.session_status === "active"
      );
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

  // Activate session and update related students and bus cards
  const handleActivateSession = async (session: Session) => {
    setActivationError("");

    // Prevent activating if another session is already active
    const anotherActive = allSessions.some(
      (s) => s.session_status === "active"
    );
    if (anotherActive) {
      setActivationError("Please deactivate the current active session before activating a new one.");
      setTimeout(() => setActivationError(""), 3000);
      return;
    }

    // Prevent activating if session end date has passed
    if (session.end_date && session.end_date < new Date(new Date().setHours(0,0,0,0))) {
      setActivationError("Cannot activate session. The session end date has already passed.");
      setTimeout(() => setActivationError(""), 3000);
      return;
    }

    setIsDeactivating(true);
    try {
      // Update session document to active
      const sessionRef = doc(firestore, "sessions", session.id);
      await updateDoc(sessionRef, {
        session_status: "active",
        updated_at: Timestamp.now(),
      });

      const studentsCollection = collection(
        firestore,
        "users",
        "user_roles",
        "students"
      );

      const busCardsCollection = collection(firestore, "bus_cards");

      const rollNumbers = session.roll_no || [];

      // For each student roll_no in session, update student and bus card documents
      for (const rollNo of rollNumbers) {
        // Update student bus_card_status to "Active"
        const studentQuery = query(studentsCollection, where("roll_no", "==", rollNo));
        const studentQuerySnapshot = await getDocs(studentQuery);

        for (const studentDoc of studentQuerySnapshot.docs) {
          const studentRef = doc(firestore, "users", "user_roles", "students", studentDoc.id);
          await updateDoc(studentRef, {
            bus_card_status: "Active",
            updated_at: Timestamp.now(),
          });
        }

        // Update bus card isActive flag to true
        const busCardQuery = query(busCardsCollection, where("roll_no", "==", rollNo));
        const busCardQuerySnapshot = await getDocs(busCardQuery);

        for (const busCardDoc of busCardQuerySnapshot.docs) {
          const busCardRef = doc(firestore, "bus_cards", busCardDoc.id);
          await updateDoc(busCardRef, {
            isActive: true,
            updated_at: Timestamp.now(),
          });
        }
      }

      // Update local state to reflect activation
      const updatedSessions = allSessions.map((s) =>
        s.id === session.id ? { ...s, session_status: "active" } : s
      );
      const sortedUpdatedSessions = updatedSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setAllSessions(sortedUpdatedSessions);
      const updatedActiveSessions = sortedUpdatedSessions.filter(
        (s) => s.session_status === "active"
      );
      setSessions(updatedActiveSessions);
      setFilteredSessions(updatedActiveSessions);
      setFilterStatus("active");
    } catch (error) {
      console.error("Error activating session:", error);
      setActivationError("Failed to activate session.");
      setTimeout(() => setActivationError(""), 3000);
    } finally {
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

    if (inputValue === "") {
      setFilteredSessions(sessions);
    } else {
      const sessionsToFilter =
        filterStatus === "all"
          ? allSessions
          : filterStatus === "suspended"
          ? allSessions.filter((session) => session.session_status === "inactive")
          : sessions;
      const filtered = sessionsToFilter.filter((session) => {
        const name = session.name?.toLowerCase() ?? "";
        const startDate = session.start_date
          ?.toLocaleDateString()
          .toLowerCase() ?? "";
        const endDate = session.end_date?.toLocaleDateString().toLowerCase() ?? "";
        const status = session.session_status?.toLowerCase() ?? "";

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

    if (newFilterStatus === "all") {
      const sortedSessions = allSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setSessions(sortedSessions);
      setFilteredSessions(sortedSessions);
    } else if (newFilterStatus === "active") {
      const activeSessions = allSessions.filter(
        (session) => session.session_status === "active"
      );
      const sortedSessions = activeSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setSessions(sortedSessions);
      setFilteredSessions(sortedSessions);
    } else if (newFilterStatus === "suspended") {
      const inactiveSessions = allSessions.filter(
        (session) => session.session_status === "inactive"
      );
      const sortedSessions = inactiveSessions.sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
      setSessions(sortedSessions);
      setFilteredSessions(sortedSessions);
    }
  };

  // Helper to check if session can be activated
  const canActivate = (session: Session) => {
    if (!session.end_date) return false;
    // Allow activate if end_date is today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return session.end_date >= today;
  };

  return (
    <div className="w-full min-h-screen bg-white relative">
      {(isLoading && !isDeactivating) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <LoadingIndicator />
        </div>
      )}

      <div className="rounded-lg mb-2">
        <SessionsHeader
          onAddSession={() => {}}
          allSessions={allSessions}
          setSessions={setSessions}
          setFilterStatus={handleFilterChange}
          searchInput={searchInput}
          handleSearch={handleSearch}
          isLoading={isLoading || isDeactivating}
        />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <table className="w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%] border-b border-gray-300">
                  Sr#
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%] border-b border-gray-300">
                  Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">
                  Starting Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">
                  Ending Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">
                  Session Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {filteredSessions.map((session, index) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap w-[5%] border-b border-gray-300">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis border-b border-gray-300">
                    {session.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-[15%] border-b border-gray-300">
                    {session.start_date
                      ? session.start_date.toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-[15%] border-b border-gray-300">
                    {session.end_date ? session.end_date.toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-9 py-4 whitespace-nowrap w-[10%] border-b border-gray-300">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        session.session_status === "active"
                          ? "bg-green-500 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {session.session_status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex space-x-2 w-[15%] border-b border-gray-300">
                    {session.session_status === "active" ? (
                      <>
                        <button
                          className="text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2"
                          onClick={() => handleEditSession(session)}
                          disabled={session.session_status !== "active"}
                        >
                          Edit
                        </button>
                        <button
                          className="text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2"
                          onClick={() => openConfirmationModal(session)}
                          disabled={session.session_status !== "active"}
                        >
                          Deactivate
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-white font-bold bg-blue-500 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
                          disabled
                        >
                          Edit
                        </button>
                        <button
                          className={`text-white font-bold rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 ${
                            canActivate(session)
                              ? ""
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => canActivate(session) && handleActivateSession(session)}
                          disabled={!canActivate(session) || isDeactivating}
                        >
                          Activate
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(filterStatus === "all" || filterStatus === "suspended") && (
            <div className="flex items-center justify-between m-6">
              <div className="flex items-center">
                <label
                  htmlFor="rowsPerPage"
                  className="mr-2 text-sm text-gray-700"
                >
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
        {activationError && (
          <div className="fixed bottom-4 right-4 z-50 p-8 rounded-lg shadow-lg bg-red-500 text-white font-bold transition duration-600 animate-out">
            {activationError}
          </div>
        )}
      </div>

      {sessionToDeactivate && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={() => handleDeactivateSession(sessionToDeactivate.id)}
          sessionName={sessionToDeactivate.name}
          isProcessing={isDeactivating}
        />
      )}
    </div>
  );
};

export default SessionsContent;
