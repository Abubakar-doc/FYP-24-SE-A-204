"use client";
import React, { useState, useEffect } from "react";
import ComplaintsHeader from "./ComplaintsHeader";
import ViewComplaints from "@/components/custom/ViewComplaints/ViewComplaints";
import { firestore } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import Pagination from "./Pagination"; 
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";


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

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 20, 30, 40, 50];
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");

  // Search state
  const [search, setSearch] = useState<string>("");

  // View logic
  const [viewMode, setViewMode] = useState<ComplaintViewMode | null>(null);
  const [viewComplaintId, setViewComplaintId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(true);

    let unsubFeedback: (() => void) | null = null;
    let isMounted = true;

    const fetchUsersAndListenFeedback = async () => {
      try {
        const driversCollection = collection(firestore, "users", "user_roles", "drivers");
        const studentsCollection = collection(firestore, "users", "user_roles", "students");
        const [driversSnap, studentsSnap] = await Promise.all([
          getDocs(driversCollection),
          getDocs(studentsCollection),
        ]);
        const driversList = driversSnap.docs.map(doc => doc.data());
        const studentsList = studentsSnap.docs.map(doc => doc.data());

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

        const feedbackCollection = collection(firestore, "feedback");
        const feedbackQuery = query(feedbackCollection, orderBy("createdAt", "desc"));
        unsubFeedback = onSnapshot(feedbackQuery, (feedbackSnapshot) => {
          const feedbackDocs = feedbackSnapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() } as FeedbackDoc)
          );

          const driverComplaintsArr: any[] = [];
          const studentComplaintsArr: any[] = [];

          feedbackDocs.forEach((feedback) => {
            const status =
              feedback.feedbackStatus === "resolved"
                ? "Resolved"
                : "UnResolved";

            if (feedback.driverEmail) {
              driverComplaintsArr.push({
                id: feedback.id,
                name: driverEmailToName[feedback.driverEmail] || "Unknown",
                email: feedback.driverEmail,
                title: feedback.message || "",
                message: feedback.message || "",
                status: status,
              });
            } else if (feedback.studentRollNo) {
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
      let foundComplaint = driversComplaints.find((c) => c.id === id);
      let mode: ComplaintViewMode = "driver";
      if (!foundComplaint) {
        foundComplaint = studentsComplaints.find((c) => c.id === id);
        mode = "student";
      }
      if (foundComplaint) {
        setViewMode(mode);
        setViewComplaintId(id);
      }
    } else {
      setViewMode(null);
      setViewComplaintId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, driversComplaints, studentsComplaints]);

  const handleViewComplaint = (
    mode: ComplaintViewMode,
    complaint: any
  ) => {
    router.push(`?id=${complaint.id}`);
  };

  const handleBackFromView = () => {
    router.push("?");
    setViewMode(null);
    setViewComplaintId(null);
  };

  // Filtering logic
  const getFilteredComplaints = () => {
    let data = activeTab === "drivers" ? driversComplaints : studentsComplaints;
    if (filter === "all") {
      return data;
    } else if (filter === "active") {
      return data.filter((c) => c.status === "Resolved");
    } else if (filter === "suspended") {
      return data.filter((c) => c.status === "UnResolved");
    }
    return data;
  };

  // Search logic (applied after filter)
  const getSearchedComplaints = () => {
    const filtered = getFilteredComplaints();
    if (!search.trim()) return filtered;
    const lowerSearch = search.trim().toLowerCase();
    return filtered.filter((c) => {
      return (
        (c.name && c.name.toLowerCase().includes(lowerSearch)) ||
        (c.email && c.email.toLowerCase().includes(lowerSearch)) ||
        (c.message && c.message.toLowerCase().includes(lowerSearch)) ||
        (c.status && c.status.toLowerCase().includes(lowerSearch))
      );
    });
  };

  // Pagination logic for filtered+searched complaints
  const searchedComplaints = getSearchedComplaints();
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedComplaints = searchedComplaints.slice(startIndex, endIndex);

  // Pagination handlers
  const handleNext = () => {
    if (currentPage < Math.ceil(searchedComplaints.length / rowsPerPage)) {
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

  const showPagination = searchedComplaints.length > rowsPerPage;

  if (viewMode && viewComplaintId) {
    return (
      <ViewComplaints
        mode={viewMode}
        onBack={handleBackFromView}
      />
    );
  }

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}

      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Loading overlay - covers only the complaints content, not sidebar */}
        {(loading || isPaginating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator message={loading ? "Loading complaints..." : "Loading more..."} />
          </div>
        )}
        {/* HEADER: sticky at top, does not scroll */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <ComplaintsHeader
              filter={filter}
              setFilter={setFilter}
              search={search}
              setSearch={setSearch}
            />
          </div>
        </div>
        {/* TABS */}
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
        {/* BODY: fills remaining height, scrollable */}
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
                  {/* Only show "No complaints found" after loading is false */}
                  {!loading && paginatedComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "drivers" ? 6 : 7} className="py-8 text-center">
                        {activeTab === "drivers"
                          ? "No driver complaints found."
                          : "No student complaints found."}
                      </td>
                    </tr>
                  ) : (
                    !loading &&
                    paginatedComplaints.map((complaint, index) => (
                      <tr
                        key={complaint.id}
                        className={`hover:bg-gray-50 border-b border-gray-300${activeTab === "students" ? " text-center" : ""}`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          {startIndex + index + 1}
                        </td>
                        {activeTab === "students" && (
                          <td className="px-4 py-4 whitespace-nowrap">
                            {complaint.rollNo}
                          </td>
                        )}
                        <td className="px-4 py-4 whitespace-nowrap overflow-hidden text-ellipsis">
                          {complaint.name}
                        </td>
                        <td className={`px-4 py-4 whitespace-nowrap${activeTab === "students" ? " px-6" : ""}`}>
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
                              handleViewComplaint(
                                activeTab === "drivers" ? "driver" : "student",
                                complaint
                              )
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
              {/* Pagination controls */}
              {showPagination && (
                <Pagination
                  currentLoadedCount={currentPage * rowsPerPage}
                  totalRows={searchedComplaints.length}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={rowsPerPageOptions}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  isNextDisabled={currentPage >= Math.ceil(searchedComplaints.length / rowsPerPage)}
                  isPrevDisabled={currentPage <= 1}
                />
              )}
            </div>
          </div>
        </div>
        {/* END BODY */}
      </div>
      {/* END MAIN CONTENT */}
    </div>
  );
};

export default ComplaintsContent;
