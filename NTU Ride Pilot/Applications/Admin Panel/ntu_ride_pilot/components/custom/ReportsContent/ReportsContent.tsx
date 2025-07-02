"use client";
import React, { useState } from "react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import ReportsHeader from "./ReportsHeader";

interface Ride {
  id: string;
  start_time: Timestamp;
  end_time: Timestamp;
  ride_status: string;
  offlineOnBoard: string[]; // array of student rollNos
  onlineOnBoard: string[];  // array of student rollNos
  bus_name: string;
  route_name: string;
}

interface ReportProps {}

interface DummyReport {
  id: number;
  name: string;
  rollNo: string;
  remarks: string;
}

// Dummy data for the table (you can replace with actual data or reports if needed)
const dummyReports: DummyReport[] = [
  { id: 1, name: "Ali Ahmed", rollNo: "2021-CS-001", remarks: "Excellent" },
  { id: 2, name: "Sara Khan", rollNo: "2021-CS-002", remarks: "Good" },
  { id: 3, name: "Bilal Saeed", rollNo: "2021-CS-003", remarks: "Average" },
  { id: 4, name: "Hina Tariq", rollNo: "2021-CS-004", remarks: "Needs Improvement" },
  { id: 5, name: "Usman Riaz", rollNo: "2021-CS-005", remarks: "Excellent" },
];

const ReportsContent: React.FC<ReportProps> = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [period, setPeriod] = useState<"one_day" | "one_week" | "one_month">("one_day");

  // Utility: Convert period to date range
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "one_day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "one_week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "one_month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    return { startDate, endDate: now };
  };

  // Group rides by overlapping start/end times
  const groupRides = (rides: Ride[]): Ride[][] => {
    const groups: Ride[][] = [];

    // Sort rides safely, check start_time exists
    const sortedRides = rides
      .filter(ride => ride.start_time && typeof ride.start_time.toMillis === "function")
      .sort(
        (a, b) => a.start_time.toMillis() - b.start_time.toMillis()
      );

    sortedRides.forEach((ride) => {
      let addedToGroup = false;
      for (const group of groups) {
        const overlaps = group.some((r) => {
          if (
            !r.start_time || !r.end_time || !ride.start_time || !ride.end_time ||
            typeof r.start_time.toMillis !== "function" ||
            typeof r.end_time.toMillis !== "function" ||
            typeof ride.start_time.toMillis !== "function" ||
            typeof ride.end_time.toMillis !== "function"
          ) {
            return false;
          }
          const startA = r.start_time.toMillis();
          const endA = r.end_time.toMillis();
          const startB = ride.start_time.toMillis();
          const endB = ride.end_time.toMillis();
          return startA <= endB && startB <= endA;
        });
        if (overlaps) {
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
  };

  // Fetch student names by roll numbers
  const fetchStudentNames = async (rollNos: string[]): Promise<Record<string, string>> => {
    const studentsCollection = collection(
      firestore,
      "users",
      "user_roles",
      "students"
    );
    const namesMap: Record<string, string> = {};

    if (rollNos.length === 0) return namesMap;

    const batchSize = 10;
    for (let i = 0; i < rollNos.length; i += batchSize) {
      const batchRollNos = rollNos.slice(i, i + batchSize);
      const q = query(studentsCollection, where("rollNo", "in", batchRollNos));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.rollNo && data.name) {
          namesMap[data.rollNo] = data.name;
        }
      });
    }
    return namesMap;
  };

  // Main fraud detection & report generation function
  const generateFraudReport = async () => {
    setLoading(true);
    setError(null);
    setReportGenerated(false);

    try {
      const { startDate, endDate } = getDateRange();

      const ridesCollection = collection(firestore, "rides");
      // Simplified query to avoid composite index requirement
      const q = query(
        ridesCollection,
        where("ride_status", "==", "completed")
      );
      const ridesSnapshot = await getDocs(q);

      if (ridesSnapshot.empty) {
        setError("No completed rides found in the selected period.");
        setLoading(false);
        return;
      }

      // Map all rides, filter out rides with invalid timestamps
      const allRides: Ride[] = ridesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            start_time: data.start_time,
            end_time: data.end_time,
            ride_status: data.ride_status,
            offlineOnBoard: data.offlineOnBoard || [],
            onlineOnBoard: data.onlineOnBoard || [],
            bus_name: data.bus_name || "Unknown Bus",
            route_name: data.route_name || "Unknown Route",
          };
        })
        .filter(
          (ride) =>
            ride.start_time &&
            ride.end_time &&
            typeof ride.start_time.toMillis === "function" &&
            typeof ride.end_time.toMillis === "function"
        );

      // Filter rides by start_time range in app code
      const rides = allRides.filter((ride) => {
        const startMillis = ride.start_time.toMillis();
        return startMillis >= startDate.getTime() && startMillis <= endDate.getTime();
      });

      if (rides.length === 0) {
        setError("No completed rides found in the selected period.");
        setLoading(false);
        return;
      }

      const groupedRides = groupRides(rides);

      const fraudRollNosSet = new Set<string>();
      const fraudRemarksMap: Record<string, Set<string>> = {};

      for (const group of groupedRides) {
        if (group.length < 2) continue;

        // Sort group safely
        const sortedGroup = group
          .filter(
            (ride) =>
              ride.start_time &&
              typeof ride.start_time.toMillis === "function"
          )
          .sort(
            (a, b) => a.start_time.toMillis() - b.start_time.toMillis()
          );

        if (sortedGroup.length === 0) continue;

        const baseRide = sortedGroup[0];

        baseRide.offlineOnBoard.forEach((rollNo) => {
          let count = 0;
          const ridesWithRollNo: string[] = [];
          for (const ride of sortedGroup) {
            if (ride.offlineOnBoard.includes(rollNo)) {
              count++;
              ridesWithRollNo.push(`${ride.bus_name} - ${ride.route_name}`);
            }
          }
          if (count > 1) {
            fraudRollNosSet.add(rollNo);
            if (!fraudRemarksMap[rollNo]) fraudRemarksMap[rollNo] = new Set();
            ridesWithRollNo.forEach((remark) => fraudRemarksMap[rollNo].add(remark));
          }
        });

        baseRide.onlineOnBoard.forEach((rollNo) => {
          for (let i = 1; i < sortedGroup.length; i++) {
            const otherRide = sortedGroup[i];
            if (otherRide.offlineOnBoard.includes(rollNo)) {
              fraudRollNosSet.add(rollNo);
              if (!fraudRemarksMap[rollNo]) fraudRemarksMap[rollNo] = new Set();
              fraudRemarksMap[rollNo].add(`${baseRide.bus_name} - ${baseRide.route_name}`);
              fraudRemarksMap[rollNo].add(`${otherRide.bus_name} - ${otherRide.route_name}`);
            }
          }
        });
      }

      if (fraudRollNosSet.size === 0) {
        setError("No fraudulent activity detected for the selected period.");
        setLoading(false);
        return;
      }

      const fraudRollNos = Array.from(fraudRollNosSet);
      const namesMap = await fetchStudentNames(fraudRollNos);

      const students_name = fraudRollNos.map((rollNo) => namesMap[rollNo] || "Unknown");
      const students_rollNo = fraudRollNos;
      const remarks = fraudRollNos.map((rollNo) =>
        Array.from(fraudRemarksMap[rollNo]).join(", ")
      );

      const reportsCollection = collection(firestore, "reports");
      await addDoc(reportsCollection, {
        generated_at: serverTimestamp(),
        period,
        students_name,
        students_rollNo,
        remarks,
      });

      setReportGenerated(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}
      <div className="flex flex-col flex-1 h-screen relative">
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <ReportsHeader
              onGenerateReport={generateFraudReport}
              loading={loading}
              period={period}
              onPeriodChange={setPeriod}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            {loading && (
              <div className="text-center font-semibold text-blue-600">
                Generating report, please wait...
              </div>
            )}
            {error && (
              <div className="text-center font-semibold text-red-600">{error}</div>
            )}
            {reportGenerated && (
              <div className="text-center font-semibold text-green-600">
                Fraudulent report generated successfully!
              </div>
            )}
            {/* Table UI */}
            <div className="rounded-lg border border-gray-300 overflow-hidden mt-4">
              <table className="w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%]">
                      Sr#
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[20%]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[25%]">
                      Roll No
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[50%]">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dummyReports.map((report, index) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 border-b border-gray-300 text-center"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-[5%]">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[20%] overflow-hidden text-ellipsis">
                        {report.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[25%]">
                        {report.rollNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-[50%]">
                        {report.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* End Table UI */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsContent;
