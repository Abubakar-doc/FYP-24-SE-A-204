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
  const [allRoutes, setAllRoutes] = useState<RouteData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
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
      setAllRoutes(prev => prev.filter(r => r.id !== routeToDelete.id));
      setRoutes(prev => prev.filter(r => r.id !== routeToDelete.id));
      setDeleteModalOpen(false);
      setRouteToDelete(null);
    } catch (error) {
      console.error("Error deleting route:", error);
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
    setSearchQuery(value ?? "");
  };

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}

      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen">
        {/* HEADER: sticky at top, does not scroll */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <RoutesHeader searchQuery={searchQuery ?? ""} onSearchChange={handleSearchChange} />
          </div>
        </div>

        {/* BODY: fills remaining height, scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">Sr#</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[45%]">Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[30%]">Stops</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-center">
                  {routes.length === 0 ? (
                    <tr className="border-b border-gray-300">
                      <td colSpan={4} className="py-6 text-gray-500">
                        No routes found.
                      </td>
                    </tr>
                  ) : (
                    routes.map((route, index) => (
                      <tr key={route.id} className="hover:bg-gray-50 border-b border-gray-300">
                        <td className="px-6 py-4 whitespace-nowrap w-[10%]">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap w-[45%] overflow-hidden text-ellipsis">{route.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap w-[30%]">{route.busStops.length}</td>
                        <td className="px-20 py-4 flex items-center space-x-2 justify-center">
                            <button
                              className="text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2"
                              onClick={() => handleViewRoute(route.id)}
                              title="View Route"
                            >
                              View
                            </button>
                            <button
                              className="text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2"
                              onClick={() => handleDeleteClick(route)}
                              title="Delete Route"
                            >
                              Delete
                            </button>
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
        {/* END BODY */}
      </div>
      {/* END MAIN CONTENT */}

      {/* Loading overlay for UI consistency */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <LoadingIndicator message="Loading routes..." />
        </div>
      )}

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
