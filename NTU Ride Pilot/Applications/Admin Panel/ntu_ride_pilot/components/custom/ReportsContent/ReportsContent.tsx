"use client";
import React, { useEffect, useState } from "react";
import ReportsHeader from "./ReportsHeader";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import Pagination from "./Pagination";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

interface Ride {
  id: string;
  ride_name: string;
  route_name: string;
  created_at: Timestamp;
  ended_at: Timestamp;
  ride_status: string;
  offlineOnBoard: string[];
  onlineOnBoard: string[];
  bus_id: string;
  route_id: string;
}

interface FraudReportEntry {
  student_rollNo: string;
  bus_id: string;
  created_at?: Timestamp;
}

function isTimestamp(val: any): val is Timestamp {
  return val && typeof val.toDate === "function" && typeof val.toMillis === "function";
}

const getFilterKey = (filter: string) => {
  if (filter === "active") return "one_day";
  if (filter === "all") return "one_week";
  if (filter === "suspended") return "one_month";
  return filter;
};

const ReportsContent: React.FC = () => {
  const [fraudReports, setFraudReports] = useState<FraudReportEntry[]>([]);
  const [groupedFraudReports, setGroupedFraudReports] = useState<
    Record<string, { bus_id: string; created_at: Timestamp }[]>
  >({});
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Notification states (success/warning/error)
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  // Search term state for filtering table data
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 20, 30, 40, 50];
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  // --- Fetch and group fraud reports by student_rollNo ---
  const fetchAndGroupFraudReports = async () => {
    try {
      const reportsCollection = collection(firestore, "reports");
      const q = query(reportsCollection, orderBy("generated_at", "desc"), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setGroupedFraudReports({});
        setWarningMessage(null);
        return;
      }

      const reportDoc = snapshot.docs[0].data();

      // Detect which filter is used
      const filter = reportDoc.filter;

      let fraudReportsRaw: FraudReportEntry[] = [];

      if (filter === "one_day") {
        fraudReportsRaw = Array.isArray(reportDoc.fraud_reports)
          ? reportDoc.fraud_reports
          : [];
      } else if (filter === "one_week" || filter === "one_month") {
        // Flatten fraud_reports_by_day into a single array
        const byDay = reportDoc.fraud_reports_by_day || {};
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

      // Remove warning message display from table and use notification instead
      if (fraudReportsRaw.length === 0 && filter === "one_day") {
        const today = new Date();
        const todayStr = today.toLocaleDateString();
        setWarningMessage(null);
        setNotificationMessage(`No frauds data is available for ${todayStr}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        setWarningMessage(null);
      }
    } catch (error) {
      setGroupedFraudReports({});
      setWarningMessage(null);
    }
  };

  useEffect(() => {
    fetchAndGroupFraudReports();
  }, []);

  function ridesOverlapOrClose(
    rideA: Ride,
    rideB: Ride,
    thresholdMinutes = 30
  ): boolean {
    const startA = rideA.created_at.toDate().getTime();
    const endA = rideA.ended_at.toDate().getTime();
    const startB = rideB.created_at.toDate().getTime();
    const endB = rideB.ended_at.toDate().getTime();
    if (startA <= endB && startB <= endA) return true;
    const thresholdMs = thresholdMinutes * 60 * 1000;
    if (
      Math.abs(startA - startB) <= thresholdMs ||
      Math.abs(endA - endB) <= thresholdMs
    )
      return true;
    return false;
  }

  function groupRides(rides: Ride[]): Ride[][] {
    const groups: Ride[][] = [];
    rides.forEach((ride) => {
      let addedToGroup = false;
      for (const group of groups) {
        if (group.some((r) => ridesOverlapOrClose(r, ride))) {
          group.push(ride);
          addedToGroup = true;
          break;
        }
      }
      if (!addedToGroup) {
        groups.push([ride]);
      }
    });
    return groups;
  }

  // Helper: Generate fraud report for a single day (date: JS Date)
  const generateFraudReportForDay = async (date: Date) => {
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const ridesCollection = collection(firestore, "rides");
    const q = query(
      ridesCollection,
      where("ride_status", "==", "completed"),
      where("created_at", ">=", Timestamp.fromDate(startDate)),
      where("created_at", "<", Timestamp.fromDate(endDate))
    );
    const ridesSnapshot = await getDocs(q);
    const rides: Ride[] = [];

    ridesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!isTimestamp(data.created_at) || !isTimestamp(data.ended_at)) return;
      rides.push({
        id: doc.id,
        ride_name: data.ride_name,
        route_name: data.route_name,
        created_at: data.created_at,
        ended_at: data.ended_at,
        ride_status: data.ride_status,
        offlineOnBoard: Array.isArray(data.offlineOnBoard) ? data.offlineOnBoard : [],
        onlineOnBoard: Array.isArray(data.onlineOnBoard) ? data.onlineOnBoard : [],
        bus_id: data.bus_id,
        route_id: data.route_id,
      });
    });
    if (rides.length === 0) {
      return { date: startDate, ridesCount: 0, fraudsCount: 0, frauds: [] };
    }
    const rideGroups = groupRides(rides);
    const fraudReports: FraudReportEntry[] = [];

    for (const group of rideGroups) {
      group.sort(
        (a, b) =>
          a.created_at.toDate().getTime() - b.created_at.toDate().getTime()
      );
      const baseRide = group[0];
      const baseOfflineSet = new Set(baseRide.offlineOnBoard);

      // Iteration 1: Check offlineOnBoard rollNos of baseRide against offlineOnBoard of other rides
      for (let i = 1; i < group.length; i++) {
        const otherRide = group[i];
        const otherOfflineSet = new Set(otherRide.offlineOnBoard);

        baseOfflineSet.forEach((rollNo) => {
          if (otherOfflineSet.has(rollNo)) {
            // Add fraud entry for rollNo from baseRide
            fraudReports.push({
              student_rollNo: rollNo,
              bus_id: baseRide.bus_id,
              created_at: baseRide.created_at,
            });
            // Add fraud entry for rollNo from otherRide
            fraudReports.push({
              student_rollNo: rollNo,
              bus_id: otherRide.bus_id,
              created_at: otherRide.created_at,
            });
          }
        });
      }

      // Iteration 2: Check onlineOnBoard rollNos of baseRide against offlineOnBoard of other rides
      // Only add fraud entries for offlineOnBoard rollNos found in other rides
      const baseOnlineSet = new Set(baseRide.onlineOnBoard);
      for (let i = 1; i < group.length; i++) {
        const otherRide = group[i];
        const otherOfflineSet = new Set(otherRide.offlineOnBoard);

        baseOnlineSet.forEach((rollNo) => {
          if (otherOfflineSet.has(rollNo)) {
            fraudReports.push({
              student_rollNo: rollNo,
              bus_id: otherRide.bus_id,
              created_at: otherRide.created_at,
            });
          }
        });
      }
    }

    // Remove duplicates
    const uniqueFraudReports = Array.from(
      new Map(
        fraudReports.map((item) => [
          `${item.student_rollNo}_${item.bus_id}_${
            isTimestamp(item.created_at) ? item.created_at.toMillis() : "0"
          }`,
          item,
        ])
      ).values()
    );

    return {
      date: startDate,
      ridesCount: rides.length,
      fraudsCount: uniqueFraudReports.length,
      frauds: uniqueFraudReports,
    };
  };

  // Main fraud report generator with synchronous Step 1 and Step 2
  const generateFraudReport = async (filter: string) => {
    try {
      setWarningMessage(null);
      setLoading(true);
      setNotificationMessage("");
      setShowNotification(false);

      // --- Step 1: Generate and store report ---
      if (filter === "active") {
        // One Day
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const ridesCollection = collection(firestore, "rides");
        const q = query(
          ridesCollection,
          where("ride_status", "==", "completed"),
          where("created_at", ">=", Timestamp.fromDate(startDate)),
          where("created_at", "<", Timestamp.fromDate(endDate))
        );
        const ridesSnapshot = await getDocs(q);
        const rides: Ride[] = [];
        ridesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (!isTimestamp(data.created_at) || !isTimestamp(data.ended_at)) return;
          rides.push({
            id: doc.id,
            ride_name: data.ride_name,
            route_name: data.route_name,
            created_at: data.created_at,
            ended_at: data.ended_at,
            ride_status: data.ride_status,
            offlineOnBoard: Array.isArray(data.offlineOnBoard) ? data.offlineOnBoard : [],
            onlineOnBoard: Array.isArray(data.onlineOnBoard) ? data.onlineOnBoard : [],
            bus_id: data.bus_id,
            route_id: data.route_id,
          });
        });

        if (rides.length === 0) {
          const todayStr = startDate.toLocaleDateString();
          setWarningMessage(null);
          setFraudReports([]);
          setGroupedFraudReports({});
          setLoading(false);
          setNotificationMessage(`No ride data is available for ${todayStr}`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
          return;
        }
        const rideGroups = groupRides(rides);
        const fraudReports: FraudReportEntry[] = [];

        for (const group of rideGroups) {
          group.sort(
            (a, b) =>
              a.created_at.toDate().getTime() - b.created_at.toDate().getTime()
          );
          const baseRide = group[0];
          const baseOfflineSet = new Set(baseRide.offlineOnBoard);

          // Iteration 1: Check offlineOnBoard rollNos of baseRide against offlineOnBoard of other rides
          for (let i = 1; i < group.length; i++) {
            const otherRide = group[i];
            const otherOfflineSet = new Set(otherRide.offlineOnBoard);

            baseOfflineSet.forEach((rollNo) => {
              if (otherOfflineSet.has(rollNo)) {
                fraudReports.push({
                  student_rollNo: rollNo,
                  bus_id: baseRide.bus_id,
                  created_at: baseRide.created_at,
                });
                fraudReports.push({
                  student_rollNo: rollNo,
                  bus_id: otherRide.bus_id,
                  created_at: otherRide.created_at,
                });
              }
            });
          }
          // Iteration 2: Check onlineOnBoard rollNos of baseRide against offlineOnBoard of other rides
          const baseOnlineSet = new Set(baseRide.onlineOnBoard);
          for (let i = 1; i < group.length; i++) {
            const otherRide = group[i];
            const otherOfflineSet = new Set(otherRide.offlineOnBoard);

            baseOnlineSet.forEach((rollNo) => {
              if (otherOfflineSet.has(rollNo)) {
                fraudReports.push({
                  student_rollNo: rollNo,
                  bus_id: otherRide.bus_id,
                  created_at: otherRide.created_at,
                });
              }
            });
          }
        }

        const uniqueFraudReports = Array.from(
          new Map(
            fraudReports.map((item) => [
              `${item.student_rollNo}_${item.bus_id}_${
                isTimestamp(item.created_at) ? item.created_at.toMillis() : "0"
              }`,
              item,
            ])
          ).values()
        );
        const reportsCollection = collection(firestore, "reports");
        await addDoc(reportsCollection, {
          generated_at: Timestamp.now(),
          filter: getFilterKey(filter),
          fraud_reports: uniqueFraudReports,
        });

        // Step 1 complete
        setLoading(false);
        setNotificationMessage("Fraud report generated successfully!");
        setShowNotification(true);

        // Show notification for 3 seconds
        await new Promise((res) => setTimeout(res, 3000));

        // Step 2: Fetch and show report data
        setShowNotification(false);
        setNotificationMessage("");
        setLoading(true);
        await fetchAndGroupFraudReports();
        setLoading(false);

        if (uniqueFraudReports.length === 0) {
          const todayStr = startDate.toLocaleDateString();
          setWarningMessage(null);
          setNotificationMessage(`No frauds data is available for ${todayStr}`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          setWarningMessage(null);
        }
      } else if (filter === "all" || filter === "suspended") {
        // One Week or One Month
        const days = filter === "all" ? 7 : 30;
        let anyRides = false;
        let anyFrauds = false;
        const fraudJson: Record<string, any[]> = {};

        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const { ridesCount, fraudsCount, frauds } = await generateFraudReportForDay(date);
          const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          fraudJson[dayKey] = frauds.map(f => ({
            bus_id: f.bus_id,
            created_at: f.created_at,
            student_rollNo: f.student_rollNo,
          }));

          if (ridesCount > 0) anyRides = true;
          if (fraudsCount > 0) anyFrauds = true;
        }

        const reportsCollection = collection(firestore, "reports");
        await addDoc(reportsCollection, {
          generated_at: Timestamp.now(),
          filter: getFilterKey(filter),
          fraud_reports_by_day: fraudJson,
        });

        // Step 1 complete
        setLoading(false);
        setNotificationMessage("Fraud report generated successfully!");
        setShowNotification(true);

        await new Promise((res) => setTimeout(res, 3000));

        // Step 2: Fetch and show report data
        setShowNotification(false);
        setNotificationMessage("");
        setLoading(true);
        await fetchAndGroupFraudReports();
        setLoading(false);

        if (!anyRides) {
          const msg = filter === "all"
            ? "No ride data is available for the selected week."
            : "No ride data is available for the selected month.";
          setWarningMessage(null);
          setNotificationMessage(msg);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        } else if (!anyFrauds) {
          const msg = filter === "all"
            ? "No frauds data is available for the selected week."
            : "No frauds data is available for the selected month.";
          setWarningMessage(null);
          setNotificationMessage(msg);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          setWarningMessage(null);
        }
      }
    } catch (error) {
      setFraudReports([]);
      setGroupedFraudReports({});
      setWarningMessage(null);
      setLoading(false);
      setNotificationMessage("Failed to generate fraud report.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      throw error;
    }
  };

  const handleGenerateReport = async (filter: string) => {
    try {
      await generateFraudReport(filter);
      setCurrentPage(1); // Reset to first page on new report generation
    } catch (error) {
      alert("Failed to generate fraud report. Check console for details.");
    }
  };

  const uniqueRollNos = Object.keys(groupedFraudReports);

  // Filter grouped fraud reports by search term on rollNo, createdAt, and remarks (bus_id)
  const filteredRollNos = uniqueRollNos.filter((rollNo) => {
    const entries = groupedFraudReports[rollNo];
    if (!entries || entries.length === 0) return false;
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true; // no search term, show all

    // Check Roll No
    if (rollNo.toLowerCase().includes(search)) return true;

    // Check Created At (any entry)
    if (
      entries.some((entry) =>
        entry.created_at.toDate().toLocaleString().toLowerCase().includes(search)
      )
    )
      return true;

    // Check Remarks (bus_id) (any entry)
    if (
      entries.some((entry) =>
        entry.bus_id.toLowerCase().includes(search)
      )
    )
      return true;

    return false;
  });

  // Pagination logic for filteredRollNos
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRollNos = filteredRollNos.slice(startIndex, endIndex);

  // Pagination handlers
  const handleNext = () => {
    if (currentPage < Math.ceil(filteredRollNos.length / rowsPerPage)) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsPaginating(false);
      }, 300); // simulate loading delay
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setIsPaginating(false);
      }, 300); // simulate loading delay
    }
  };

  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  const showPagination = filteredRollNos.length > rowsPerPage;

  return (
    <div className="flex h-screen bg-white w-full">
      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Loading overlay - covers only the content area including header, not sidebar */}
        {(loading || isPaginating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator message={loading ? "Generating fraud reports..." : "Loading more..."} />
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <ReportsHeader
              onGenerateReport={handleGenerateReport}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            {/* Remove warningMessage display from table */}
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
                  {paginatedRollNos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        No fraud reports found.
                      </td>
                    </tr>
                  )}
                  {paginatedRollNos.map((rollNo, index) => {
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

              {/* Pagination controls */}
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

      {/* Notification */}
      {showNotification && (
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

export default ReportsContent;
