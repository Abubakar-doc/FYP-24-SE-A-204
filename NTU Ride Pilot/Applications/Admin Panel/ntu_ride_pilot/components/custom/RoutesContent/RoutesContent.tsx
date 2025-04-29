"use client";

import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import RoutesHeader from './RoutesHeader';
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import { FaEye, FaTrashAlt } from 'react-icons/fa'; // Import required icons

type RouteData = {
  id: string;
  name: string;
  busStops: { busStopName: string; latitude: number; longitude: number }[];
};

const RoutesContent: React.FC = () => {
  const router = useRouter();

  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const routesCollection = collection(firestore, "routes");
        const snapshot = await getDocs(routesCollection);

        const fetchedRoutes: RouteData[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unnamed Route",
            busStops: data.busStops || [],
          };
        });

        setRoutes(fetchedRoutes);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white relative flex items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white relative">
      <div className="rounded-lg mb-2">
        <RoutesHeader />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <table className="w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">Sr#</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[45%] border-b border-gray-300">Name</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[30%] border-b border-gray-300">Stops</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-gray-500">
                    No routes found.
                  </td>
                </tr>
              ) : (
                routes.map((route, index) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap w-[10%] border-b border-gray-300">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap w-[45%] overflow-hidden text-ellipsis border-b border-gray-300">{route.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap w-[30%] border-b border-gray-300">{route.busStops.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap w-[15%] border-b border-gray-300">
                      <div className="flex justify-center space-x-0">
                        <button
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          title="View Route"
                          // Add your view handler here
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                          title="Delete Route"
                          // Add your delete handler here
                        >
                          <FaTrashAlt className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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

export default RoutesContent;
