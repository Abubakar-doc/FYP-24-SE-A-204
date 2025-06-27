"use client";

import React, { useState, useEffect } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import BusesHeader from "./BusesHeader";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

type BusData = {
  id: string;
  busId: string;
  seatCapacity: number;
  created_at: any;
};

const BusesContent: React.FC = () => {
  const [buses, setBuses] = useState<BusData[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [busToDelete, setBusToDelete] = useState<BusData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBuses = async () => {
      setLoading(true);
      try {
        const busesCollection = collection(firestore, "buses");
        const snapshot = await getDocs(busesCollection);

        const fetchedBuses: BusData[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            busId: data.busId || "Unknown",
            seatCapacity: data.seatCapacity || 0,
            created_at: data.created_at || null,
          };
        });
        setBuses(fetchedBuses);
        setFilteredBuses(fetchedBuses);
      } catch (error) {
        console.error("Error fetching buses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBuses(buses);
    } else {
      const filtered = buses.filter(bus => 
        bus.busId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.seatCapacity.toString().includes(searchTerm)
      );
      setFilteredBuses(filtered);
    }
  }, [searchTerm, buses]);

  const handleDeleteClick = (bus: BusData) => {
    setBusToDelete(bus);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!busToDelete) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, "buses", busToDelete.id));
      setBuses(prev => prev.filter(b => b.id !== busToDelete.id));
      setFilteredBuses(prev => prev.filter(b => b.id !== busToDelete.id));
      setDeleteModalOpen(false);
      setBusToDelete(null);
    } catch (error) {
      console.error("Error deleting bus:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setBusToDelete(null);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
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
            <BusesHeader onSearch={handleSearch} />
          </div>
        </div>
        {/* BODY: fills remaining height, scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">ID</th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[60%]">Registration No</th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[60%]">No of Seats</th>
                    <th className="px-4 py-4  text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[30%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-center">
                  {filteredBuses.length === 0 ? (
                    <tr className="border-b border-gray-300">
                      <td colSpan={4} className="py-6 text-gray-500">
                        {searchTerm ? "No buses match your search." : "No buses found."}
                      </td>
                    </tr>
                  ) : (
                    filteredBuses.map((bus, index) => (
                      <tr key={bus.id} className="hover:bg-gray-50 border-b border-gray-300">
                        <td className="px-4 py-4 whitespace-nowrap w-[10%]">{index + 1}</td>
                        <td className="px-4 py-4 whitespace-nowrap w-[60%] overflow-hidden text-ellipsis">{bus.busId}</td>
                        <td className="px-4 py-4 whitespace-nowrap w-[60%] overflow-hidden text-ellipsis">{bus.seatCapacity}</td>
                        <td className="px-16 py-4 flex items-center  w-[30%] ">
                          <button
                            onClick={() => handleDeleteClick(bus)}
                            className="text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
        {/* END BODY */}
      </div>
      {/* END MAIN CONTENT */}
      {/* Loading overlay for UI consistency */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <LoadingIndicator message="Loading buses..." />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && busToDelete && (
        <DeleteModal
          busId={busToDelete.busId}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default BusesContent;

// Modal Component
type DeleteModalProps = {
  busId: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
};

const DeleteModal: React.FC<DeleteModalProps> = ({ busId, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
    <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px]">
      <div className="mb-4 text-lg font-semibold text-gray-800 text-center">
        Are you sure to delete <span className="text-red-600 font-bold">{busId}</span>?
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
