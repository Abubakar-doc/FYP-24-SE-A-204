"use client";
import React, { useState, useEffect } from "react";
import ComplaintsHeader from "./ComplaintsHeader";
import ViewComplaints from "@/components/custom/ViewComplaints/ViewComplaints";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";

// Table headings for each tab
const driversHeadings = [
  "SR#",
  "Name",
  "Email",
  "Message",
  "Status",
  "Actions",
];
const studentsHeadings = [
  "SR#",
  "Roll No",
  "Name",
  "Email",
  "Message",
  "Status",
  "Actions",
];

// Define the feedback document type
type FeedbackDoc = {
  id: string;
  driverEmail?: string;
  studentRollNo?: string;
  message?: string;
  feedbackStatus?: string;
  // ...other possible fields
};

type ComplaintViewMode = "driver" | "student";
type ComplaintViewData = {
  id: string;
  name: string;
  email: string;
  title: string;
  message: string;
  rollNo?: string;
};

const ComplaintsContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"drivers" | "students">("drivers");
  const [driversComplaints, setDriversComplaints] = useState<any[]>([]);
  const [studentsComplaints, setStudentsComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // View logic
  const [viewMode, setViewMode] = useState<ComplaintViewMode | null>(null);
  const [viewComplaint, setViewComplaint] = useState<ComplaintViewData | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(true);

    // Fetch drivers and students once (no need to listen in real time)
    let unsubFeedback: (() => void) | null = null;
    let isMounted = true;

    const fetchUsersAndListenFeedback = async () => {
      try {
        // Fetch all drivers and students
        const driversCollection = collection(firestore, "users", "user_roles", "drivers");
        const studentsCollection = collection(firestore, "users", "user_roles", "students");
        const [driversSnap, studentsSnap] = await Promise.all([
          getDocs(driversCollection),
          getDocs(studentsCollection),
        ]);
        const driversList = driversSnap.docs.map(doc => doc.data());
        const studentsList = studentsSnap.docs.map(doc => doc.data());

        // Helper maps for quick lookup
        const driverEmailToName: Record<string, string> = {};
        driversList.forEach(driver => {
          if (driver.email && driver.name) driverEmailToName[driver.email] = driver.name;
        });

        const studentRollNoToInfo: Record<string, { name: string; email: string }> = {};
        studentsList.forEach(student => {
          if (student.roll_no && student.name) {
            studentRollNoToInfo[student.roll_no] = {
              name: student.name,
              email: student.email || "",
            };
          }
        });

        // Listen to feedback collection in real time
        const feedbackCollection = collection(firestore, "feedback");
        const feedbackQuery = query(feedbackCollection, orderBy("createdAt", "desc"));
        unsubFeedback = onSnapshot(feedbackQuery, (feedbackSnapshot) => {
          const feedbackDocs = feedbackSnapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() } as FeedbackDoc)
          );

          // Separate feedbacks into driver and student complaints
          const driverComplaintsArr: any[] = [];
          const studentComplaintsArr: any[] = [];

          feedbackDocs.forEach((feedback, idx) => {
            // Determine status based on feedbackStatus field
            const status =
              feedback.feedbackStatus === "resolved"
                ? "Resolved"
                : "UnResolved";

            // Driver complaint
            if (feedback.driverEmail) {
              driverComplaintsArr.push({
                id: feedback.id,
                name: driverEmailToName[feedback.driverEmail] || "Unknown",
                email: feedback.driverEmail,
                title: feedback.message || "",
                message: feedback.message || "",
                status: status,
              });
            }
            // Student complaint
            else if (feedback.studentRollNo) {
              const studentInfo = studentRollNoToInfo[feedback.studentRollNo] || { name: "Unknown", email: "" };
              studentComplaintsArr.push({
                id: feedback.id,
                rollNo: feedback.studentRollNo,
                name: studentInfo.name,
                email: studentInfo.email,
                title: feedback.message || "",
                message: feedback.message || "",
                status: status,
              });
            }
          });

          if (isMounted) {
            setDriversComplaints(driverComplaintsArr);
            setStudentsComplaints(studentComplaintsArr);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Error fetching complaints:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchUsersAndListenFeedback();

    return () => {
      isMounted = false;
      if (unsubFeedback) unsubFeedback();
    };
  }, []);

  // Detect query param and open view mode if present
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      // Find the complaint in either list
      let foundComplaint = driversComplaints.find((c) => c.id === id);
      let mode: ComplaintViewMode = "driver";
      if (!foundComplaint) {
        foundComplaint = studentsComplaints.find((c) => c.id === id);
        mode = "student";
      }
      if (foundComplaint) {
        setViewMode(mode);
        setViewComplaint(foundComplaint);
      }
    } else {
      setViewMode(null);
      setViewComplaint(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, driversComplaints, studentsComplaints]);
  
  // View button handler
  const handleViewComplaint = (
    mode: ComplaintViewMode,
    complaint: any
  ) => {
    // Push the id as a query param
    router.push(`?id=${complaint.id}`);
    // The useEffect above will do the rest
  };

  // Back from view
  const handleBackFromView = () => {
    // Remove the id from query params
    router.push("?");
    setViewMode(null);
    setViewComplaint(null);
  };

  // If in view mode, render ViewComplaints
  if (viewMode && viewComplaint) {
    return (
      <ViewComplaints
        mode={viewMode}
        complaint={viewComplaint}
        onBack={handleBackFromView}
      />
    );
  }
  return (
    <div className="flex h-screen bg-white w-full">
      <div className="flex flex-col flex-1 h-screen relative">
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <ComplaintsHeader />
          </div>
        </div>
        <div className="flex items-center space-x-2 mb-4 px-4">
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-4 py-2 rounded-t-lg font-semibold ${
              activeTab === "drivers"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Drivers
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 rounded-t-lg font-semibold ${
              activeTab === "students"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Students
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    {activeTab === "drivers"
                      ? driversHeadings.map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
                          >
                            {heading}
                          </th>
                        ))
                      : studentsHeadings.map((heading) => (
                          <th
                            key={heading}
                            className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider"
                          >
                            {heading}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody className="bg-white text-center">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === "drivers" ? 6 : 7} className="py-8 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : activeTab === "drivers" ? (
                    driversComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          No driver complaints found.
                        </td>
                      </tr>
                    ) : (
                      driversComplaints.map((complaint, index) => (
                        <tr
                          key={complaint.id}
                          className="hover:bg-gray-50 border-b border-gray-300"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                            {complaint.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {complaint.email}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {complaint.title.length > 20
                              ? complaint.title.slice(0, 20) + "..."
                              : complaint.title}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-500 text-white">
                              {complaint.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap flex space-x-2 justify-center">
                            <button
                              className="text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2"
                              onClick={() =>
                                handleViewComplaint("driver", complaint)
                              }
                            >
                              View
                            </button>
                            <button className="text-white font-bold bg-gray-500 hover:bg-gray-700 rounded-lg px-4 py-2">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : studentsComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        No student complaints found.
                      </td>
                    </tr>
                  ) : (
                    studentsComplaints.map((complaint, index) => (
                      <tr
                        key={complaint.id}
                        className="hover:bg-gray-50 border-b border-gray-300 text-center"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {complaint.rollNo}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {complaint.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {complaint.email}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {complaint.title.length > 20
                            ? complaint.title.slice(0, 20) + "..."
                            : complaint.title}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-500 text-white">
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap flex space-x-2 justify-center">
                          <button
                            className="text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2"
                            onClick={() =>
                              handleViewComplaint("student", complaint)
                            }
                          >
                            View
                          </button>
                          <button className="text-white font-bold bg-gray-500 hover:bg-gray-700 rounded-lg px-4 py-2">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* You can add notifications or error handling here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsContent;
