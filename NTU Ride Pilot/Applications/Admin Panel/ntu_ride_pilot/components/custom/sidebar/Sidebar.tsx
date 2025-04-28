import { FaHome, FaUsers, FaTruck, FaRoute, FaBus, FaBullhorn, FaExclamationTriangle, FaCar, FaFileAlt, FaCog, FaUser, FaMapMarkerAlt, FaGraduationCap } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  activeItem: string;
  className?: string; // Add className prop
  // Add a callback for handling clicks
  onItemClick: (href: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, className, onItemClick }) => {
  const sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: <FaHome />, href: '/dashboard' },
    { label: 'Sessions', icon: <FaUsers />, href: '/dashboard/sessions' },
    { label: 'Students', icon: <FaGraduationCap />, href: '/dashboard/students' },
    { label: 'Drivers', icon: <FaTruck />, href: '/dashboard/drivers' },
    { label: 'Routes', icon: <FaRoute />, href: '/dashboard/routes' },
    { label: 'Buses', icon: <FaBus />, href: '/dashboard/buses' },
    { label: 'Announcements', icon: <FaBullhorn />, href: '/dashboard/announcements' },
    { label: 'Complaints', icon: <FaExclamationTriangle />, href: '/dashboard/complaints' },
    { label: 'Rides', icon: <FaCar />, href: '/dashboard/rides' },
    { label: 'General Reports', icon: <FaFileAlt />, href: '/dashboard/reports' },
  ];

  return (
    <div className={`${className} flex flex-col h-screen justify-between bg-[#023955] text-white`}>
      <div className="p-3">
        <h1 className="text-lg font-bold">NTU RIDE PILOT</h1>
      </div>
      <ul className="flex-1 px-1 py-2 space-y-2">
        {sidebarItems.map((item) => (
          <li
            key={item.label}
            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-[#0686CB] hover:text-white ${activeItem === item.href ? 'bg-[#0686CB] text-white' : ''}`}
          >
            <button
              type="button"
              className="flex items-center space-x-3 w-full flex-nowrap"
              onClick={() => onItemClick(item.href)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Updated Admin Profile Section */}
      <div className="p-2">
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