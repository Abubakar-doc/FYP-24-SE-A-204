"use client";
import React from "react";

type RideDetails = {
  driver: string;
  contact: string;
  rideStatus: string;
  startedAt: string;
  nextStop: string;
  etaNextStop: string;
  busCapacity: string;
  studentOnboard: string;
};

type RideDetailsSectionProps = {
  rideDetails: RideDetails;
};

const inputClass =
  "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3";

const RideDetailsSection: React.FC<RideDetailsSectionProps> = ({ rideDetails }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">Driver</label>
        <input className={inputClass} value={rideDetails.driver} readOnly />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">Contact</label>
        <input className={inputClass} value={rideDetails.contact} readOnly />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">Ride Status</label>
        <input className={inputClass} value={rideDetails.rideStatus} readOnly />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">Started At</label>
        <input className={inputClass} value={rideDetails.startedAt} readOnly />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">Next Stop</label>
        <input className={inputClass} value={rideDetails.nextStop} readOnly />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">ETA Next Stop</label>
        <input className={inputClass} value={rideDetails.etaNextStop} readOnly />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">Bus Capacity</label>
        <input className={inputClass} value={rideDetails.busCapacity} readOnly />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#202020] mb-1">Student Onboard</label>
        <input className={inputClass} value={rideDetails.studentOnboard} readOnly />
      </div>
    </div>
  );
};

export default RideDetailsSection;