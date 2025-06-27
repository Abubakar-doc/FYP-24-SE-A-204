"use client";

import React, { useEffect, useState } from "react";
import AnnouncementsHeader from "./AnnouncementsHeader";
import { useRouter } from "next/navigation";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: any;
  mediaLinks?: string[];
  mediaPublicIds?: string[];
}

const AnnouncementsContent: React.FC = () => {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state (LIFTED UP)
  const [searchInput, setSearchInput] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Delete All state
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  const truncateMessage = (msg: string): string => {
    if (msg.length <= 50) return msg;
    return msg.slice(0, 50) + "...";
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date
      .toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " ");
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, "announcements"));
      const data: Announcement[] = [];
      querySnapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        data.push({
          id: docSnap.id,
          title: docData.title || "",
          message: docData.message || "",
          created_at: docData.created_at,
          mediaLinks: docData.mediaLinks || [],
          mediaPublicIds: docData.mediaPublicIds || [],
        });
      });
      data.sort((a, b) => b.created_at?.seconds - a.created_at?.seconds);
      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Handle view button click
  const handleView = (id: string) => {
    router.push(`/dashboard/announcements/add-announcements?view=${id}`);
  };
  // Handle delete button click (open modal)
  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setShowModal(true);
  };

  // Delete announcement and associated media files
  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    setDeleteLoading(true);

    try {
      // Step 1: Delete media files from Cloudinary via backend API if mediaPublicIds exist and length > 0
      if (
        announcementToDelete.mediaPublicIds &&
        announcementToDelete.mediaPublicIds.length > 0
      ) {
        const response = await fetch("/api/delete-cloudinary-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicIds: announcementToDelete.mediaPublicIds }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete media files from Cloudinary");
        }
      }

      // Step 2: Delete announcement document from Firestore
      await deleteDoc(doc(firestore, "announcements", announcementToDelete.id));
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementToDelete.id));
      setShowModal(false);
      setAnnouncementToDelete(null);
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      alert("Failed to delete announcement or associated media files. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- DELETE ALL ANNOUNCEMENTS LOGIC ---
  const handleDeleteAllAnnouncements = async () => {
    if (announcements.length === 0) return;
    setDeleteAllLoading(true);
    try {
      // 1. Delete all media files from Cloudinary
      const mediaDeletePromises = announcements
        .filter(a => a.mediaPublicIds && a.mediaPublicIds.length > 0)
        .map(a =>
          fetch("/api/delete-cloudinary-media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicIds: a.mediaPublicIds }),
          }).then(async response => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to delete media files from Cloudinary");
            }
            return response.json();
          })
        );
      await Promise.all(mediaDeletePromises);

      // 2. Delete all announcements from Firestore
      const deleteDocPromises = announcements.map(a =>
        deleteDoc(doc(firestore, "announcements", a.id))
      );
      await Promise.all(deleteDocPromises);

      // 3. Update state
      setAnnouncements([]);
    } catch (err) {
      console.error("Failed to delete all announcements:", err);
      alert("Failed to delete all announcements or associated media files. Please try again.");
    } finally {
      setDeleteAllLoading(false);
    }
  };

  // --- SEARCH LOGIC ---
  const filteredAnnouncements = announcements.filter((announcement) => {
    const search = searchInput.toLowerCase();

    // Format created_at for search
    let createdAtStr = "";
    if (announcement.created_at) {
      createdAtStr = formatTimestamp(announcement.created_at).toLowerCase();
    }
    return (
      announcement.title.toLowerCase().includes(search) ||
      announcement.message.toLowerCase().includes(search) ||
      createdAtStr.includes(search)
    );
  });

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
            <AnnouncementsHeader
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              onDeleteAll={handleDeleteAllAnnouncements}
              deleteAllLoading={deleteAllLoading}
            />
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
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%]">
                      Title
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%]">
                      Message
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[20%]">
                      Created On
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white text-center">
                  {filteredAnnouncements.length === 0 ? (
                    <tr className="border-b border-gray-300">
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        {loading ? "Loading..." : "No announcements found."}
                      </td>
                    </tr>
                  ) : (
                    filteredAnnouncements.map((announcement, index) => (
                      <tr key={announcement.id} className="hover:bg-gray-50 border-b border-gray-300">
                        <td className="px-4 py-4 whitespace-nowrap w-[5%]">{index + 1}</td>
                        <td className="px-4 py-4 whitespace-nowrap w-[25%] overflow-hidden text-ellipsis">{announcement.title}</td>
                        <td className="px-4 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis">{truncateMessage(announcement.message)}</td>
                        <td className="px-4 py-4 whitespace-nowrap w-[20%] overflow-hidden text-ellipsis">
                          {formatTimestamp(announcement.created_at)}
                        </td>
                        <td className="px-4 py-4 flex items-center space-x-2 justify-center">
                            <button
                              className="text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2"
                              title="View Announcement"
                              onClick={() => handleView(announcement.id)}
                            >
                              View
                            </button>
                            <button
                              className="text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2"
                              title="Delete Announcement"
                              onClick={() => handleDeleteClick(announcement)}
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
          <LoadingIndicator message="Loading announcements..." />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showModal && announcementToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="mb-6 text-lg font-semibold text-gray-800 text-center">
              Are you sure to delete <span className="text-red-600">{announcementToDelete.title}</span>!
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                onClick={() => setShowModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Ok"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsContent;
