"use client";
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface RideData {
  ride_id: string;
  route_id: string;
  name: string; // route name
  busName: string; // bus name (bus_id)
}

interface RidesHeaderRowProps {
  routeOptions: RideData[];
}

const RidesHeaderRow: React.FC<RidesHeaderRowProps> = ({ routeOptions }) => {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRideId = searchParams.get('ride_id') || "";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rideId = e.target.value;
    const params = new URLSearchParams(window.location.search);

    if (rideId) {
      params.set('ride_id', rideId);
    } else {
      params.delete('ride_id');
    }

    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between mb-4 mr-4">
      <h2 className="text-2xl font-semibold">Rides</h2>
      <div className="relative w-[700px]">
        <select
          className="w-full bg-blue-500 text-white px-6 py-2 rounded-md focus:outline-none focus:ring focus:border-blue-300 appearance-none"
          value={selectedRideId}
          onChange={handleChange}
        >
          <option value="">
            {routeOptions.length === 0 ? "No active rides at the moment" : "Please Select a Ride!"}
          </option>
          {routeOptions.length > 0 &&
            routeOptions.map(option => (
              <option 
                key={option.ride_id} 
                value={option.ride_id}
              >
                {option.busName} - {option.name}
              </option>
            ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white font-bold text-2xl">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default RidesHeaderRow;