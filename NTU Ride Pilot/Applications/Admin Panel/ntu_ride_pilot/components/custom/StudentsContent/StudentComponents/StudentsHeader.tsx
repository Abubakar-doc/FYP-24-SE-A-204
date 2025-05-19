"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderIcons from "../../HeaderIcons/HeaderIcons";
import StudentFilterDropdown from "./StudentFilterDropdown";
import StudentsHeaderRow from "./StudentsHeaderRow";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface Session {
  id: string;
  name: string;
  session_status: string;
}

interface StudentsHeaderProps {
  busCardFilter: "Active" | "Inactive" | "All";
  setBusCardFilter: (filter: "Active" | "Inactive" | "All") => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const StudentsHeader: React.FC<StudentsHeaderProps> = ({
  busCardFilter,
  setBusCardFilter,
  searchTerm,
  onSearchTermChange,
}) => {
  const router = useRouter();
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);

  useEffect(() => {
    const fetchActiveSessions = async () => {
      setLoadingSessions(true);
      try {
        const sessionsRef = collection(firestore, "sessions");
        const q = query(sessionsRef, where("session_status", "==", "active"));
        const querySnapshot = await getDocs(q);

        const sessionsData: Session[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Session, "id">),
        }));

        setActiveSessions(sessionsData);
        if (sessionsData.length > 0) {
          setSelectedSessionId(sessionsData[0].id);
        } else {
          setSelectedSessionId(""); // No active sessions
        }
      } catch (error) {
        console.error("Error fetching active sessions:", error);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchActiveSessions();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showError) {
      timer = setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showError]);

  const handleAddStudentClick = () => {
    setErrorMessage(""); // Clear previous errors
    setShowError(false);
    if (!selectedSessionId) {
      // No active session present
      setErrorMessage(
        "Please first create a New Active Session in order to Add Students in the System!"
      );
      setShowError(true);
      return;
    }
    // Client-side navigation without full reload
    router.push(
      `/dashboard/students/add-student?formType=simpleForm&sessionId=${selectedSessionId}`
    );
  };

  return (
    <div className="w-full h-44 bg-[#F5F5F5] p-4 rounded-md relative">
      {/* Row 1: Header Icons Row */}
      <div className="flex justify-end mb-4 mr-4">
        <HeaderIcons />
      </div>

      {/* Row 2: Title and Select Box */}
      <StudentsHeaderRow
        sessions={activeSessions}
        onSessionSelect={(sessionId: string) => setSelectedSessionId(sessionId)}
        loading={loadingSessions}
      />

      {/* Row 3: Search, Filter Dropdown, and Add Students Button */}
      <div className="flex justify-end items-center space-x-4 mb-4 mr-4">
        {/* Search Input */}
        <div className="relative w-auto">
          <input
            type="text"
            placeholder="Search"
            className="w-[520px] px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>

        {/* Filter Dropdown */}
        <StudentFilterDropdown value={busCardFilter} onChange={setBusCardFilter} />

        {/* Add Students Button */}
        <button
          onClick={handleAddStudentClick}
          className="w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
        >
          Add Students
        </button>
      </div>

      {/* Animated Error Message */}
      <div
        className={`absolute top-0 left-0 mt-2 ml-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-lg transform transition-transform duration-500 ease-in-out ${
          showError ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
        role="alert"
        aria-live="assertive"
      >
        {errorMessage}
      </div>
    </div>
  );
};

export default StudentsHeader;
