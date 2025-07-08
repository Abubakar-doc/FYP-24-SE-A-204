// File: components/custom/ViewReports.tsx
"use client";
import React, { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, Timestamp, deleteDoc, doc } from "firebase/firestore";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import ViewReportsHeader from "./ViewReportsHeader";
import Pagination from "./Pagination";
import { useRouter } from "next/navigation";

type ViewReportsProps = {
  onBack: () => void;
};

interface ReportDoc {
  id: string;
  generated_at: Timestamp;
  [key: string]: any;
}

const ViewReports: React.FC<ViewReportsProps> = ({ onBack }) => {
  const router = useRouter();
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  // Modal state for delete all confirmation
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Modal state for single report deletion
  const [showDeleteSingleModal, setShowDeleteSingleModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ReportDoc | null>(null);

  // Search term state
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 20, 30, 40, 50];
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  // Fetch all reports from Firestore
  const fetchReports = async () => {
    setLoading(true);
    try {
      const reportsCollection = collection(firestore, "reports");
      const snapshot = await getDocs(reportsCollection);

      if (snapshot.empty) {
        setReports([]);
        setLoading(false);
        return;
      }

      const fetchedReports: ReportDoc[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      // Sort descending by generated_at (latest on top)
      fetchedReports.sort((a, b) => {
        const aTime = a.generated_at?.toMillis ? a.generated_at.toMillis() : 0;
        const bTime = b.generated_at?.toMillis ? b.generated_at.toMillis() : 0;
        return bTime - aTime; // descending: latest first
      });

      setReports(fetchedReports);
    } catch (error) {
      setReports([]);
      setNotificationMessage("Failed to load reports.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filter reports by search term on generated_at string (formatted with 12-hour time)
  const filteredReports = reports.filter((report) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.trim().toLowerCase();
    const dateStr = report.generated_at
      ? report.generated_at.toDate().toLocaleString(undefined, {
          hour12: true,
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
        }).toLowerCase()
      : "";
    return dateStr.includes(search);
  });

  // Pagination logic for filteredReports
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  // Pagination handlers
  const handleNext = () => {
    if (currentPage < Math.ceil(filteredReports.length / rowsPerPage)) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsPaginating(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setIsPaginating(false);
      }, 300);
    }
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const showPagination = filteredReports.length > rowsPerPage;

  // Handle Delete report document (show modal)
  const handleDeleteReportClick = (report: ReportDoc) => {
    setReportToDelete(report);
    setShowDeleteSingleModal(true);
  };

  // Confirm single report deletion
  const confirmDeleteSingle = async () => {
    if (!reportToDelete) return;
    setShowDeleteSingleModal(false);
    setLoading(true);
    try {
      await deleteDoc(doc(firestore, "reports", reportToDelete.id));
      setNotificationMessage("Report deleted successfully.");
      setShowNotification(true);
      await fetchReports();
    } catch (error) {
      setNotificationMessage("Failed to delete report.");
      setShowNotification(true);
    } finally {
      setLoading(false);
      setTimeout(() => setShowNotification(false), 3000);
      setReportToDelete(null);
    }
  };

  // Cancel single report deletion modal
  const cancelDeleteSingle = () => {
    setShowDeleteSingleModal(false);
    setReportToDelete(null);
  };

  // Handle Delete All button click - show modal
  const handleDeleteAllClick = () => {
    setShowDeleteAllModal(true);
  };

  // Confirm Delete All reports
  const confirmDeleteAll = async () => {
    setShowDeleteAllModal(false);
    setLoading(true);
    try {
      const reportsCollection = collection(firestore, "reports");
      const snapshot = await getDocs(reportsCollection);
      const deletePromises = snapshot.docs.map((docItem) =>
        deleteDoc(doc(firestore, "reports", docItem.id))
      );
      await Promise.all(deletePromises);
      setNotificationMessage("All reports deleted successfully.");
      setShowNotification(true);
      await fetchReports();
    } catch (error) {
      setNotificationMessage("Failed to delete all reports.");
      setShowNotification(true);
    } finally {
      setLoading(false);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  // Cancel Delete All modal
  const cancelDeleteAll = () => {
    setShowDeleteAllModal(false);
  };

  // Navigate to /dashboard/reports/view-single-report with report id as query param
  const handleViewReport = (id: string) => {
    router.push(`/dashboard/reports/view-single-report?id=${id}`);
  };

  return (
    <div className="flex h-screen bg-white w-full">
      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen relative">
        {(loading || isPaginating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator
              message={loading ? "Loading reports..." : "Loading more..."}
            />
          </div>
        )}

        {/* HEADER */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <ViewReportsHeader
              onBackToReports={onBack}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onDeleteAll={handleDeleteAllClick}
            />
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {paginatedReports.length === 0 && !loading && (
            <div className="text-center text-gray-500 font-semibold py-8">
              No reports found.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-300 rounded-lg p-4 flex flex-col justify-between"
              >
                <div className="mb-4">
                  <div className="text-gray-700 font-semibold">
                    Generated At:
                  </div>
                  <div className="text-gray-900">
                    {report.generated_at
                      ? report.generated_at.toDate().toLocaleString(undefined, {
                          hour12: true,
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                        })
                      : "N/A"}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleViewReport(report.id)}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteReportClick(report)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring focus:border-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {showPagination && (
            <div className="mt-6">
              <Pagination
                currentLoadedCount={currentPage * rowsPerPage}
                totalRows={filteredReports.length}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                onRowsPerPageChange={handleRowsPerPageChange}
                onNext={handleNext}
                onPrev={handlePrev}
                isNextDisabled={
                  currentPage >= Math.ceil(filteredReports.length / rowsPerPage)
                }
                isPrevDisabled={currentPage <= 1}
              />
            </div>
          )}

          {/* Notification */}
          {showNotification && (
            <div
              className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-bold transition duration-600 ${
                notificationMessage.toLowerCase().includes("success")
                  ? "bg-green-500"
                  : "bg-red-600"
              }`}
            >
              {notificationMessage}
            </div>
          )}
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete all reports?
            </h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDeleteAll}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Report Confirmation Modal */}
      {showDeleteSingleModal && reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete the report generated at{" "}
              <span className="font-mono">
                {reportToDelete.generated_at
                  ? reportToDelete.generated_at.toDate().toLocaleString(undefined, {
                      hour12: true,
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                    })
                  : "N/A"}
              </span>
              ?
            </h3>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDeleteSingle}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSingle}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewReports;
