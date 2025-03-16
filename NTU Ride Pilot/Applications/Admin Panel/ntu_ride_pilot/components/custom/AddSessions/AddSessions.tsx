"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddSessionHeader from "./AddSessionHeader";
import { firestore } from "@/lib/firebase";
import { collection, addDoc, Timestamp, query, getDocs, orderBy, limit, where, doc, updateDoc } from "firebase/firestore";

type AddSessionFormProps = {
  onBack: () => void;
};

const AddSessionForm: React.FC<AddSessionFormProps> = ({ onBack }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Form state
  const [id, setId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [minStartDate, setMinStartDate] = useState("");
  const [minEndDate, setMinEndDate] = useState("");
  const [isFirstSession, setIsFirstSession] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [activeSessionName, setActiveSessionName] = useState("");
  const [originalStartDate, setOriginalStartDate] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const idParam = searchParams.get("id");
    const nameParam = searchParams.get("name");
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");
    const editParam = searchParams.get("edit");

    if (editParam === "true") setIsEdit(true);

    if (idParam) {
      setId(idParam);
      setName(nameParam || "");
      if (startDateParam) {
        setStartDate(startDateParam);
        setOriginalStartDate(startDateParam);
        setMinStartDate(startDateParam);
      }
      if (endDateParam) setEndDate(endDateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchLatestSession = async () => {
      if (isEdit) return;

      const sessionsRef = collection(firestore, "sessions");
      const sessionsQuery = query(sessionsRef, orderBy("start_date", "desc"), limit(1));
      const sessionsSnapshot = await getDocs(sessionsQuery);

      if (sessionsSnapshot.empty) {
        const currentDate = new Date();
        setMinStartDate(currentDate.toISOString().split("T")[0]);
        setIsFirstSession(true);
      } else {
        const latestSession = sessionsSnapshot.docs[0].data();
        const latestEndDate = latestSession.end_date.toDate();
        latestEndDate.setDate(latestEndDate.getDate() + 1);
        setMinStartDate(latestEndDate.toISOString().split("T")[0]);
      }
    };

    fetchLatestSession();
  }, [isEdit]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedStartDate = e.target.value;
    setStartDate(selectedStartDate);
    if (!isEdit) setEndDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (isEdit) {
        const sessionRef = doc(firestore, "sessions", id!);
        await updateDoc(sessionRef, {
          name,
          start_date: Timestamp.fromDate(new Date(startDate)),
          end_date: Timestamp.fromDate(new Date(endDate)),
          updated_at: Timestamp.now(),
        });
        setSuccessMessage("Session updated successfully!");
      } else {
        const sessionsRef = collection(firestore, "sessions");
        const sessionsQuery = query(sessionsRef, where("session_status", "==", "active"));
        const sessionsSnapshot = await getDocs(sessionsQuery);

        if (!sessionsSnapshot.empty && !isFirstSession) {
          const activeSession = sessionsSnapshot.docs[0].data();
          setActiveSessionName(activeSession.name);
          setSuccessMessage(`Please deactivate the current active session: ${activeSession.name}`);
          setTimeout(() => setSuccessMessage(""), 3000);
          setIsProcessing(false);
          return;
        }

        await addDoc(collection(firestore, "sessions"), {
          name,
          start_date: Timestamp.fromDate(new Date(startDate)),
          end_date: Timestamp.fromDate(new Date(endDate)),
          session_status: "active",
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });
        setSuccessMessage("Session created successfully!");
        setName("");
        setStartDate("");
        setEndDate("");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving session:", error);
      setSuccessMessage("Failed to save session.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [successMessage]);

  return (
    <div className="bg-white w-full min-h-screen relative">
      <div className="rounded-lg mb-2">
        <AddSessionHeader onBackToSessions={onBack} />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4 mx-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-[#202020]">
            Name *
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
            placeholder="Enter session name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isProcessing}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold text-[#202020]">
              Starting Date *
            </label>
            <input
              type="date"
              id="startDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              value={startDate}
              onChange={handleStartDateChange}
              min={isEdit ? originalStartDate : minStartDate}
              required
              disabled={isProcessing}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold text-[#202020]">
              Ending Date *
            </label>
            <input
              type="date"
              id="endDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              disabled={!startDate || isProcessing}
              min={startDate ? getNextDate(startDate) : ""}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-16 rounded focus:outline-none focus:shadow-outline ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isEdit ? "Save Changes" : "Add"}
          </button>
        </div>
      </form>
      {showNotification && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-8 rounded-lg shadow-lg ${
            successMessage.includes("successfully") ? "bg-green-500" : "bg-red-500"
          } text-white font-bold transition duration-600 animate-out`}
        >
          {successMessage}
        </div>
      )}
    </div>
  );
};

// Function to get the next date
const getNextDate = (dateString: string) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

export default AddSessionForm;
