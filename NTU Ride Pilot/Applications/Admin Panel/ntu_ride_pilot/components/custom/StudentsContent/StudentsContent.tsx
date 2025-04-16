"use client"
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import StudentsHeader from "./StudentComponents/StudentsHeader";
import { FC } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

const StudentsContent: React.FC = () => {
  const router = useRouter();
  
  type Student = {
    id: number;
    name: string;
    rollNo: string;
    fee: 'Paid' | 'Not Paid';
    busCard: 'Active' | 'In Active';
  };
  
  const students: Student[] = [
    {
      id: 1,
      name: 'Ahad Raza',
      rollNo: '21-NTU-CS-1000',
      fee: 'Paid',
      busCard: 'Active',
    },
    {
      id: 2,
      name: 'Muzamil Tahir',
      rollNo: '21-NTU-CS-1001',
      fee: 'Not Paid',
      busCard: 'In Active',
    },
    {
      id: 3,
      name: 'Muzamil Tahir',
      rollNo: '21-NTU-CS-1001',
      fee: 'Not Paid',
      busCard: 'In Active',
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white relative">
      <div className="rounded-lg mb-2">
        <StudentsHeader/>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
      <div className="rounded-lg border border-gray-300 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%] border-b border-gray-300">ID</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%] border-b border-gray-300">Name</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Roll No</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Fee</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">Bus Card</th>
              <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-300 text-center">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap w-[5%]">{student.id}</td>
                <td className="px-4 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis">{student.name}</td>
                <td className="px-4 py-4 whitespace-nowrap w-[15%]">{student.rollNo}</td>
                <td className="px-4 py-4 whitespace-nowrap w-[15%]">{student.fee}</td>
                <td className="px-4 py-4 whitespace-nowrap w-[10%]">{student.busCard}</td>
                <td className="px-20 py-4 flex items-center space-x-2 ">
                  <Link href={`/dashboard/students/add-student?formType=editForm&studentId=${student.id}`}>
                    <Pencil className="w-4 h-4 cursor-pointer text-blue-500 hover:text-blue-700" />
                  </Link>
                  <Trash2 className="w-4 h-4 cursor-pointer text-red-500 hover:text-red-700" />
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