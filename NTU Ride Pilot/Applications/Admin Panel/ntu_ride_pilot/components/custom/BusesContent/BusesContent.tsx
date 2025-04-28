"use client"
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import BusesHeader from "./BusesHeader";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";



const BusesContent: React.FC = () => {
  const router = useRouter();

  const buses = [
    {
      "reg_no": "FDY-1808",
    },
    {
      "reg_no": "FDJ-102",
    },
    {
      "reg_no": "FDJ-21",
    },
    {
      "reg_no": "FDJ-101",
    },
    {
      "reg_no": "FDJ-125",
    },
    {
      "reg_no": "FDJ-124",
    },
    {
      "reg_no": "FDJ-221",
    },
    {
      "reg_no": "FDJ-24",
    },
    {
      "reg_no": "FDJ-25",
    },
    {
      "reg_no": "FDJ-1022",
    }
  ]



  return (
    <div className="w-full min-h-screen bg-white relative">


      <div className="rounded-lg mb-2">
        <BusesHeader />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">ID</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[60%] border-b border-gray-300">Registration No</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[30%] border-b border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300 text-center">
              {buses.map((bus, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap w-[10%]">{index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap w-[60%] overflow-hidden text-ellipsis">{bus.reg_no}</td>
                 
                  <td className="px-20 py-4 flex items-center space-x-2 w-[30%] ml-12">
                  
                    <button
                      className="text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2"
                    >
                      Delete
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  );
};

export default BusesContent;
