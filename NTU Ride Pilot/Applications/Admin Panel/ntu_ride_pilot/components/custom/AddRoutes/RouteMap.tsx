"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const isWebGLSupported = () => {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
};

type BusStop = {
  sequenceid: number;
  busStopName: string;
  longitude: string;
  latitude: string;
};

type RouteMapProps = {
  busStops: BusStop[];
  addBusStop: (busStopName: string, longitude: number, latitude: number) => void;
  mapCenter?: { lat: number; lng: number } | null;
};

const RouteMap: React.FC<RouteMapProps> = ({ busStops, addBusStop, mapCenter }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [webGLError, setWebGLError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [viewport, setViewport] = useState({
    latitude: 31.4619,
    longitude: 73.1485,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newStopCoords, setNewStopCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [newStopName, setNewStopName] = useState("");

  // Markers reference for cleanup
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!mapContainer.current) return;
    if (map.current) return;

    if (!isWebGLSupported()) {
      setWebGLError("Your browser doesn't support WebGL, which is required for the map to work properly.");
      return;
    }
    try {
      if (!mapboxgl.accessToken) {
        throw new Error("Mapbox access token is not configured");
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        bearing: viewport.bearing,
        pitch: viewport.pitch,
        antialias: true,
        failIfMajorPerformanceCaveat: false,
      });

      map.current.on("load", () => {
        map.current?.addControl(new mapboxgl.NavigationControl(), "top-right");
      });

      map.current.on("move", () => {
        if (!map.current) return;
        const center = map.current.getCenter();
        setViewport({
          latitude: center.lat,
          longitude: center.lng,
          zoom: map.current.getZoom(),
          bearing: map.current.getBearing(),
          pitch: map.current.getPitch(),
        });
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e.error);
        setWebGLError(`Map error: ${e.error?.message || "Unknown error"}`);
      });

      // Add click event to map for adding bus stops
      map.current.on("click", (e) => {
        setNewStopCoords({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        });
        setNewStopName("");
        setShowModal(true);
      });
    } catch (error) {
      console.error("Map initialization error:", error);
      setWebGLError(
        error instanceof Error
          ? error.message
          : "Failed to initialize the map. Please check your console for details."
      );
    }
  }, [isMounted]);

  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    busStops.forEach((stop) => {
      const marker = new mapboxgl.Marker({ color: "#2563eb" }) // blue marker
        .setLngLat([parseFloat(stop.longitude), parseFloat(stop.latitude)])
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25,
      }).setHTML(
        `<div style="
          background-color: #2563eb; 
          color: white; 
          font-weight: 600; 
          padding: 4px 8px; 
          border-radius: 6px; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-size: 14px;
          white-space: nowrap;
        ">${stop.busStopName}</div>`
      );

      marker.getElement().addEventListener("mouseenter", () => {
        popup.addTo(map.current!);
        popup.setLngLat([parseFloat(stop.longitude), parseFloat(stop.latitude)]);
      });

      marker.getElement().addEventListener("mouseleave", () => {
        popup.remove();
      });

      markersRef.current.push(marker);
    });
  }, [busStops]);

  useEffect(() => {
    if (map.current && mapCenter) {
      map.current.flyTo({
        center: [mapCenter.lng, mapCenter.lat],
        zoom: 15,
        essential: true,
      });
    }
  }, [mapCenter]);

  const handleModalOk = () => {
    if (!newStopName.trim()) {
      alert("Please enter a bus stop name.");
      return;
    }
    if (newStopCoords) {
      addBusStop(newStopName.trim(), newStopCoords.lng, newStopCoords.lat);
      setShowModal(false);
      setNewStopCoords(null);
      setNewStopName("");
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setNewStopCoords(null);
    setNewStopName("");
  };

  if (!isMounted) {
    return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (webGLError) {
    return (
      <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 font-medium">{webGLError}</p>
          <p className="mt-2 text-sm text-gray-600">Try these solutions:</p>
          <ul className="text-xs text-gray-500 mt-1 list-disc list-inside">
            <li>Check your Mapbox token is valid</li>
            <li>Disable browser extensions that might block WebGL</li>
            <li>Update your graphics drivers</li>
            <li>Try Chrome or Firefox</li>
          </ul>
        </div>
      </div>
    );
  }
  return (
    <>
      <div
        ref={mapContainer}
        className="h-[400px] w-full rounded-lg overflow-hidden shadow-md bg-gray-100"
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Bus Stop</h2>
            <input
              type="text"
              placeholder="Enter bus stop name"
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newStopName}
              onChange={(e) => setNewStopName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={handleModalCancel}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleModalOk}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RouteMap;
