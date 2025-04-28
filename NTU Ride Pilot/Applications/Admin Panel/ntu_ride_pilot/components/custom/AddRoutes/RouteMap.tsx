"use client";

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set Mapbox token (workaround for Next.js 14+)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const isWebGLSupported = () => {
  if (typeof window === "undefined") return false; // SSR check
  
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

const RouteMap: React.FC = () => {
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
      // Double check token availability
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
        failIfMajorPerformanceCaveat: false, // Changed to false for better compatibility
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

    } catch (error) {
      console.error("Map initialization error:", error);
      setWebGLError(
        error instanceof Error 
          ? error.message 
          : "Failed to initialize the map. Please check your console for details."
      );
    }
  }, [isMounted, viewport.latitude, viewport.longitude]);

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
          <p className="mt-2 text-sm text-gray-600">
            Try these solutions:
          </p>
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
    <div
      ref={mapContainer}
      className="h-[400px] w-full rounded-lg overflow-hidden shadow-md bg-gray-100"
    />
  );
};

export default RouteMap;