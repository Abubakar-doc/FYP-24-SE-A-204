"use client"
import React, { useState, useEffect } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';


type Session = {
  id: string;
  name: string;
  startDate: any; // Use 'any' for now, or define a more specific type if needed
  endDate: any; // Use 'any' for now, or define a more specific type if needed
};



const SessionsContent: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'sessions'));
        const sessionsData = querySnapshot.docs.map((doc) => {
          const session: Session = {
            id: doc.id, ...doc.data(),
            name: '',
            startDate: undefined,
            endDate: undefined
          };
          if (session.startDate && session.endDate) {
            session.startDate = session.startDate.toDate().toLocaleDateString();
            session.endDate = session.endDate.toDate().toLocaleDateString();
          }
          return session;
        });
        setSessions(sessionsData);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Sessions</h2>
        <div className="flex items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {/* Search Icon - Replace with your preferred icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <select className="ml-2 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300">
            <option>Filter by</option>
            {/* Add filter options here */}
          </select>
          <Link href="/dashboard/sessions/add-session">
            <button
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
            >
              + Add Session
            </button>
          </Link>

        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Starting Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ending Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="px-6 py-4 whitespace-nowrap">{session.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{session.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{session.startDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">{session.endDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Action Icons - Replace with your preferred icons */}
                  <a href="#" className="text-blue-500 hover:text-blue-700">
                    Edit
                  </a>
                  <a href="#" className="text-red-500 hover:text-red-700 ml-2">
                    Delete
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
          <label htmlFor="rowsPerPage" className="mr-2 text-sm text-gray-700">
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            className="px-2 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm"
          >
            <option>10</option>
            {/* Add more options here */}
          </select>
        </div>
        <div className="flex items-center">
          <button className="px-3 py-1 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:border-blue-300">
            &lt;
          </button>
          <button className="ml-2 px-3 py-1 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:border-blue-300">
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionsContent;
