// reportUtils.ts
"use client";
import { firestore } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";

export interface FraudReportEntry {
  student_rollNo: string;
  bus_id: string;
  created_at?: Timestamp;
}

function isTimestamp(val: any): val is Timestamp {
  return val && typeof val.toDate === "function" && typeof val.toMillis === "function";
}

/**
 * Fetches a report document by ID and structures fraud report data exactly as in ReportsContent.
 * @param reportId Firestore document ID of the report
 * @returns { fraudReportsRaw, groupedFraudReports, filter } or throws error if fetch fails
 */
export async function fetchAndStructureReportById(reportId: string) {
  const reportDocRef = doc(firestore, "reports", reportId);
  const reportSnap = await getDoc(reportDocRef);

  if (!reportSnap.exists()) {
    throw new Error("Report not found");
  }

  const data = reportSnap.data();

  let fraudReportsRaw: FraudReportEntry[] = [];

  const filter = data.filter;

  if (filter === "one_day") {
    fraudReportsRaw = Array.isArray(data.fraud_reports) ? data.fraud_reports : [];
  } else if (filter === "one_week" || filter === "one_month") {
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
  } else {
    // Unknown filter, return empty
    fraudReportsRaw = [];
  }

  // Group by student_rollNo
  const groupedFraudReports: Record<string, { bus_id: string; created_at: Timestamp }[]> = {};
  fraudReportsRaw.forEach((entry) => {
    const { student_rollNo, bus_id, created_at } = entry;
    if (!student_rollNo || !bus_id || !created_at) return;
    if (!groupedFraudReports[student_rollNo]) groupedFraudReports[student_rollNo] = [];
    groupedFraudReports[student_rollNo].push({ bus_id, created_at });
  });

  return { fraudReportsRaw, groupedFraudReports, filter };
}
