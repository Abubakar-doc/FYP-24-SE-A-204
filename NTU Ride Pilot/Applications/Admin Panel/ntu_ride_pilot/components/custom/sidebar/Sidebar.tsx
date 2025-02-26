"use client"
import React, { useState } from 'react';
import { FaHome, FaUsers, FaTruck, FaRoute, FaBus, FaBullhorn, FaExclamationTriangle, FaCar, FaFileAlt, FaCog, FaUser, FaMapMarkerAlt, FaGraduationCap } from 'react-icons/fa'; // Import more icons as needed

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  value: string; // Unique value to identify the content
}

const Sidebar: React.FC<{ onItemSelected: (itemValue: string) => void }> = ({ onItemSelected }) => {
  const [activeItem, setActiveItem] = useState<string>('dashboard'); // Default active item

  const sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: <FaHome />, value: 'dashboard' },
    { label: 'Sessions', icon: <FaUsers />, value: 'sessions' },
    { label: 'Students', icon: <FaGraduationCap />, value: 'students' },
    { label: 'Drivers', icon: <FaTruck />, value: 'drivers' },
    { label: 'Routes', icon: <FaRoute />, value: 'routes' },
    { label: 'Bus Stops', icon: <FaMapMarkerAlt />, value: 'busStops' },
    { label: 'Buses', icon: <FaBus />, value: 'buses' },
    { label: 'Announcements', icon: <FaBullhorn />, value: 'announcements' },
    { label: 'Complaints', icon: <FaExclamationTriangle />, value: 'complaints' },
    { label: 'Rides', icon: <FaCar />, value: 'rides' },
    { label: 'General Reports', icon: <FaFileAlt />, value: 'reports' },
  ];

  const handleItemClick = (itemValue: string) => {
    setActiveItem(itemValue);
    onItemSelected(itemValue);
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-ntu-dark text-white">
      <div className="p-4">
        <h1 className="text-lg font-bold">NTU RIDE PILOT</h1>
      </div>
      <ul className="flex-1 px-4 py-2 space-y-2">
        {sidebarItems.map((item) => (
          <li
            key={item.label}
            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-ntu-primary hover:text-white ${
              activeItem === item.value ? 'bg-ntu-primary text-white' : ''
            }`}
            onClick={() => handleItemClick(item.value)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 p-2 rounded-md">
          <span><FaUser /></span>
          <span>Ali Murtaza</span>
        </div>
        <p className="text-sm text-gray-400">Admin</p>
      </div>
    </div>
  );
};

export default Sidebar;
