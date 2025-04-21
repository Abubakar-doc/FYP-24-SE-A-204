"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import HeaderIcons from '../../HeaderIcons/HeaderIcons';
import StudentFilterDropdown from './StudentFilterDropdown';
import StudentsHeaderRow from './StudentsHeaderRow';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

interface Session {
  id: string;
  name: string;
  session_status: string;
}

const StudentsHeader: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const sessionsRef = collection(firestore, "sessions");
        const q = query(sessionsRef, where("session_status", "==", "active"));
        const querySnapshot = await getDocs(q);

        const sessionsData: Session[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Session, 'id'>),
        }));

        setActiveSessions(sessionsData);
        if (sessionsData.length > 0) {
          setSelectedSessionId(sessionsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching active sessions:", error);
      }
    };

    fetchActiveSessions();
  }, []);

  return (
    <div className="w-full h-44 bg-[#F5F5F5] p-4 rounded-md">
      {/* Row 1: Header Icons Row */}
      <div className="flex justify-end mb-4 mr-4">
        <HeaderIcons />
      </div>

      {/* Row 2: Title and Select Box */}
      <StudentsHeaderRow 
        sessions={activeSessions}
        onSessionSelect={(sessionId: string) => setSelectedSessionId(sessionId)}
      />

      {/* Row 3: Search, Filter Dropdown, and Add Students Button */}
      <div className="flex justify-end items-center space-x-4 mb-4 mr-4">
        {/* Search Input */}
        <div className="relative w-auto">
          <input
            type="text"
            placeholder="Search"
            className="w-[496px] px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        {/* Filter Dropdown */}
        <StudentFilterDropdown />

        {/* Add Students Button */}
        <Link href={`/dashboard/students/add-student?formType=simpleForm&sessionId=${selectedSessionId}`}>
          <button
            className="w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
          >
            Add Students
          </button>
        </Link>
      </div>
    </div>
  );
};

export default StudentsHeader;
