"use client";

import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import RoutesHeader from './RoutesHeader';
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import { FaEye, FaTrashAlt } from 'react-icons/fa';

type RouteData = {
  id: string;
  name: string;
  busStops: { busStopName: string; latitude: number; longitude: number }[];
};

const RoutesContent: React.FC = () => {
  const router = useRouter();
  const [allRoutes, setAllRoutes] = useState<RouteData[]>([]); // all routes fetched
  const [routes, setRoutes] = useState<RouteData[]>([]); // filtered routes to display
  const [loading, setLoading] = useState<boolean>(true);

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Search query state
  const [searchQuery, setSearchQuery] = useState<string>("");

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

        setAllRoutes(fetchedRoutes);
        setRoutes(fetchedRoutes);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  // Filter routes when searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setRoutes(allRoutes);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();

    const filtered = allRoutes.filter(route => {
      const nameMatch = route.name.toLowerCase().includes(lowerQuery);
      // Check if query is a number or part of number of bus stops
      const stopsCountStr = route.busStops.length.toString();
      const stopsMatch = stopsCountStr.includes(lowerQuery);
      return nameMatch || stopsMatch;
    });

    setRoutes(filtered);
  }, [searchQuery, allRoutes]);

  const handleViewRoute = (id: string) => {
    router.push(`/dashboard/routes/add-route?view=${id}`);
  };

  // Open modal and set route to delete
  const handleDeleteClick = (route: RouteData) => {
    setRouteToDelete(route);
    setDeleteModalOpen(true);
  };

  // Confirm deletion
  const handleConfirmDelete = async () => {
    if (!routeToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, "routes", routeToDelete.id));
      // Remove from both allRoutes and routes
      setAllRoutes(prev => prev.filter(r => r.id !== routeToDelete.id));
      setRoutes(prev => prev.filter(r => r.id !== routeToDelete.id));
      setDeleteModalOpen(false);
      setRouteToDelete(null);
    } catch (error) {
      console.error("Error deleting route:", error);
      // Optionally, show error feedback to user here
    } finally {
      setDeleting(false);
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setRouteToDelete(null);
  };

  // Pass search state and setter to child
  const handleSearchChange = (value: string) => {
    setSearchQuery(value ?? ""); // Ensure never undefined/null
  };

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
        <RoutesHeader searchQuery={searchQuery ?? ""} onSearchChange={handleSearchChange} />
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
                          onClick={() => handleViewRoute(route.id)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          title="View Route"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(route)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                          title="Delete Route"
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
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && routeToDelete && (
        <DeleteModal
          routeName={routeToDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default RoutesContent;

// Modal Component
type DeleteModalProps = {
  routeName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
};

const DeleteModal: React.FC<DeleteModalProps> = ({ routeName, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
    <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
      <div className="mb-4 text-lg font-semibold text-gray-800 text-center">
        Are you sure to delete <span className="text-red-600 font-bold">{routeName}</span>?
      </div>
      <div className="flex justify-center space-x-4 mt-6">
        {/* Cancel button first, then Ok button */}
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
          disabled={deleting}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Ok"}
        </button>
      </div>
    </div>
  </div>
);
