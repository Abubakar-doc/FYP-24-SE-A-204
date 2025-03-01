"use client";
import React, { useState } from 'react';
import { FaHome, FaUsers, FaTruck, FaRoute, FaBus, FaBullhorn, FaExclamationTriangle, FaCar, FaFileAlt, FaCog, FaUser, FaMapMarkerAlt, FaGraduationCap } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa'; // Import ChevronRight for the arrow

interface SidebarItem {
    label: string;
    icon: React.ReactNode;
    value: string;
}

const Sidebar: React.FC<{ onItemSelected: (itemValue: string) => void }> = ({ onItemSelected }) => {
    const [activeItem, setActiveItem] = useState<string>('dashboard');

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
        <div className="flex flex-col min-h-screen w-64 bg-[#023955] text-white">
            <div className="p-4">
                <h1 className="text-lg font-bold">NTU RIDE PILOT</h1>
            </div>
            <ul className="flex-1 px-4 py-2 space-y-2">
                {sidebarItems.map((item) => (
                    <li
                        key={item.label}
                        className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-[#0686CB] hover:text-white ${activeItem === item.value ? 'bg-[#0686CB] text-white' : 'text-white'}`}
                        onClick={() => handleItemClick(item.value)}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>
            {/* Updated Admin Profile Section */}
            <div className="p-4">
                <div className="flex items-center justify-between bg-[#054C72] rounded-md p-1 cursor-pointer">
                    <div className="flex items-center space-x-2">
                        <span className=' bg-[#0686CB] p-3 rounded-full'><FaUser /></span>
                        <div>
                            <span className="block">Shakeel Anwar</span>
                            <span className="text-sm text-gray-200">Admin</span>
                        </div>
                    </div>
                    <FaChevronRight /> {/* Arrow icon */}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;