"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { firestore } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import AddSessionHeader from "./AddSessionHeader";

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
  const [minStartDate, setMinStartDate] = useState(""); // State for restricting previous dates

  // Pre-fill form fields if editing
  useEffect(() => {
    const idParam = searchParams.get("id");
    const nameParam = searchParams.get("name");
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");

    if (idParam) {
      setId(idParam);
      setName(nameParam || "");
      // Set the start and end dates correctly
      if (startDateParam) {
        const formattedStartDate = new Date(startDateParam).toISOString().split("T")[0];
        setStartDate(formattedStartDate);
        setMinStartDate(formattedStartDate); // Restrict previous dates
      }
      if (endDateParam) {
        setEndDate(new Date(endDateParam).toISOString().split("T")[0]); // Format to YYYY-MM-DD
      }
    }
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const startDateTimestamp = Timestamp.fromDate(new Date(startDate));
      const endDateTimestamp = Timestamp.fromDate(new Date(endDate));
      const createdAt = Timestamp.now();

      if (id) {
        // Update existing session
        const sessionRef = doc(firestore, "sessions", id);
        await updateDoc(sessionRef, {
          name,
          start_date: startDateTimestamp,
          end_date: endDateTimestamp,
          updated_at: createdAt,
        });
        setSuccessMessage("Session updated successfully!");
      } else {
        // Create new session
        await addDoc(collection(firestore, "sessions"), {
          name,
          start_date: startDateTimestamp,
          end_date: endDateTimestamp,
          session_status: "active",
          created_at: createdAt,
          updated_at: createdAt,
        });
        setSuccessMessage("Session created successfully!");
      }

      // Clear form and redirect back
      setTimeout(() => router.push("/dashboard/sessions"), 2000); // Adjusted path to redirect correctly
    } catch (error) {
      console.error("Error saving session:", error);
      setSuccessMessage("Failed to save session.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate minimum end date based on selected start date
  const calculateMinEndDate = () => {
    if (startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + 1); // Set minimum end date to one day after the selected start date
      return start.toISOString().split("T")[0]; // Format to YYYY-MM-DD
    }
    return ""; // No minimum if no start date is selected
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
            disabled={isProcessing} // Disable input during processing
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
              onChange={(e) => setStartDate(e.target.value)}
              min={minStartDate} // Restrict previous dates
              required
              disabled={isProcessing} // Disable input during processing
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
              min={calculateMinEndDate()} // Ensure end date is after starting date
              required
              disabled={!startDate || isProcessing} // Disable input during processing and if no start date is selected
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isProcessing} // Disable button during processing
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing} // Disable button during processing
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isProcessing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isProcessing ? "Processing..." : "Save"}
          </button>
        </div>
      </form>
      {successMessage && (
        <div className={`text-white font-bold py-2 px-4 rounded mt-4 ${successMessage.includes("successfully") ? "bg-green-500" : "bg-red-500"}`}>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AddSessionForm;
