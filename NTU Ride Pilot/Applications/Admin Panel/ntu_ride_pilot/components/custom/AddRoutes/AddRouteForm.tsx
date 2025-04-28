"use client";
import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaPlus, FaSearch } from "react-icons/fa";
import AddRouteHeader from "./AddRouteHeader";
import RouteMap from "./RouteMap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



type AddRouteFormProps = {
  onBack: () => void;
};

const AddRouteForm: React.FC<AddRouteFormProps> = ({ onBack }) => {
  
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
              
              
            />
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline"
              onClick={onBack}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-12 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              
              
            >
              Save
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
                <span className="text-gray-500 text-sm">Total: {0}</span>
              </div>

              {/* Stop Name Label + Add (+) Icon */}
              <div className="flex items-center justify-between mb-2 ml-3">
                <label className="block text-sm font-semibold text-[#202020]" htmlFor="stopName">
                  Stop Name *
                </label>
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-blue-50"
                  
                  
                  title="Add Stop"
                >
                  <FaPlus
                   className="text-blue-600"
                  />
                </button>
              </div>

              {/* Stop Name Input */}
              <input
                id="stopName"
                type="text"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 mb-4 ml-3"
               
                placeholder="Enter stop name"
              />

              {/* Location Input with Search */}
              <div className="relative mb-2 ml-3">
                <div className="relative">
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 pr-10"
                    
                    onChange={(e) => {
                      
                    }}
                    placeholder="Search for a location in Punjab, Pakistan"
                  />
                  <FaSearch className="absolute right-3 top-3.5 text-gray-400" />
                </div>
                
              
              </div>
            </div>

            {/* Section 2: 70% width */}
            <div style={{ width: "70%" }}>
              <RouteMap 
                
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRouteForm;
