"use client";

import React, { useState } from "react";
import { FaMapMarkerAlt, FaTrashAlt } from "react-icons/fa";
import AddRouteHeader from "./AddRouteHeader";
import RouteMap from "./RouteMap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Autocomplete from "react-google-autocomplete";

import { collection, addDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase"; // Adjust the import path as per your project structure

const GOOGLE_MAPS_API_KEY = "AIzaSyCkvJ9WL_R6MaI8QC25BEz8BZDzb-1xYxg";

type BusStop = {
  sequenceid: number;
  busStopName: string;
  longitude: string;
  latitude: string;
};

type AddRouteFormProps = {
  onBack: () => void;
};

declare global {
  interface Window {
    google: typeof google;
  }
}

const AddRouteForm: React.FC<AddRouteFormProps> = ({ onBack }) => {
  const [busStops, setBusStops] = useState<BusStop[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [routeName, setRouteName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addBusStop = (busStopName: string, longitude: number, latitude: number) => {
    setBusStops((prevStops) => [
      ...prevStops,
      {
        sequenceid: prevStops.length + 1,
        busStopName,
        longitude: longitude.toString(),
        latitude: latitude.toString(),
      },
    ]);
    toast.success(`Bus stop "${busStopName}" added!`);
  };

  // Delete bus stop by sequenceid and reorder sequence numbers
  const deleteBusStop = (sequenceid: number) => {
    setBusStops((prevStops) => {
      const filtered = prevStops.filter((stop) => stop.sequenceid !== sequenceid);
      // Reassign sequenceid starting from 1
      return filtered.map((stop, index) => ({
        ...stop,
        sequenceid: index + 1,
      }));
    });
  };

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) {
      alert("Selected place has no location data");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name || "";

    setSearchQuery(address);
    setMapCenter({ lat, lng });
  };

  const handleSaveRoute = async () => {
    if (routeName.trim() === "") {
      toast.warning("Please enter a Route Name.");
      return;
    }

    if (busStops.length < 2) {
      toast.warning("Please add atleast two Bus Stops in order to create a new Route!");
      return;
    }

    setIsSaving(true);

    try {
      const routesCollection = collection(firestore, "routes");

      // Check if route name already exists (case insensitive)
      const q = query(routesCollection);
      const snapshot = await getDocs(q);

      const existingRoute = snapshot.docs.find(
        (doc) => doc.data().name?.toLowerCase() === routeName.trim().toLowerCase()
      );

      if (existingRoute) {
        toast.warning(`${routeName.trim()} already exists!`);
        setIsSaving(false);
        return;
      }

      const busStopsForFirestore = busStops.map((stop) => ({
        busStopName: stop.busStopName,
        longitude: parseFloat(stop.longitude),
        latitude: parseFloat(stop.latitude),
      }));

      await addDoc(routesCollection, {
        name: routeName.trim(),
        created_at: serverTimestamp(),
        busStops: busStopsForFirestore,
      });

      toast.success(`Route "${routeName.trim()}" saved successfully!`);

      setRouteName("");
      setBusStops([]);
      setSearchQuery("");
      setMapCenter(null);
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white relative">
      <div className="rounded-lg mb-2">
        <AddRouteHeader onBackToRoutes={onBack} />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4 overflow-y-auto h-[calc(100vh-200px)]">
        <div className="rounded-lg border border-gray-300 overflow-hidden">
          {/* Top Label Row */}
          <div className="mb-1 ml-4 pt-2">
            <label
              htmlFor="routeName"
              className="block text-sm font-semibold text-[#202020]"
            >
              Route Name *
            </label>
          </div>

          {/* Input and Buttons Row */}
          <div className="flex items-center gap-5 mb-12">
            <input
              id="routeName"
              type="text"
              className="ml-3 block w-[68%] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              disabled={isSaving}
            />
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline"
              onClick={onBack}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-12 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              onClick={handleSaveRoute}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="flex gap-6">
            {/* Section 1: 30% width */}
            <div className="min-w-[250px]" style={{ width: "30%" }}>
              {/* Add Stop Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 ml-3">
                  <FaMapMarkerAlt className="text-blue-600" />
                  <span className="text-blue-600 font-semibold cursor-pointer">
                    Add Stop
                  </span>
                </div>
                <span className="text-gray-500 text-sm">Total: {busStops.length}</span>
              </div>

              {/* Location Input with Google Places Autocomplete */}
              <div className="mb-2 ml-3">
                <Autocomplete
                  apiKey={GOOGLE_MAPS_API_KEY}
                  onPlaceSelected={handlePlaceSelected}
                  options={{
                    types: ["geocode"],
                    componentRestrictions: { country: "pk" },
                    fields: ["formatted_address", "geometry", "name"],
                  }}
                  placeholder="Search for a location in Punjab, Pakistan"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  disabled={isSaving}
                />
              </div>

              {/* Bus Stops list */}
              <div className="max-h-[300px] overflow-y-auto">
                {busStops.map((stop) => (
                  <div
                    key={stop.sequenceid}
                    className="flex items-center justify-between border-t border-gray-300 py-2 px-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-600">
                        Stop {stop.sequenceid}
                      </span>
                      <span className="text-sm text-gray-800">{stop.busStopName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteBusStop(stop.sequenceid)}
                      disabled={isSaving}
                      aria-label={`Delete bus stop ${stop.busStopName}`}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: 70% width */}
            <div style={{ width: "70%" }}>
              <RouteMap
                busStops={busStops}
                addBusStop={addBusStop}
                mapCenter={mapCenter}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRouteForm;
