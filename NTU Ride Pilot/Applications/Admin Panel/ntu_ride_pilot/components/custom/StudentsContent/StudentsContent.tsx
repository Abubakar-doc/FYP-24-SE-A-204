import React, { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import StudentsHeader from "./StudentComponents/StudentsHeader";
import StudentEditButton from "./StudentEditButton";
import StudentDeleteButton from "./StudentDeleteButton";
import Pagination from "./StudentComponents/Pagination";

const StudentsContent: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [busCardFilter, setBusCardFilter] = useState<"Active" | "Inactive" | "All">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [10, 20, 30, 40, 50];
  const [currentPage, setCurrentPage] = useState(1); // Track current page number

  // Fetch all students on first load
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const studentsCollection = collection(
        firestore,
        "users",
        "user_roles",
        "students"
      );
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map((doc) => doc.data());
      setAllStudents(studentsList);
      setCurrentPage(1);
      setStudents(studentsList.slice(0, rowsPerPage));
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  const handleStudentDeleted = () => {
    fetchStudents();
  };

  // Filtering logic based on bus card status
  const filteredStudents = allStudents.filter((student) => {
    if (busCardFilter === "All") {
      return true;
    }
    return student.bus_card_status === busCardFilter;
  });

  // Search logic (case-insensitive, on name, roll_no, bus_card_status)
  const searchedStudents = filteredStudents.filter((student) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (student.name && student.name.toLowerCase().includes(search)) ||
      (student.roll_no && String(student.roll_no).toLowerCase().includes(search)) ||
      (student.bus_card_status && student.bus_card_status.toLowerCase().includes(search))
    );
  });

  // Update displayed students whenever filters/search/page/rowsPerPage/allStudents change
  useEffect(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setStudents(searchedStudents.slice(startIndex, endIndex));
  }, [busCardFilter, searchTerm, rowsPerPage, currentPage, allStudents]);

  // Handler for loading next page
  const handleNext = () => {
    if (currentPage < Math.ceil(searchedStudents.length / rowsPerPage)) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsPaginating(false);
      }, 300); // simulate loading delay
    }
  };

  // Handler for loading previous page
  const handlePrev = () => {
    if (currentPage > 1) {
      setIsPaginating(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setIsPaginating(false);
      }, 300); // simulate loading delay
    }
  };

  // Handler for changing rows per page, reset to page 1
  const handleRowsPerPageChange = (rows: number) => {
    setRowsPerPage(rows);
    setCurrentPage(1);
  };

  // Show pagination only if total searched students exceed rowsPerPage
  const showPagination = searchedStudents.length > rowsPerPage;

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}

      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Loading overlay - covers only the student content, not sidebar */}
        {(isLoading || isPaginating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator message={isLoading ? "Loading students..." : "Loading more..."} />
          </div>
        )}
        {/* HEADER: sticky at top, does not scroll */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <StudentsHeader
              busCardFilter={busCardFilter}
              setBusCardFilter={setBusCardFilter}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
            />
          </div>
        </div>
        {/* BODY: fills remaining height, scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="rounded-lg border border-gray-300 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300 text-sm text-left">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-300">
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[5%]">
                      ID
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%]">
                      Name
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Roll No
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Fee
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%]">
                      Bus Card
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[15%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white text-center">
                  {students.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-300">
                      <td className="px-4 py-4 whitespace-nowrap w-[5%]">
                        {(currentPage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap w-[15%]">{student.roll_no}</td>
                      <td className="px-4 py-4 whitespace-nowrap w-[15%]">
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-500 text-white">
                          Paid
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap w-[10%]">
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            student.bus_card_status === "Active"
                              ? "bg-green-500 text-white"
                              : student.bus_card_status === "Inactive"
                              ? "bg-red-600 text-white"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {student.bus_card_status ?? "-"}
                        </span>
                      </td>
                      <td className="px-20 py-4 flex items-center space-x-2 ">
                        <StudentEditButton rollNo={student.roll_no} />
                        <StudentDeleteButton
                          rollNo={student.roll_no}
                          onDelete={handleStudentDeleted}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination controls */}
              {showPagination && (
                <Pagination
                  currentLoadedCount={currentPage * rowsPerPage}
                  totalRows={searchedStudents.length}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={rowsPerPageOptions}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  isNextDisabled={currentPage >= Math.ceil(searchedStudents.length / rowsPerPage)}
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

export default StudentsContent;
