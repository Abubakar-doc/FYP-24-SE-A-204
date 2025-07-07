"use client";
import React, { useEffect, useState } from "react";
import ReportsHeader from "./ReportsHeader";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator"; 
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

// Helper to map filter value to human-readable key for Firestore
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
      const fraudReportsRaw: FraudReportEntry[] = Array.isArray(reportDoc.fraud_reports)
        ? reportDoc.fraud_reports
        : [];

      const grouped: Record<string, { bus_id: string; created_at: Timestamp }[]> = {};
      fraudReportsRaw.forEach((entry) => {
        const { student_rollNo, bus_id, created_at } = entry;
        if (!student_rollNo || !bus_id || !created_at) return;
        if (!grouped[student_rollNo]) grouped[student_rollNo] = [];
        grouped[student_rollNo].push({ bus_id, created_at });
      });

      setGroupedFraudReports(grouped);
      setFraudReports(fraudReportsRaw);

      if (fraudReportsRaw.length === 0 && reportDoc.filter === "one_day") {
        const today = new Date();
        const todayStr = today.toLocaleDateString();
        setWarningMessage(`No frauds data is available for ${todayStr}`);
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

      for (let i = 0; i < group.length; i++) {
        const rideI = group[i];
        const onlineSet = new Set(rideI.onlineOnBoard);

        for (let j = 0; j < group.length; j++) {
          if (i === j) continue;
          const rideJ = group[j];
          const offlineSet = new Set(rideJ.offlineOnBoard);

          onlineSet.forEach((rollNo) => {
            if (offlineSet.has(rollNo)) {
              fraudReports.push({
                student_rollNo: rollNo,
                bus_id: rideI.bus_id,
                created_at: rideI.created_at,
              });
              fraudReports.push({
                student_rollNo: rollNo,
                bus_id: rideJ.bus_id,
                created_at: rideJ.created_at,
              });
            }
          });
        }
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

    // For week/month, we return the frauds instead of storing
    return {
      date: startDate,
      ridesCount: rides.length,
      fraudsCount: uniqueFraudReports.length,
      frauds: uniqueFraudReports,
    };
  };

  // Main fraud report generator
  const generateFraudReport = async (filter: string) => {
    try {
      setWarningMessage(null);
      setLoading(true);
      if (filter === "active") {
        // One Day: today only
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
          setWarningMessage(`No ride data is available for ${todayStr}`);
          setFraudReports([]);
          setGroupedFraudReports({});
          setLoading(false);
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
          for (let i = 0; i < group.length; i++) {
            const rideI = group[i];
            const onlineSet = new Set(rideI.onlineOnBoard);

            for (let j = 0; j < group.length; j++) {
              if (i === j) continue;
              const rideJ = group[j];
              const offlineSet = new Set(rideJ.offlineOnBoard);

              onlineSet.forEach((rollNo) => {
                if (offlineSet.has(rollNo)) {
                  fraudReports.push({
                    student_rollNo: rollNo,
                    bus_id: rideI.bus_id,
                    created_at: rideI.created_at,
                  });
                  fraudReports.push({
                    student_rollNo: rollNo,
                    bus_id: rideJ.bus_id,
                    created_at: rideJ.created_at,
                  });
                }
              });
            }
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
          filter: getFilterKey(filter), // <-- Use mapped value
          fraud_reports: uniqueFraudReports,
        });

        setFraudReports(uniqueFraudReports);

        if (uniqueFraudReports.length === 0) {
          const todayStr = startDate.toLocaleDateString();
          setWarningMessage(`No frauds data is available for ${todayStr}`);
        } else {
          setWarningMessage(null);
        }
        setLoading(false);
      } else if (filter === "all") {
        // One Week
        const days = 7;
        let anyRides = false;
        let anyFrauds = false;
        const weekFraudJson: Record<string, any[]> = {};

        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const { ridesCount, fraudsCount, frauds } = await generateFraudReportForDay(date);

          // Format date as YYYY-MM-DD for key
          const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          weekFraudJson[dayKey] = frauds.map(f => ({
            bus_id: f.bus_id,
            created_at: f.created_at,
            student_rollNo: f.student_rollNo,
          }));

          if (ridesCount > 0) anyRides = true;
          if (fraudsCount > 0) anyFrauds = true;
        }

        // Log the week JSON for testing
        console.log("One Week Fraud Report JSON:", weekFraudJson);

        // Optionally, you can fetch and show the latest report for UI (unchanged)
        await fetchAndGroupFraudReports();
        if (!anyRides) {
          setWarningMessage("No ride data is available for the selected week.");
        } else if (!anyFrauds) {
          setWarningMessage("No frauds data is available for the selected week.");
        } else {
          setWarningMessage(null);
        }
        setLoading(false);
      } else if (filter === "suspended") {
        // One Month
        const days = 30;
        let anyRides = false;
        let anyFrauds = false;
        const monthFraudJson: Record<string, any[]> = {};

        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const { ridesCount, fraudsCount, frauds } = await generateFraudReportForDay(date);

          // Format date as YYYY-MM-DD for key
          const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          monthFraudJson[dayKey] = frauds.map(f => ({
            bus_id: f.bus_id,
            created_at: f.created_at,
            student_rollNo: f.student_rollNo,
          }));

          if (ridesCount > 0) anyRides = true;
          if (fraudsCount > 0) anyFrauds = true;
        }

        // Log the month JSON for testing
        console.log("One Month Fraud Report JSON:", monthFraudJson);

        await fetchAndGroupFraudReports();
        if (!anyRides) {
          setWarningMessage("No ride data is available for the selected month.");
        } else if (!anyFrauds) {
          setWarningMessage("No frauds data is available for the selected month.");
        } else {
          setWarningMessage(null);
        }
        setLoading(false);
      }
    } catch (error) {
      setFraudReports([]);
      setGroupedFraudReports({});
      setWarningMessage(null);
      setLoading(false);
      throw error;
    }
  };

  const handleGenerateReport = async (filter: string) => {
    try {
      await generateFraudReport(filter);
      alert("Fraud report generated successfully.");
    } catch (error) {
      alert("Failed to generate fraud report. Check console for details.");
    }
  };

  const uniqueRollNos = Object.keys(groupedFraudReports);

  return (
    <div className="flex h-screen bg-white w-full">
      {loading && <LoadingIndicator fullscreen message="Generating fraud reports..." />}
      <div className="flex flex-col flex-1 h-screen relative">
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <ReportsHeader onGenerateReport={handleGenerateReport} />
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
                  {!warningMessage && uniqueRollNos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500">
                        No fraud reports found.
                      </td>
                    </tr>
                  )}
                  {!warningMessage &&
                    uniqueRollNos.map((rollNo, index) => {
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
                            {index + 1}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsContent;
