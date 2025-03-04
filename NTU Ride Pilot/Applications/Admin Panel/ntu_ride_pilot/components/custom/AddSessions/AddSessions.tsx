"use client";

import React, { useState, useEffect } from "react";
import AddSessionHeader from "./AddSessionHeader";
import { firestore } from "@/lib/firebase";
import { collection, addDoc, Timestamp, query, getDocs, orderBy, limit } from "firebase/firestore";

type AddSessionFormProps = {
  onBack: () => void;
};

const AddSessionForm: React.FC<AddSessionFormProps> = ({ onBack }) => {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [minStartDate, setMinStartDate] = useState("");
  const [minEndDate, setMinEndDate] = useState("");

  useEffect(() => {
    const fetchLatestSession = async () => {
      const sessionsRef = collection(firestore, "sessions");
      const sessionsQuery = query(sessionsRef, orderBy("start_date", "desc"), limit(1));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      if (!sessionsSnapshot.empty) {
        const latestSession = sessionsSnapshot.docs[0].data();
        const latestEndDate = latestSession.end_date.toDate();
        latestEndDate.setDate(latestEndDate.getDate() + 1); // Set to the next day
        setMinStartDate(latestEndDate.toISOString().split("T")[0]);
      }
    };

    fetchLatestSession();
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedStartDate = e.target.value;
    setStartDate(selectedStartDate);
    if (selectedStartDate) {
      const nextDay = new Date(selectedStartDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setMinEndDate(nextDay.toISOString().split("T")[0]);
    }
    setEndDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const startDateTimestamp = Timestamp.fromDate(new Date(startDate));
      const endDateTimestamp = Timestamp.fromDate(new Date(endDate));
      const createdAt = Timestamp.now();

      await addDoc(collection(firestore, "sessions"), {
        name,
        start_date: startDateTimestamp,
        end_date: endDateTimestamp,
        session_status: "active",
        created_at: createdAt,
        updated_at: createdAt,
      });

      setSuccessMessage("The session has been successfully created!");
      setName("");
      setStartDate("");
      setEndDate("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error adding session:", error);
      setSuccessMessage("Failed to create session");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-md shadow-md">
      <AddSessionHeader onBackToSessions={onBack} />
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name *
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 p-3"
            placeholder="Enter session name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isProcessing}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Starting Date *
            </label>
            <input
              type="date"
              id="startDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 p-3"
              value={startDate}
              onChange={handleStartDateChange}
              min={minStartDate}
              required
              disabled={isProcessing}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              Ending Date *
            </label>
            <input
              type="date"
              id="endDate"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 p-3"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={minEndDate}
              required
              disabled={!startDate || isProcessing}
              onClick={() => {
                if (!startDate) {
                  setShowWarning(true);
                }
              }}
            />
            {showWarning && (
              <div className="text-red-500 text-sm font-medium mt-2">
                Please select a starting date first!
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isProcessing ? "Processing..." : "Add"}
          </button>
        </div>
      </form>
      {successMessage && (
        <div className="bg-green-500 text-white font-bold py-2 px-4 rounded mt-4">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AddSessionForm;
