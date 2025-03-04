import React from 'react';
import { FaCog, FaBell } from 'react-icons/fa';

const HeaderIcons: React.FC = () => {
  return (
    <div className="flex justify-end items-center space-x-4">
      <FaCog className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
      <FaBell className="text-blue-500 hover:text-gray-700 cursor-pointer" size={20} />
    </div>
  );
};

export default HeaderIcons;