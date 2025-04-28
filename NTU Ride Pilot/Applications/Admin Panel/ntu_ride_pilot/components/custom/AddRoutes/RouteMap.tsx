"use client";

import { useState, useRef, useEffect } from "react";
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FaMapMarkerAlt } from "react-icons/fa";

type Stop = {
  name: string;
  latitude: number;
  longitude: number;
  sequence_no: number;
};

type RouteMapProps = {
  stops: Stop[];
  onLocationSelect: (lat: number, lng: number, place_name?: string) => void;
};

type GeoJSONFeature = {
  type: "Feature";
  properties: {};
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
};

const RouteMap: React.FC<RouteMapProps> = ({ stops, onLocationSelect }) => {
  const [viewport, setViewport] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    zoom: 2,
    bearing: 0,
    pitch: 0,
  });
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (stops.length > 0) {
      const lastStop = stops[stops.length - 1];
      setViewport(prev => ({
        ...prev,
        latitude: lastStop.latitude,
        longitude: lastStop.longitude,
        zoom: 12
      }));
    }
  }, [stops]);

  const getRouteGeoJSON = (): GeoJSONFeature | null => {
    if (stops.length < 2) return null;

    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: stops.map(stop => [stop.longitude, stop.latitude]),
      },
    };
  };

  const routeGeoJSON = getRouteGeoJSON();

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-md relative">
      <Map
        {...viewport}
        ref={mapRef}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="https://demotiles.maplibre.org/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Markers for stops */}
        {stops.map((stop) => (
          <Marker
            key={stop.sequence_no}
            longitude={stop.longitude}
            latitude={stop.latitude}
            anchor="bottom"
          >
            <div className="bg-blue-500 text-white rounded-full p-2 flex items-center justify-center w-8 h-8">
              {stop.sequence_no}
            </div>
            <div className="bg-white text-black px-2 py-1 rounded text-xs mt-1 whitespace-nowrap">
              {stop.name}
            </div>
          </Marker>
        ))}

        {/* Route path */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-width": 3,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
};

export default RouteMap;