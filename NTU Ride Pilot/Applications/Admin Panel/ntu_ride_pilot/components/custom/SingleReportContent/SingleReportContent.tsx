"use client";
import React, { useEffect, useState } from "react";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import Pagination from "./Pagination";
import { firestore } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import SingleReportContentHeader from "./SingleReportContentHeader";

interface FraudReportEntry {
  student_rollNo: string;
  bus_id: string;
  created_at?: Timestamp;
}

function isTimestamp(val: any): val is Timestamp {
  return val && typeof val.toDate === "function" && typeof val.toMillis === "function";
}

interface SingleReportContentProps {
  reportId: string;
  onBack: () => void;
}

const SingleReportContent: React.FC<SingleReportContentProps> = ({ reportId, onBack }) => {
  const [fraudReports, setFraudReports] = useState<FraudReportEntry[]>([]);
  const [groupedFraudReports, setGroupedFraudReports] = useState<
    Record<string, { bus_id: string; created_at: Timestamp }[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Notification states (success/warning/error)
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotif, setShowNotif] = useState(false);

  // Search term state
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 20, 30, 40, 50];
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  // Fetch and structure report data by reportId
  const fetchReportById = async (id: string) => {
    setLoading(true);
    try {
      const reportDocRef = doc(firestore, "reports", id);
      const reportSnap = await getDoc(reportDocRef);
      if (!reportSnap.exists()) {
        setWarningMessage("Report not found.");
        setFraudReports([]);
        setGroupedFraudReports({});
        setLoading(false);
        return;
      }
      const data = reportSnap.data();

      let fraudReportsRaw: FraudReportEntry[] = [];

      if (data.filter === "one_day") {
        fraudReportsRaw = Array.isArray(data.fraud_reports)
          ? data.fraud_reports
          : [];
      } else if (data.filter === "one_week" || data.filter === "one_month") {
        const byDay = data.fraud_reports_by_day || {};
        fraudReportsRaw = [];
        Object.values(byDay).forEach((arr: any) => {
          if (Array.isArray(arr)) {
            arr.forEach((entry) => {
              fraudReportsRaw.push({
                student_rollNo: entry.student_rollNo,
                bus_id: entry.bus_id,
                created_at: isTimestamp(entry.created_at)
                  ? entry.created_at
                  : entry.created_at && entry.created_at.seconds
                  ? new Timestamp(entry.created_at.seconds, entry.created_at.nanoseconds)
                  : undefined,
              });
            });
          }
        });
      }

      const grouped: Record<string, { bus_id: string; created_at: Timestamp }[]> = {};
      fraudReportsRaw.forEach((entry) => {
        const { student_rollNo, bus_id, created_at } = entry;
        if (!student_rollNo || !bus_id || !created_at) return;
        if (!grouped[student_rollNo]) grouped[student_rollNo] = [];
        grouped[student_rollNo].push({ bus_id, created_at });
      });

      setGroupedFraudReports(grouped);
      setFraudReports(fraudReportsRaw);

      if (fraudReportsRaw.length === 0 && data.filter === "one_day") {
        const today = new Date();
        const todayStr = today.toLocaleDateString();
        setWarningMessage(`No frauds data is available for ${todayStr}`);
      } else {
        setWarningMessage(null);
      }
    } catch (error) {
      setGroupedFraudReports({});
      setWarningMessage("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportById(reportId);
  }, [reportId]);

  // Filter grouped fraud reports by search term on rollNo, createdAt, and remarks (bus_id)
  const uniqueRollNos = Object.keys(groupedFraudReports);

  const filteredRollNos = uniqueRollNos.filter((rollNo) => {
    const entries = groupedFraudReports[rollNo];
    if (!entries || entries.length === 0) return false;

    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;

    if (rollNo.toLowerCase().includes(search)) return true;

    if (
      entries.some((entry) =>
        entry.created_at.toDate().toLocaleString().toLowerCase().includes(search)
      )
    )
      return true;

    if (
      entries.some((entry) => entry.bus_id.toLowerCase().includes(search))
    )
      return true;

    return false;
  });

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRollNos = filteredRollNos.slice(startIndex, startIndex + rowsPerPage);

  const handleNext = () => {
    if (currentPage < Math.ceil(filteredRollNos.length / rowsPerPage)) {
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

  const showPagination = filteredRollNos.length > rowsPerPage;

  return (
    <div className="flex h-screen bg-white w-full">
      <div className="flex flex-col flex-1 h-screen relative">
        {(loading || isPaginating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator message={loading ? "Loading report..." : "Loading more..."} />
          </div>
        )}

        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <SingleReportContentHeader
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onBackToReports={() => {
                // Navigate back to correct route
                window.history.back();
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            {warningMessage && (
              <div className="mb-4 text-center text-red-600 font-semibold">
                {warningMessage}
              </div>
            )}
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">
                      SR#
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%]">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%]">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%]">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!warningMessage && paginatedRollNos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        No fraud reports found.
                      </td>
                    </tr>
                  )}
                  {!warningMessage &&
                    paginatedRollNos.map((rollNo, index) => {
                      const entries = groupedFraudReports[rollNo];
                      const sortedEntries = entries.slice().sort((a, b) => {
                        return a.created_at.toMillis() - b.created_at.toMillis();
                      });

                      return (
                        <tr
                          key={rollNo}
                          className="hover:bg-gray-50 border-b border-gray-300 text-center"
                        >
                          <td className="px-6 py-4 whitespace-nowrap w-[10%]">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[25%]">
                            {rollNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[25%]">
                            {sortedEntries.map((entry, i) => (
                              <div key={i}>
                                {entry.created_at.toDate().toLocaleString()}
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[40%]">
                            {sortedEntries.map((entry, i) => (
                              <div key={i}>{entry.bus_id}</div>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {showPagination && (
                <Pagination
                  currentLoadedCount={currentPage * rowsPerPage}
                  totalRows={filteredRollNos.length}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={rowsPerPageOptions}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  isNextDisabled={currentPage >= Math.ceil(filteredRollNos.length / rowsPerPage)}
                  isPrevDisabled={currentPage <= 1}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showNotif && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-8 rounded-lg shadow-lg text-white font-bold transition duration-600 animate-out ${
            notificationMessage.toLowerCase().includes("success")
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {notificationMessage}
        </div>
      )}
    </div>
  );
};

export default SingleReportContent;
