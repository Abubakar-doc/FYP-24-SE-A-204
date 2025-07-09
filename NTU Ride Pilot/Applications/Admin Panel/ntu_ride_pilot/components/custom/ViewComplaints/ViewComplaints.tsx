"use client";
import React, { useEffect, useState } from "react";
import ViewComplaintsHeader from "./ViewComplaintsHeader";
import { FaFilePdf, FaFileAlt } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

type ComplaintViewMode = "driver" | "student";
type ComplaintViewData = {
  id: string;
  name: string;
  email: string;
  title: string;
  message: string;
  rollNo?: string;
  mediaLinks?: string[];
};

type ViewComplaintsProps = {
  mode: ComplaintViewMode;
  onBack: () => void;
};

// Media preview logic
const renderMediaPreview = (url: string, idx: number) => {
  const isImage = url.match(/\.(jpeg|jpg|png)$/i);
  const isPdf = url.match(/\.pdf$/i);
  const filename = url.split("/").pop()?.split("?")[0] || `file-${idx + 1}`;
  if (isImage) {
    return (
      <div
        key={url}
        className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white"
      >
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          title="Download Image"
        >
          <img
            src={url}
            alt="Media Preview"
            className="w-full h-32 object-cover"
          />
          <div className="text-xs text-center py-1 truncate">{filename}</div>
        </a>
      </div>
    );
  }
  if (isPdf) {
    return (
      <div
        key={url}
        className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center"
      >
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          title="Download PDF"
          className="flex flex-col items-center py-4"
        >
          <FaFilePdf className="text-5xl text-red-600 mb-2" />
          <div className="text-xs text-center truncate">{filename}</div>
        </a>
      </div>
    );
  }
  // fallback
  return (
    <div
      key={url}
      className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center"
    >
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        title="Download File"
        className="flex flex-col items-center py-4"
      >
        <FaFileAlt className="text-5xl text-gray-600 mb-2" />
        <div className="text-xs text-center truncate">{filename}</div>
      </a>
    </div>
  );
};

const ViewComplaints: React.FC<ViewComplaintsProps> = ({
  mode,
  onBack,
}) => {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [complaint, setComplaint] = useState<ComplaintViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  // Notification logic (success/error)
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setComplaint(null);
    setLoading(true);
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchComplaint = async () => {
      try {
        const docRef = doc(firestore, "feedback", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          if (isMounted) {
            setComplaint(null);
            setLoading(false);
          }
          return;
        }

        const data = docSnap.data();
        let name = "Unknown";
        let email = "";
        let rollNo = "";
        if (mode === "driver" && data.driverEmail) {
          email = data.driverEmail;
          const driversCol = collection(
            firestore,
            "users",
            "user_roles",
            "drivers"
          );
          const q = query(driversCol, where("email", "==", data.driverEmail));
          const driverSnap = await getDocs(q);
          if (!driverSnap.empty) {
            const driverDoc = driverSnap.docs[0].data();
            name = driverDoc.name || "Unknown";
          }
        } else if (mode === "student" && data.studentRollNo) {
          rollNo = data.studentRollNo;
          const studentsCol = collection(
            firestore,
            "users",
            "user_roles",
            "students"
          );
          const q = query(
            studentsCol,
            where("roll_no", "==", data.studentRollNo)
          );
          const studentSnap = await getDocs(q);
          if (!studentSnap.empty) {
            const studentDoc = studentSnap.docs[0].data();
            name = studentDoc.name || "Unknown";
            email = studentDoc.email || "";
          }
        }

        if (isMounted) {
          setComplaint({
            id: id,
            name: name,
            email: email || data.driverEmail || data.studentEmail || "",
            title: data.message || "",
            message: data.message || "",
            rollNo: rollNo,
            mediaLinks: data.mediaLinks || [],
          });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setComplaint(null);
          setLoading(false);
        }
      }
    };
    fetchComplaint();

    return () => {
      isMounted = false;
    };
  }, [id, mode]);

  // Handler for Resolve button
  const handleResolve = async () => {
    if (!complaint) return;
    setResolving(true);
    try {
      const docRef = doc(firestore, "feedback", complaint.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setNotificationMessage("Complaint not found!");
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setResolving(false);
        return;
      }
      const data = docSnap.data();
      // Already resolved
      if (data.feedbackStatus === "resolved") {
        setNotificationMessage(
          `"${complaint.message}" is already resolved!`
        );
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        setResolving(false);
        return;
      }
      // Not resolved yet
      await updateDoc(docRef, { feedbackStatus: "resolved" });
      setNotificationMessage(
        `"${complaint.message}" is resolved successfully!`
      );
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      setNotificationMessage("Failed to resolve complaint.");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
    setResolving(false);
  };

  return (
    <div className="flex h-screen bg-white w-full">
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Loading overlay - covers only the content area, not sidebar */}
        {(loading || resolving) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator
              message={loading ? "Loading complaint..." : "Resolving..."}
            />
          </div>
        )}

        {/* Notification */}
        {showNotification && (
          <div
            className={`fixed bottom-4 right-4 z-50 p-8 rounded-lg shadow-lg text-white font-bold transition duration-600 animate-out ${
              notificationMessage.toLowerCase().includes("successfully")
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {notificationMessage}
          </div>
        )}

        {/* Sticky header */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <ViewComplaintsHeader
            onBackToComplaints={onBack}
          />
        </div>
        {/* Scrollable content body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-4 p-4 mx-6">
            {/* Resolve button row */}
            <div className="flex justify-end mb-4">
              <button
                className={
                  "w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300 cursor-pointer" +
                  (resolving || loading ? " cursor-not-allowed" : "")
                }
                onClick={handleResolve}
                disabled={resolving || loading}
              >
                Resolve
              </button>
            </div>
            {(!loading && !complaint) && (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-lg text-red-600">Complaint not found.</div>
              </div>
            )}
            {(!loading && complaint) && (
              <>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-[#202020]">
                      Name*
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded bg-gray-100 border border-gray-200"
                      value={complaint.name}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-[#202020]">
                      Email*
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded bg-gray-100 border border-gray-200"
                      value={complaint.email}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                {mode === "student" && (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-[#202020]">
                      Roll Number*
                    </label>
                    <input
                      className="w-full px-4 py-2 rounded bg-gray-100 border border-gray-200"
                      value={complaint.rollNo || ""}
                      disabled
                      readOnly
                    />
                  </div>
                )}
                {/* Title field removed as per requirement */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-[#202020]">
                    Message*
                  </label>
                  <textarea
                    className="w-full px-4 py-2 rounded bg-gray-100 border border-gray-200 min-h-[100px] overflow-y-auto"
                    value={complaint.message}
                    disabled
                    readOnly
                  />
                </div>

                {/* Media preview for view mode */}
                {Array.isArray(complaint.mediaLinks) &&
                  complaint.mediaLinks.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-[#202020] mb-1">
                        Attached Media Files
                      </label>
                      <div className="flex flex-wrap">
                        {complaint.mediaLinks.map((url, idx) =>
                          renderMediaPreview(url, idx)
                        )}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewComplaints;
