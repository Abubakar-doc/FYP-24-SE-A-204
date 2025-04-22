"use client";
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import StudentsHeader from "./StudentComponents/StudentsHeader";
import StudentEditButton from "./StudentEditButton";
import StudentDeleteButton from "./StudentDeleteButton";

const StudentsContent: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch students from Firestore
  const fetchStudents = async () => {
    try {
      const studentsCollection = collection(
        firestore,
        "users",
        "user_roles",
        "students"
      );
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map((doc) => doc.data());
      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Refresh list after delete
  const handleStudentDeleted = () => {
    fetchStudents();
  };

  return (
    <div className="w-full min-h-screen bg-white relative">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <LoadingIndicator />
        </div>
      )}

      <div className="rounded-lg mb-2">
        <StudentsHeader />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%] border-b border-gray-300">
                  ID
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%] border-b border-gray-300">
                  Name
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">
                  Roll No
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">
                  Fee
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">
                  Bus Card
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300 text-center">
              {students.map((student, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap w-[5%]">{index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis">
                    {student.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap w-[15%]">{student.roll_no}</td>
                  <td className="px-4 py-4 whitespace-nowrap w-[15%]">
                    {student.fee_paid ? "Paid" : "Not Paid"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap w-[10%]">-</td>
                  <td className="px-20 py-4 flex items-center space-x-2 ">
                    <StudentEditButton rollNo={student.roll_no} />
                    <StudentDeleteButton
                      rollNo={student.roll_no}
                      onDelete={handleStudentDeleted}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsContent;
