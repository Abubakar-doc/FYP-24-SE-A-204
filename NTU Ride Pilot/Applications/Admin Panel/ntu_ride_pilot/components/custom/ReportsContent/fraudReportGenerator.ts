// utils/fraudReportGenerator.ts
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
  ride_start_time: Timestamp;
  ride_end_time: Timestamp;
  ride_status: string;
  offlineOnBoard: string[]; // array of student rollNos
  onlineOnBoard: string[]; // array of student rollNos
}

interface Student {
  rollNo: string;
  name: string;
}

/**
 * Helper: Check if two rides overlap in time or are close enough to be grouped.
 * We consider rides overlapping if their start/end times overlap or are within 30 minutes.
 */
function ridesOverlapOrClose(
  rideA: Ride,
  rideB: Ride,
  thresholdMinutes = 30
): boolean {
  const startA = rideA.ride_start_time.toDate().getTime();
  const endA = rideA.ride_end_time.toDate().getTime();
  const startB = rideB.ride_start_time.toDate().getTime();
  const endB = rideB.ride_end_time.toDate().getTime();

  // Check if intervals overlap
  if (startA <= endB && startB <= endA) return true;

  // Check if start/end times are within threshold minutes
  const thresholdMs = thresholdMinutes * 60 * 1000;
  if (
    Math.abs(startA - startB) <= thresholdMs ||
    Math.abs(endA - endB) <= thresholdMs
  )
    return true;

  return false;
}

/**
 * Group rides by overlapping or close start/end times.
 * Returns array of ride groups (each group is array of rides)
 */
function groupRides(rides: Ride[]): Ride[][] {
  const groups: Ride[][] = [];

  rides.forEach((ride) => {
    let addedToGroup = false;
    for (const group of groups) {
      // If ride overlaps/closes with any ride in the group, add it
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

/**
 * Fetch student details by rollNos
 */
async function fetchStudentsByRollNos(
  rollNos: string[]
): Promise<Map<string, Student>> {
  if (rollNos.length === 0) return new Map();

  const studentsCollection = collection(
    firestore,
    "users",
    "user_roles",
    "students"
  );

  const studentsMap = new Map<string, Student>();

  // Firestore limits 'in' queries to 10 items, so batch if needed
  const batchSize = 10;
  for (let i = 0; i < rollNos.length; i += batchSize) {
    const batchRollNos = rollNos.slice(i, i + batchSize);
    const q = query(studentsCollection, where("rollNo", "in", batchRollNos));
    const snapshot = await getDocs(q);
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rollNo && data.name) {
        studentsMap.set(data.rollNo, { rollNo: data.rollNo, name: data.name });
      }
    });
  }

  return studentsMap;
}

/**
 * Main function to generate fraud report for a given filter
 * filter: "active" = one day, "all" = one week, "suspended" = one month
 */
export async function generateFraudReport(filter: string) {
  try {
    const now = new Date();
    let startDate: Date;

    switch (filter) {
      case "active": // One Day - today 00:00 to 23:59
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "all": // One Week - last 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "suspended": // One Month - last 30 days
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    console.log(`Generating fraud report for filter: ${filter}, startDate: ${startDate}`);

    // Fetch rides collection
    const ridesCollection = collection(firestore, "rides");

    // Query rides with ride_status "completed" and ride_start_time >= startDate
    const q = query(
      ridesCollection,
      where("ride_status", "==", "completed"),
      where("ride_start_time", ">=", Timestamp.fromDate(startDate))
    );

    const ridesSnapshot = await getDocs(q);
    const rides: Ride[] = [];

    ridesSnapshot.forEach((doc) => {
      const data = doc.data();

      // Defensive check: ensure ride_start_time and ride_end_time are Timestamp
      if (!(data.ride_start_time instanceof Timestamp) || !(data.ride_end_time instanceof Timestamp)) {
        console.warn(`Ride document ${doc.id} has invalid ride_start_time or ride_end_time`);
        return; // skip this document
      }

      rides.push({
        id: doc.id,
        ride_name: data.ride_name,
        route_name: data.route_name,
        ride_start_time: data.ride_start_time,
        ride_end_time: data.ride_end_time,
        ride_status: data.ride_status,
        offlineOnBoard: Array.isArray(data.offlineOnBoard) ? data.offlineOnBoard : [],
        onlineOnBoard: Array.isArray(data.onlineOnBoard) ? data.onlineOnBoard : [],
      });
    });

    console.log(`Fetched ${rides.length} rides from Firestore.`);

    if (rides.length === 0) {
      console.log("No rides found for the selected filter.");
      return;
    }

    const rideGroups = groupRides(rides);
    console.log(`Grouped rides into ${rideGroups.length} groups.`);

    const fraudStudentsMap = new Map<
      string,
      { name: string; rides: Set<string> }
    >();

    for (const group of rideGroups) {
      group.sort(
        (a, b) =>
          a.ride_start_time.toDate().getTime() - b.ride_start_time.toDate().getTime()
      );

      const baseRide = group[0];
      const baseOfflineSet = new Set(baseRide.offlineOnBoard);

      for (let i = 1; i < group.length; i++) {
        const otherRide = group[i];
        const otherOfflineSet = new Set(otherRide.offlineOnBoard);

        baseOfflineSet.forEach((rollNo) => {
          if (otherOfflineSet.has(rollNo)) {
            const rideDesc1 = `${baseRide.ride_name} - ${baseRide.route_name}`;
            const rideDesc2 = `${otherRide.ride_name} - ${otherRide.route_name}`;
            const ridesSet = new Set<string>([rideDesc1, rideDesc2]);

            if (fraudStudentsMap.has(rollNo)) {
              const entry = fraudStudentsMap.get(rollNo)!;
              entry.rides.add(rideDesc1);
              entry.rides.add(rideDesc2);
            } else {
              fraudStudentsMap.set(rollNo, { name: "", rides: ridesSet });
            }
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
              const rideDescI = `${rideI.ride_name} - ${rideI.route_name}`;
              const rideDescJ = `${rideJ.ride_name} - ${rideJ.route_name}`;
              const ridesSet = new Set<string>([rideDescI, rideDescJ]);

              if (fraudStudentsMap.has(rollNo)) {
                const entry = fraudStudentsMap.get(rollNo)!;
                entry.rides.add(rideDescI);
                entry.rides.add(rideDescJ);
              } else {
                fraudStudentsMap.set(rollNo, { name: "", rides: ridesSet });
              }
            }
          });
        }
      }
    }

    if (fraudStudentsMap.size === 0) {
      console.log("No fraud students detected.");
      return;
    }

    const fraudRollNos = Array.from(fraudStudentsMap.keys());
    const studentsMap = await fetchStudentsByRollNos(fraudRollNos);

    fraudStudentsMap.forEach((value, rollNo) => {
      const student = studentsMap.get(rollNo);
      value.name = student ? student.name : "Unknown Student";
    });

    const students_name: string[] = [];
    const students_rollNo: string[] = [];
    const remarks: string[] = [];

    fraudStudentsMap.forEach(({ name, rides }, rollNo) => {
      students_name.push(name);
      students_rollNo.push(rollNo);
      remarks.push(Array.from(rides).join(", "));
    });

    const reportsCollection = collection(firestore, "reports");

    try {
      console.log("Saving fraud report to Firestore...");
      await addDoc(reportsCollection, {
        generated_at: Timestamp.now(),
        filter,
        students_name,
        students_rollNo,
        remarks,
      });
      console.log("Fraud report generated and saved to Firestore.");
    } catch (writeError) {
      console.error("Error saving fraud report to Firestore:", writeError);
      throw writeError;
    }
  } catch (error) {
    console.error("Error in generateFraudReport:", error);
    throw error;
  }
}
