"use client";
import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import DriversHeader from "./DriversHeader";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import Pagination from "./Pagination"; 

const DriversContent: React.FC = () => {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 20, 30, 40, 50];
  const [currentLoadedCount, setCurrentLoadedCount] = useState(10);

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
        ...doc.data(),
      }));
      setDrivers(driversList);
      setFilteredDrivers(driversList);
      setCurrentLoadedCount(rowsPerPage);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line
  }, []);

  // Filter drivers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDrivers(drivers);
      setCurrentLoadedCount(rowsPerPage);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = drivers.filter((driver) => {
      return (
        (driver.name?.toLowerCase().includes(lowerQuery)) ||
        (driver.contactNo?.toLowerCase().includes(lowerQuery)) ||
        (driver.email?.toLowerCase().includes(lowerQuery))
      );
    });
    setFilteredDrivers(filtered);
    setCurrentLoadedCount(rowsPerPage);
  }, [searchQuery, drivers, rowsPerPage]);

  // Navigate to /dashboard/drivers/add-driver with driver data for editing
  const handleEdit = (driver: any) => {
    const driverDataForEdit = {
      ...driver,
      contact_no: driver.contactNo,
      profile_pic_link: driver.profilePicLink,
      profile_pic_public_id: driver.profilePicPublicId,
    };
    const encodedDriver = encodeURIComponent(JSON.stringify(driverDataForEdit));
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
      // 1. Delete driver profile picture from Cloudinary via backend API if publicId exists
      if (driverToDelete.profilePicPublicId) {
        try {
          const response = await fetch('/api/delete-cloudinary-media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicIds: [driverToDelete.profilePicPublicId] }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete driver profile picture from Cloudinary');
          }
        } catch (cloudinaryError) {
          console.error("Error deleting driver profile picture from Cloudinary:", cloudinaryError);
          alert(`Driver profile picture deletion failed: ${(cloudinaryError as Error).message}`);
        }
      }
      // 2. Delete driver document from Firestore
      await deleteDoc(driverDocRef);

      // 3. Delete driver account from Firebase Authentication via API (existing logic)
      if (driverToDelete.email) {
        try {
          const response = await fetch('/api/delete-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: driverToDelete.email }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete auth user');
          }
        } catch (authError: any) {
          console.error("Error deleting driver from authentication:", authError);
          alert(`Driver data deleted but auth account deletion failed: ${authError.message || authError}`);
        }
      }

      setShowDeleteModal(false);
      setDriverToDelete(null);
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

  // Pagination logic: progressive loading
  const paginatedDrivers = filteredDrivers.slice(0, currentLoadedCount);

  const handleNext = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newCount = Math.min(currentLoadedCount + rowsPerPage, filteredDrivers.length);
      setCurrentLoadedCount(newCount);
      setIsLoading(false);
    }, 500);
  };

  const handlePrev = () => {
    setCurrentLoadedCount(rowsPerPage);
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentLoadedCount(rows);
  };

  const showPagination = filteredDrivers.length > rowsPerPage;

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}

      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Loading overlay - covers only the driver content, not sidebar */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator message="Loading drivers..." />
          </div>
        )}

        {/* HEADER: sticky at top, does not scroll */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <DriversHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        </div>

        {/* BODY: fills remaining height, scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%]">
                      ID
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[35%]">
                      Name
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[20%]">
                      Contact
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%]">
                      Email
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white text-center">
                  {paginatedDrivers.map((driver, index) => (
                    <tr key={driver.id} className="hover:bg-gray-50 border-b border-gray-300">
                      <td className="px-4 py-4 whitespace-nowrap">{index + 1}</td>
                      <td className="px-4 py-4 whitespace-nowrap overflow-hidden text-ellipsis">{driver.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{driver.contactNo}</td>
                      <td className="px-4 py-4 whitespace-nowrap w-[40%]">{driver.email}</td>
                      <td className="px-20 py-4 flex items-center space-x-2 justify-center">
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
                  {paginatedDrivers.length === 0 && !isLoading && (
                    <tr className="border-b border-gray-300">
                      <td colSpan={5} className="text-center py-6 text-gray-500">
                        No drivers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* Pagination controls */}
              {showPagination && (
                <Pagination
                  currentLoadedCount={currentLoadedCount}
                  totalRows={filteredDrivers.length}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={rowsPerPageOptions}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  isNextDisabled={currentLoadedCount >= filteredDrivers.length}
                  isPrevDisabled={currentLoadedCount <= rowsPerPage}
                />
              )}
            </div>
          </div>
        </div>
        {/* END BODY */}
      </div>
      {/* END MAIN CONTENT */}

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
                {isDeleting ? "Deleting..." : "Ok"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversContent;
