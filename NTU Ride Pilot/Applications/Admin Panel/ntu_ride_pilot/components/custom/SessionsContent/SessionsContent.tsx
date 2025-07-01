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
} from "firebase/firestore";
import SessionsHeader from "./SessionComponents/SessionsHeader";
import ConfirmationModal from "./SessionComponents/ConfirmationModal";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import Pagination from "./SessionComponents/Pagination";

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
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionToDeactivate, setSessionToDeactivate] = useState<Session | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [activationError, setActivationError] = useState<string>("");

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 20, 30, 40, 50];
  const [currentPage, setCurrentPage] = useState(1); // Changed from currentLoadedCount

  const previousRollNoRef = useRef<string[]>([]);
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

        const sortedSessions = sessionsData.sort((a, b) => {
          if (a.start_date === null) return 1;
          if (b.start_date === null) return -1;
          return b.start_date.getTime() - a.start_date.getTime();
        });
        setAllSessions(sortedSessions);
        setSessions(sortedSessions);
        setFilteredSessions(sortedSessions);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    if (!activeSession) {
      previousRollNoRef.current = [];
      return;
    }
    const previousRollNos = previousRollNoRef.current;
    const currentRollNos = activeSession.roll_no || [];
    const newRollNos = currentRollNos.filter((rollNo) => !previousRollNos.includes(rollNo));
    if (newRollNos.length > 0) {
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
            const studentQuery = query(studentsCollection, where("roll_no", "==", rollNo));
            const studentQuerySnapshot = await getDocs(studentQuery);
            for (const studentDoc of studentQuerySnapshot.docs) {
              const studentRef = doc(firestore, "users", "user_roles", "students", studentDoc.id);
              await updateDoc(studentRef, {
                bus_card_status: "Active",
                updated_at: Timestamp.now(),
              });
            }
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
    previousRollNoRef.current = currentRollNos;
  }, [activeSession]);

  const handleDeactivateSession = async (sessionId: string) => {
    if (!sessionToDeactivate) return;
    setIsDeactivating(true);
    try {
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
      for (const rollNo of rollNumbers) {
        const studentQuery = query(studentsCollection, where("roll_no", "==", rollNo));
        const studentQuerySnapshot = await getDocs(studentQuery);
        for (const studentDoc of studentQuerySnapshot.docs) {
          const studentRef = doc(firestore, "users", "user_roles", "students", studentDoc.id);
          await updateDoc(studentRef, {
            bus_card_status: "Inactive",
            updated_at: Timestamp.now(),
          });
        }
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
      setCurrentPage(1);
    } catch (error) {
      console.error("Error deactivating session:", error);
    } finally {
      setIsModalOpen(false);
      setIsDeactivating(false);
    }
  };

  const handleActivateSession = async (session: Session) => {
    setActivationError("");
    const anotherActive = allSessions.some(
      (s) => s.session_status === "active"
    );
    if (anotherActive) {
      setActivationError("Please deactivate the current active session before activating a new one.");
      setTimeout(() => setActivationError(""), 3000);
      return;
    }
    if (session.end_date && session.end_date < new Date(new Date().setHours(0,0,0,0))) {
      setActivationError("Cannot activate session. The session end date has already passed.");
      setTimeout(() => setActivationError(""), 3000);
      return;
    }
    setIsDeactivating(true);
    try {
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
      for (const rollNo of rollNumbers) {
        const studentQuery = query(studentsCollection, where("roll_no", "==", rollNo));
        const studentQuerySnapshot = await getDocs(studentQuery);
        for (const studentDoc of studentQuerySnapshot.docs) {
          const studentRef = doc(firestore, "users", "user_roles", "students", studentDoc.id);
          await updateDoc(studentRef, {
            bus_card_status: "Active",
            updated_at: Timestamp.now(),
          });
        }
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
      setCurrentPage(1);
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
    let sessionsToFilter: Session[] = [];
    if (filterStatus === "all") {
      sessionsToFilter = allSessions;
    } else if (filterStatus === "suspended") {
      sessionsToFilter = allSessions.filter((session) => session.session_status === "inactive");
    } else {
      sessionsToFilter = sessions;
    }
    if (inputValue === "") {
      setFilteredSessions(sessionsToFilter);
      setCurrentPage(1);
    } else {
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
      setCurrentPage(1);
    }
  };

  const handleFilterChange = (newFilterStatus: string) => {
    setFilterStatus(newFilterStatus);
    let sortedSessions: Session[] = [];
    if (newFilterStatus === "all") {
      sortedSessions = [...allSessions].sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
    } else if (newFilterStatus === "active") {
      sortedSessions = allSessions.filter(
        (session) => session.session_status === "active"
      ).sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
    } else if (newFilterStatus === "suspended") {
      sortedSessions = allSessions.filter(
        (session) => session.session_status === "inactive"
      ).sort((a, b) => {
        if (a.start_date === null) return 1;
        if (b.start_date === null) return -1;
        return b.start_date.getTime() - a.start_date.getTime();
      });
    }
    setSessions(sortedSessions);
    setFilteredSessions(sortedSessions);
    setCurrentPage(1);
  };

  const canActivate = (session: Session) => {
    if (!session.end_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return session.end_date >= today;
  };

  // Pagination logic: show only current page rows
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredSessions.length / rowsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setIsLoading(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsLoading(false);
      }, 500);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setIsLoading(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const showPagination = filteredSessions.length > rowsPerPage;

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Loading overlay - covers only the session content, not sidebar */}
        {(isLoading && !isDeactivating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator message="Loading sessions..." />
          </div>
        )}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
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
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%]">
                      Sr#
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[35%]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Starting Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Ending Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Session Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSessions.map((session, index) => (
                    <tr
                      key={session.id}
                      className="hover:bg-gray-50 border-b border-gray-300 text-center"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-[5%]">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[35%] overflow-hidden text-ellipsis">
                        {session.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[15%]">
                        {session.start_date
                          ? session.start_date.toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[15%]">
                        {session.end_date ? session.end_date.toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-12 py-4 whitespace-nowrap w-[15%]">
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
                      <td className="px-6 py-4 whitespace-nowrap flex space-x-2 w-[15%]">
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
              {/* Pagination controls */}
              {showPagination && (
                <Pagination
                  currentLoadedCount={currentPage * rowsPerPage}
                  totalRows={filteredSessions.length}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={rowsPerPageOptions}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  isNextDisabled={currentPage >= totalPages}
                  isPrevDisabled={currentPage <= 1}
                />
              )}
            </div>
            {activationError && (
              <div className="fixed bottom-4 right-4 z-50 p-8 rounded-lg shadow-lg bg-red-500 text-white font-bold transition duration-600 animate-out">
                {activationError}
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
            isProcessing={isDeactivating}
          />
        )}
      </div>
    </div>
  );
};

export default SessionsContent;
