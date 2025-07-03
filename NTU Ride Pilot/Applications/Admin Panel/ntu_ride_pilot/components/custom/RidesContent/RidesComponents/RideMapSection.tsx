"use client";
import React, { useEffect } from "react";
import mapboxgl from "mapbox-gl"; 
// import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface RideMapSectionProps {
  currentLocation: { longitude: string; latitude: string } | null;
}

const RideMapSection: React.FC<RideMapSectionProps> = ({ currentLocation }) => {
  const mapContainer = React.useRef<HTMLDivElement | null>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const marker = React.useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      // style: "mapbox://styles/mapbox/streets-v11",
      center: [-74.006, 40.7128], // Default center (New York)
      zoom: 14, // Increased zoom level from 11 to 14
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  // Update marker position and map center when currentLocation changes
  useEffect(() => {
    if (!map.current || !currentLocation) return;

    const lng = parseFloat(currentLocation.longitude);
    const lat = parseFloat(currentLocation.latitude);

    if (isNaN(lng) || isNaN(lat)) return;

    const newLngLat = [lng, lat] as [number, number];

    if (!marker.current) {
      // Create marker if it doesn't exist
      marker.current = new mapboxgl.Marker({ color: "red" })
        .setLngLat(newLngLat)
        .addTo(map.current);
    } else {
      // Move existing marker to new position
      marker.current.setLngLat(newLngLat);
    }

    // Recenter the map to the new location smoothly with increased zoom
    map.current.easeTo({ center: newLngLat, zoom: 14 });
  }, [currentLocation]);

  return (
    <div
      ref={mapContainer}
      className="h-[260px] w-full rounded-lg overflow-hidden shadow-md bg-gray-100"
    />
  );
};

export default RideMapSection;
