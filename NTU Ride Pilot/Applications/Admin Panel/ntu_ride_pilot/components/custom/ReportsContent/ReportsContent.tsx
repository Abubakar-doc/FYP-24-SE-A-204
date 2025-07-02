"use client";
import React, { useEffect, useState } from "react";
import ReportsHeader from "./ReportsHeader";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
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
}

const ReportsContent: React.FC = () => {
  const [fraudReports, setFraudReports] = useState<FraudReportEntry[]>([]);

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

  const generateFraudReport = async (filter: string) => {
    try {
      const now = new Date();
      let startDate: Date;

      switch (filter) {
        case "active":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "all":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "suspended":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      console.log(`Generating fraud report for filter: ${filter}, startDate: ${startDate}`);

      const ridesCollection = collection(firestore, "rides");
      const q = query(
        ridesCollection,
        where("ride_status", "==", "completed"),
        where("created_at", ">=", Timestamp.fromDate(startDate))
      );

      const ridesSnapshot = await getDocs(q);
      const rides: Ride[] = [];

      ridesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!(data.created_at instanceof Timestamp) || !(data.ended_at instanceof Timestamp)) {
          console.warn(`Ride document ${doc.id} has invalid created_at or ended_at`);
          return;
        }
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

      console.log(`Fetched ${rides.length} rides from Firestore.`);

      if (rides.length === 0) {
        console.log("No rides found for the selected filter.");
        setFraudReports([]);
        return;
      }

      const rideGroups = groupRides(rides);
      console.log(`Grouped rides into ${rideGroups.length} groups.`);

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
              });
              fraudReports.push({
                student_rollNo: rollNo,
                bus_id: otherRide.bus_id,
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
                });
                fraudReports.push({
                  student_rollNo: rollNo,
                  bus_id: rideJ.bus_id,
                });
              }
            });
          }
        }
      }

      if (fraudReports.length === 0) {
        console.log("No fraud students detected.");
        setFraudReports([]);
        return;
      }

      // Remove duplicates by student_rollNo and bus_id
      const uniqueFraudReports = Array.from(
        new Map(
          fraudReports.map((item) => [`${item.student_rollNo}_${item.bus_id}`, item])
        ).values()
      );

      console.log("Fraud Reports array to save:", uniqueFraudReports);

      // Save to Firestore
      const reportsCollection = collection(firestore, "reports");

      await addDoc(reportsCollection, {
        generated_at: Timestamp.now(),
        filter,
        fraud_reports: uniqueFraudReports,
      });

      // Update state to show in UI
      setFraudReports(uniqueFraudReports);

      console.log("Fraud report generated and saved to Firestore.");
    } catch (error) {
      console.error("Error generating fraud report:", error);
      setFraudReports([]);
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

  // Prepare remarks by grouping bus_ids for each student_rollNo
  const remarksMap: Record<string, Set<string>> = {};
  fraudReports.forEach(({ student_rollNo, bus_id }) => {
    if (!remarksMap[student_rollNo]) {
      remarksMap[student_rollNo] = new Set();
    }
    remarksMap[student_rollNo].add(bus_id);
  });

  // Unique rollNos for rendering
  const uniqueRollNos = Array.from(new Set(fraudReports.map((r) => r.student_rollNo)));

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}
      <div className="flex flex-col flex-1 h-screen relative">
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <ReportsHeader onGenerateReport={handleGenerateReport} />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%]">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[75%]">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueRollNos.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center py-4 text-gray-500">
                        No fraud reports found.
                      </td>
                    </tr>
                  )}
                  {uniqueRollNos.map((rollNo, index) => (
                    <tr
                      key={rollNo}
                      className="hover:bg-gray-50 border-b border-gray-300 text-center"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-[25%]">
                        {rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[75%]">
                        {Array.from(remarksMap[rollNo]).join(", ")}
                      </td>
                    </tr>
                  ))}
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
