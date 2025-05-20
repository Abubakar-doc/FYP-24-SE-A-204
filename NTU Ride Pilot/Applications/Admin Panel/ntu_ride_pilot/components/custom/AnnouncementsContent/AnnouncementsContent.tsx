"use client";

import React, { useEffect, useState } from "react";
import AnnouncementsHeader from "./AnnouncementsHeader";
import { useRouter } from "next/navigation";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: any;
  mediaLinks?: string[];
  mediaPublicIds?: string[]; // Optional array of public IDs
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
    <div className="w-full min-h-screen bg-white relative">
      <div className="rounded-lg mb-2">
        {/* Pass searchInput and setSearchInput as props */}
        <AnnouncementsHeader searchInput={searchInput} setSearchInput={setSearchInput} />
      </div>
      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%] border-b border-gray-300">
                  ID
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%] border-b border-gray-300">
                  Title
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%] border-b border-gray-300">
                  Message
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[20%] border-b border-gray-300">
                  Created On
                </th>
                <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300 text-center">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No announcements found.
                  </td>
                </tr>
              ) : (
                filteredAnnouncements.map((announcement, index) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap w-[5%]">{index + 1}</td>
                    <td className="px-4 py-4 whitespace-nowrap w-[25%] overflow-hidden text-ellipsis">{announcement.title}</td>
                    <td className="px-4 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis">{truncateMessage(announcement.message)}</td>
                    <td className="px-4 py-4 whitespace-nowrap w-[20%] overflow-hidden text-ellipsis">
                      {formatTimestamp(announcement.created_at)}
                    </td>
                    <td className="px-4 py-4 flex items-center justify-center space-x-0">
                      <div className="flex justify-center">
                        <button
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          title="View Announcement"
                          onClick={() => handleView(announcement.id)}
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                          title="Delete Announcement"
                          onClick={() => handleDeleteClick(announcement)}
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
