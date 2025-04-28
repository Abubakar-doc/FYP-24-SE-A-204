"use client";
import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaPlus, FaSearch } from "react-icons/fa";
import AddRouteHeader from "./AddRouteHeader";
import RouteMap from "./RouteMap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Stop = {
  name: string;
  latitude: number;
  longitude: number;
  sequence_no: number;
};

type AddRouteFormProps = {
  onBack: () => void;
};

const AddRouteForm: React.FC<AddRouteFormProps> = ({ onBack }) => {
  const [routeName, setRouteName] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);
  const [stopName, setStopName] = useState("");
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    place_name?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleAddStop = () => {
    if (stopName && location) {
      const newStop: Stop = {
        name: stopName,
        latitude: location.lat,
        longitude: location.lng,
        sequence_no: stops.length + 1,
      };
      setStops([...stops, newStop]);
      setStopName("");
      setLocation(null);
      setLocationQuery("");
    }
  };

  const handleSaveRoute = () => {
    if (!routeName) {
      toast.warning("Please enter a route name");
      return;
    }

    if (stops.length < 2) {
      if (stops.length === 0) {
        toast.warning("Please add at least two bus stops to create a new route!");
      } else {
        toast.warning("Please add one more bus stop to create a new route!");
      }
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`${routeName} added successfully!`);
      setRouteName("");
      setStops([]);
    }, 1500);
  };

  const handleLocationSearch = async (query: string) => {
    setLocationQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      // Faisalabad bounding box coordinates
      const bbox = "72.90,31.30,73.30,31.60"; // Tight bounds around Faisalabad
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}` +
        `&bbox=${bbox}` +
        `&country=PK` +
        `&types=address,poi` + // Focus on addresses and points of interest
        `&proximity=73.0833,31.4167` + // Center of Faisalabad
        `&limit=10` // Limit to 10 most relevant results
      );
      
      const data = await response.json();
      
      // Additional client-side filtering for Faisalabad
      const faisalabadResults = data.features.filter((feature: any) => {
        // Check if the result is explicitly in Faisalabad
        const context = feature.context || [];
        return context.some((ctx: any) => 
          ctx.id.includes('place') && 
          (ctx.text.toLowerCase().includes('faisalabad') || 
           ctx.text.toLowerCase().includes('fsd'))
        );
      });

      setSearchResults(faisalabadResults.length > 0 ? faisalabadResults : data.features);
    } catch (error) {
      console.error("Error fetching location data:", error);
      setSearchResults([]);
    }
  };

  const handleLocationSelect = (result: any) => {
    const [lng, lat] = result.geometry.coordinates;
    const place_name = result.place_name || result.text;
    setLocation({ lat, lng, place_name });
    setLocationQuery(place_name);
    setShowSearchResults(false);
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
            />
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline"
              onClick={onBack}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-12 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              onClick={handleSaveRoute}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
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
                <span className="text-gray-500 text-sm">Total: {stops.length}</span>
              </div>

              {/* Stop Name Label + Add (+) Icon */}
              <div className="flex items-center justify-between mb-2 ml-3">
                <label className="block text-sm font-semibold text-[#202020]" htmlFor="stopName">
                  Stop Name *
                </label>
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-blue-50"
                  onClick={handleAddStop}
                  disabled={!stopName || !location}
                  title="Add Stop"
                >
                  <FaPlus
                    className={`text-blue-600 ${
                      !stopName || !location ? "opacity-50" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Stop Name Input */}
              <input
                id="stopName"
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 mb-4 ml-3"
                value={stopName}
                onChange={(e) => setStopName(e.target.value)}
                placeholder="Enter stop name"
              />

              {/* Location Input with Search */}
              <div className="relative mb-2 ml-3">
                <div className="relative">
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 pr-10"
                    value={locationQuery}
                    onChange={(e) => {
                      handleLocationSearch(e.target.value);
                      setShowSearchResults(true);
                    }}
                    placeholder="Search for a location in Faisalabad, Pakistan"
                  />
                  <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleLocationSelect(result)}
                      >
                        <div className="text-sm font-medium">{result.place_name || result.text}</div>
                        <div className="text-xs text-gray-500">
                          {result.properties.address || ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: 70% width */}
            <div style={{ width: "70%" }}>
              <RouteMap 
                stops={stops}
                onLocationSelect={(lat, lng, place_name) => {
                  setLocation({ lat, lng, place_name });
                  setLocationQuery(place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRouteForm;