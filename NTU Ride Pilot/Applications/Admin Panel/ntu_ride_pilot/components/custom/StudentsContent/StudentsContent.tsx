import React, { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";
import StudentsHeader from "./StudentComponents/StudentsHeader";
import StudentEditButton from "./StudentEditButton";
import StudentDeleteButton from "./StudentDeleteButton";

const StudentsContent: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busCardFilter, setBusCardFilter] = useState<"Active" | "Inactive" | "All">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchStudents = async () => {
    try {
      const studentsCollection = collection(
        firestore,
        "users",
        "user_roles",
        "students"
      );
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsList = studentsSnapshot.docs.map((doc) => doc.data());
      setStudents(studentsList);
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
  const filteredStudents = students.filter((student) => {
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

  return (
    <div className="flex h-screen bg-white w-full">
      {/* ---- SIDEBAR (if you have one, place here) ---- */}
      {/* <Sidebar /> */}
      {/* End Sidebar */}

      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen">
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
                  {searchedStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-300">
                      <td className="px-4 py-4 whitespace-nowrap w-[5%]">{index + 1}</td>
                      <td className="px-4 py-4 whitespace-nowrap w-[40%] overflow-hidden text-ellipsis">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap w-[15%]">{student.roll_no}</td>
                      <td className="px-4 py-4 whitespace-nowrap w-[15%]">
                        {student.fee_paid ? "Paid" : "Not Paid"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap w-[10%]">
                        {student.bus_card_status ?? "-"}
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
              <div>
                <div className="flex items-center justify-between m-6">
                  <div className="flex items-center">
                    <label htmlFor="rowsPerPage" className="mr-2 text-sm text-gray-700">
                      Rows per page:
                    </label>
                    <select
                      id="rowsPerPage"
                      className="px-3 py-1 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-sm"
                    >
                      <option>10</option>
                      <option>20</option>
                      <option>50</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 border rounded-md hover:bg-gray-100">
                      &lt;
                    </button>
                    <button className="px-3 py-1 border rounded-md hover:bg-gray-100">
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* END BODY */}
      </div>
      {/* END MAIN CONTENT */}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <LoadingIndicator message="Loading students..." />
        </div>
      )}
    </div>
  );
};

export default StudentsContent;
