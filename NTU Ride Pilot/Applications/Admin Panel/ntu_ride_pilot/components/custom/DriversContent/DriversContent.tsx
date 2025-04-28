"use client"
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import DriversHeader from "./DriversHeader";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

const DriversContent: React.FC = () => {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch drivers from Firestore
  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const driversCollection = collection(
        firestore,
        "users",
        "user_roles",
        "drivers"
      );
      const driversSnapshot = await getDocs(driversCollection);
      const driversList = driversSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversList);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Navigate to /dashboard/drivers/add-driver with driver data for editing
  const handleEdit = (driver: any) => {
    const encodedDriver = encodeURIComponent(JSON.stringify(driver));
    router.push(`/dashboard/drivers/add-driver?driver=${encodedDriver}`);
  };

  // Show delete confirmation modal
  const handleDeleteClick = (driver: any) => {
    setDriverToDelete(driver);
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!driverToDelete) return;
    setIsDeleting(true);
    try {
      const driverDocRef = doc(
        firestore,
        "users",
        "user_roles",
        "drivers",
        driverToDelete.id
      );
      await deleteDoc(driverDocRef);
      setShowDeleteModal(false);
      setDriverToDelete(null);
      // Refresh drivers list
      fetchDrivers();
    } catch (error) {
      console.error("Failed to delete driver:", error);
      alert("Failed to delete driver. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDriverToDelete(null);
  };

  return (
    <div className="w-full min-h-screen bg-white relative">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
          <LoadingIndicator />
        </div>
      )}

      <div className="rounded-lg mb-2">
        <DriversHeader />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%] border-b border-gray-300">ID</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[35%] border-b border-gray-300">Name</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[20%] border-b border-gray-300">Contact</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%] border-b border-gray-300">Email</th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%] border-b border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300 text-center">
              {drivers.map((driver, index) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap w-[5%]">{index + 1}</td>
                  <td className="px-4 py-4 whitespace-nowrap w-[35%] overflow-hidden text-ellipsis">{driver.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap w-[20%]">{driver.contact_no}</td>
                  <td className="px-4 py-4 whitespace-nowrap w-[25%]">{driver.email}</td>
                 
                  <td className="px-20 py-4 flex items-center space-x-2 w-[15%] justify-center bg-red-500">
                    <button
                      className="text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2"
                      onClick={() => handleEdit(driver)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2"
                      onClick={() => handleDeleteClick(driver)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && driverToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 max-w-full">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure to delete <span className="text-red-600">{driverToDelete.name}</span>?
            </h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none"
              >
                {isDeleting ? 'Deleting...' : 'Ok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversContent;
