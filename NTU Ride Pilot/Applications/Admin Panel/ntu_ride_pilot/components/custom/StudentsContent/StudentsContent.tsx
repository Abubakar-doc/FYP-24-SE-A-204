"use client"
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import StudentsHeader from "./StudentComponents/StudentsHeader";



const StudentsContent: React.FC = () => {
  const router = useRouter();
  
  



  

  

  

  

  

  return (
    <div className="w-full min-h-screen bg-white relative">
     

      <div className="rounded-lg mb-2">
        <StudentsHeader/>
      </div>

      {/* <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
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
        </div>

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
      </div> */}

     
    </div>
  );
};

export default StudentsContent;
