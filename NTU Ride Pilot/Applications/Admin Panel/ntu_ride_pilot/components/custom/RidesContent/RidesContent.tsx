"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import RideMapSection from "./RidesComponents/RideMapSection";
import RideDetailsSection from "./RidesComponents/RideDetailsSection";
import PassengersTableSection from "./RidesComponents/PassengersTableSection";
import RidesHeader from "./RidesHeader";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

const NTU_DEFAULT_LOCATION = {
  latitude: "31.418715",
  longitude: "73.079109",
};

type Driver = {
  id: string;
  name: string;
  contactNo: string;
};

type Bus = {
  busId: string;
  seatCapacity: number;
};

type Student = {
  roll_no: string;
  name: string;
};

const RidesContent: React.FC = () => {
  const searchParams = useSearchParams();
  const rideIdFromQuery = searchParams.get("ride_id");

  const [rideId, setRideId] = useState<string | null>(null);

  // Ride document states
  const [busId, setBusId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [startedAtFormatted, setStartedAtFormatted] = useState<string>("N/A");
  const [currentLocation, setCurrentLocation] = useState<{
    longitude: string;
    latitude: string;
  } | null>(NTU_DEFAULT_LOCATION);
  const [driverId, setDriverId] = useState<string>("");
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [etaNextStop, setEtaNextStop] = useState<number | null>(null);
  const [nextStopName, setNextStopName] = useState<string>("");
  const [nextStopETAFormatted, setNextStopETAFormatted] = useState<string>("N/A");
  const [offlineOnBoard, setOfflineOnBoard] = useState<string[]>([]);
  const [onlineOnBoard, setOnlineOnBoard] = useState<string[]>([]);
  const [rideStatus, setRideStatus] = useState<string>("");
  const [routeId, setRouteId] = useState<string>("");

  // Driver details state
  const [driver, setDriver] = useState<Driver | null>(null);

  // Bus details state
  const [bus, setBus] = useState<Bus | null>(null);

  // Students list state (all students)
  const [students, setStudents] = useState<Student[]>([]);

  // Combined unique passengers onboard
  const [passengersOnBoard, setPassengersOnBoard] = useState<Student[]>([]);

  // Loading state for ride & related data fetching
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Helper function to format Date to "h:mm AM/PM"
  const formatTime12Hour = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // Helper to calculate Next Stop ETA formatted time string
  const calculateNextStopETA = (etaMinutes: number | null): string => {
    if (etaMinutes === null) return "N/A";
    const now = new Date();
    now.setMinutes(now.getMinutes() + etaMinutes);
    return formatTime12Hour(now);
  };

  // Update local rideId state only when query param changes and is different
  useEffect(() => {
    if (rideIdFromQuery && rideIdFromQuery !== rideId) {
      setRideId(rideIdFromQuery);
    } else if (!rideIdFromQuery) {
      clearAllRideData();
      setRideId(null);
    }
  }, [rideIdFromQuery, rideId]);

  // Real-time listener for the selected ride document
  useEffect(() => {
    if (!rideId) {
      clearAllRideData();
      return;
    }

    setIsLoading(true);

    const rideDocRef = doc(firestore, "rides", rideId);
    const unsubscribe = onSnapshot(
      rideDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // If ride ended, clear all data
          if (data.ride_status === "completed") {
            clearAllRideData();
            setIsLoading(false);
            return;
          }

          setBusId(data.bus_id || "");
          if (data.created_at) {
            const createdAtDate = data.created_at.toDate();
            setCreatedAt(createdAtDate);
            setStartedAtFormatted(formatTime12Hour(createdAtDate));
          } else {
            setCreatedAt(null);
            setStartedAtFormatted("N/A");
          }
          setCurrentLocation(
            data.currentLocation &&
              data.currentLocation.longitude &&
              data.currentLocation.latitude
              ? {
                  longitude: data.currentLocation.longitude,
                  latitude: data.currentLocation.latitude,
                }
              : NTU_DEFAULT_LOCATION
          );
          setDriverId(data.driver_id || "");
          setEndedAt(data.ended_at ? data.ended_at.toDate() : null);
          setEtaNextStop(
            typeof data.eta_next_stop === "number" ? data.eta_next_stop : null
          );
          setNextStopName(data.nextStopName || "");
          setOfflineOnBoard(
            Array.isArray(data.offlineOnBoard) ? data.offlineOnBoard : []
          );
          setOnlineOnBoard(
            Array.isArray(data.onlineOnBoard) ? data.onlineOnBoard : []
          );
          setRideStatus(data.ride_status || "");
          setRouteId(data.route_id || "");
          setIsLoading(false);
        } else {
          clearAllRideData();
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to ride document:", error);
        clearAllRideData();
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [rideId]);

  // Clear all ride-related data and reset to defaults
  const clearAllRideData = () => {
    setBusId("");
    setCreatedAt(null);
    setStartedAtFormatted("N/A");
    setCurrentLocation(NTU_DEFAULT_LOCATION);
    setDriverId("");
    setEndedAt(null);
    setEtaNextStop(null);
    setNextStopName("");
    setNextStopETAFormatted("N/A");
    setOfflineOnBoard([]);
    setOnlineOnBoard([]);
    setRideStatus("");
    setRouteId("");
    setDriver(null);
    setBus(null);
    setStudents([]);
    setPassengersOnBoard([]);
  };

  // Update formatted Next Stop ETA whenever etaNextStop changes
  useEffect(() => {
    setNextStopETAFormatted(calculateNextStopETA(etaNextStop));
  }, [etaNextStop]);

  // Fetch driver, bus, and students simultaneously when driverId or busId changes
  useEffect(() => {
    if (!driverId && !busId) return;

    const fetchDriver = async () => {
      if (!driverId) {
        setDriver(null);
        return;
      }
      try {
        const driverDocRef = doc(
          firestore,
          "users",
          "user_roles",
          "drivers",
          driverId
        );
        const driverDocSnap = await getDoc(driverDocRef);
        if (driverDocSnap.exists()) {
          const data = driverDocSnap.data();
          setDriver({
            id: driverDocSnap.id,
            name: data.name || "",
            contactNo: data.contactNo || "",
          });
        } else {
          setDriver(null);
        }
      } catch (error) {
        setDriver(null);
      }
    };
    const fetchBus = async () => {
      if (!busId) {
        setBus(null);
        return;
      }
      try {
        const busDocRef = doc(firestore, "buses", busId);
        const busDocSnap = await getDoc(busDocRef);
        if (busDocSnap.exists()) {
          const data = busDocSnap.data();
          setBus({
            busId: busDocSnap.id,
            seatCapacity: data.seatCapacity || 0,
          });
        } else {
          setBus(null);
        }
      } catch (error) {
        setBus(null);
      }
    };
    const fetchStudents = async () => {
      try {
        const studentsCollection = collection(
          firestore,
          "users",
          "user_roles",
          "students"
        );
        const studentsSnapshot = await getDocs(studentsCollection);
        const studentsList = studentsSnapshot.docs.map(
          (doc) => doc.data() as Student
        );
        setStudents(studentsList);
      } catch (error) {
        setStudents([]);
      }
    };

    fetchDriver();
    fetchBus();
    fetchStudents();
  }, [driverId, busId]);

  // Combine offlineOnBoard and onlineOnBoard into unique passengersOnBoard
  useEffect(() => {
    if (!students.length) {
      setPassengersOnBoard([]);
      return;
    }
    const combinedRollNos = Array.from(
      new Set([...offlineOnBoard, ...onlineOnBoard])
    );
    const uniquePassengers = combinedRollNos
      .map((rollNo) => students.find((s) => s.roll_no === rollNo))
      .filter((s): s is Student => s !== undefined);
    setPassengersOnBoard(uniquePassengers);
  }, [offlineOnBoard, onlineOnBoard, students]);

  // Prepare rideDetails object to pass to RideDetailsSection
  const rideDetails = {
    driver: driver?.name || "",
    contact: driver?.contactNo || "",
    rideStatus,
    startedAt: startedAtFormatted,
    nextStop: nextStopName,
    etaNextStop: nextStopETAFormatted,
    busCapacity: bus ? `${bus.seatCapacity} Seats` : "",
    studentOnboard: passengersOnBoard.length.toString(),
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="flex h-screen bg-white w-full">
      <div className="flex flex-col flex-1 h-screen">
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <RidesHeader />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="bg-white rounded-lg p-4">
            <div className="mb-4">
              <RideMapSection currentLocation={currentLocation} />
            </div>
            <RideDetailsSection rideDetails={rideDetails} />
            <PassengersTableSection passengers={passengersOnBoard} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RidesContent;