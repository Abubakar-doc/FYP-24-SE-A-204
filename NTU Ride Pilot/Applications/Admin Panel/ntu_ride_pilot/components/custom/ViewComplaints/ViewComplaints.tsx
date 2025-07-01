"use client";
import React, { useEffect, useState } from "react";
import ViewComplaintsHeader from "./ViewComplaintsHeader";
import { FaFilePdf, FaFileAlt } from 'react-icons/fa';
import { useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

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
  const filename = url.split('/').pop()?.split('?')[0] || `file-${idx + 1}`;
  if (isImage) {
    return (
      <div key={url} className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white">
        <a href={url} download target="_blank" rel="noopener noreferrer" title="Download Image">
          <img src={url} alt="Media Preview" className="w-full h-32 object-cover" />
          <div className="text-xs text-center py-1 truncate">{filename}</div>
        </a>
      </div>
    );
  }
  if (isPdf) {
    return (
      <div key={url} className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center">
        <a href={url} download target="_blank" rel="noopener noreferrer" title="Download PDF" className="flex flex-col items-center py-4">
          <FaFilePdf className="text-5xl text-red-600 mb-2" />
          <div className="text-xs text-center truncate">{filename}</div>
        </a>
      </div>
    );
  }
  // fallback
  return (
    <div key={url} className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center">
      <a href={url} download target="_blank" rel="noopener noreferrer" title="Download File" className="flex flex-col items-center py-4">
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
  const [complaint, setComplaint] = useState<ComplaintViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackStatus, setFeedbackStatus] = useState<string | undefined>(undefined);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const feedbackId = searchParams.get("id");
    if (!feedbackId) {
      setComplaint(null);
      setFeedbackStatus(undefined);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchComplaint = async () => {
      try {
        const docRef = doc(firestore, "feedback", feedbackId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setComplaint({
            id: feedbackId,
            name: data.driverName || data.studentName || "Unknown",
            email: data.driverEmail || data.studentEmail || "",
            title: data.message || "",
            message: data.message || "",
            rollNo: data.studentRollNo || "",
            mediaLinks: data.mediaLinks || [],
          });
          setFeedbackStatus(data.feedbackStatus); // <-- Track feedbackStatus
        } else {
          setComplaint(null);
          setFeedbackStatus(undefined);
        }
      } catch (err) {
        setComplaint(null);
        setFeedbackStatus(undefined);
      }
      setLoading(false);
    };
    fetchComplaint();
  }, [searchParams]);

  // Handler for Resolve button
  const handleResolve = async () => {
    if (!complaint) return;
    setResolving(true);
    try {
      const docRef = doc(firestore, "feedback", complaint.id);
      await updateDoc(docRef, { feedbackStatus: "resolved" });
      setFeedbackStatus("resolved");
    } catch (err) {
      // Optionally handle error (e.g., show a toast)
    }
    setResolving(false);
  };

  if (loading) {
    return (
      <div className="bg-white w-full min-h-screen relative flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="bg-white w-full min-h-screen relative flex items-center justify-center">
        <div className="text-lg text-red-600">Complaint not found.</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white w-full">
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Sticky header */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <ViewComplaintsHeader
            onBackToComplaints={onBack}
            onResolve={handleResolve}
            resolveDisabled={feedbackStatus === "resolved" || resolving}
          />
        </div>
        {/* Scrollable content body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-4 p-4 mx-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-[#202020]">Name*</label>
                <input
                  className="w-full px-4 py-2 rounded bg-gray-100 border border-gray-200"
                  value={complaint.name}
                  disabled
                  readOnly
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold text-[#202020]">Email*</label>
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
                <label className="block text-sm font-semibold text-[#202020]">Roll Number*</label>
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
              <label className="block text-sm font-semibold text-[#202020]">Message*</label>
              <textarea
                className="w-full px-4 py-2 rounded bg-gray-100 border border-gray-200 min-h-[100px] overflow-y-auto"
                value={complaint.message}
                disabled
                readOnly
              />
            </div>

            {/* Media preview for view mode */}
            {Array.isArray(complaint.mediaLinks) && complaint.mediaLinks.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#202020] mb-1">
                  Attached Media Files
                </label>
                <div className="flex flex-wrap">
                  {complaint.mediaLinks.map((url, idx) => renderMediaPreview(url, idx))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewComplaints;
