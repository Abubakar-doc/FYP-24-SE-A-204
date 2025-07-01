import { FaHome, FaUsers, FaTruck, FaRoute, FaBus, FaBullhorn, FaExclamationTriangle, FaCar, FaFileAlt, FaUser, FaGraduationCap, FaChevronRight } from 'react-icons/fa';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface SidebarProps {
  activeItem: string;
  className?: string;
  onItemClick: (href: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, className, onItemClick }) => {
  const sidebarGroups = [
    {
      heading: null,
      items: [
        { label: 'Dashboard', icon: <FaHome />, href: '/dashboard' },
      ],
    },
    {
      heading: 'Users',
      items: [
        { label: 'Sessions', icon: <FaUsers />, href: '/dashboard/sessions' },
        { label: 'Students', icon: <FaGraduationCap />, href: '/dashboard/students' },
        { label: 'Drivers', icon: <FaTruck />, href: '/dashboard/drivers' },
      ],
    },
    {
      heading: 'System Setup',
      items: [
        { label: 'Routes', icon: <FaRoute />, href: '/dashboard/routes' },
        { label: 'Buses', icon: <FaBus />, href: '/dashboard/buses' },
        { label: 'Announcements', icon: <FaBullhorn />, href: '/dashboard/announcements' },
        { label: 'Complaints', icon: <FaExclamationTriangle />, href: '/dashboard/complaints' },
      ],
    },
    {
      heading: 'Live',
      items: [
        { label: 'Rides', icon: <FaCar />, href: '/dashboard/rides' },
      ],
    },
    {
      heading: 'Reports',
      items: [
        { label: 'General Reports', icon: <FaFileAlt />, href: '/dashboard/reports' },
      ],
    },
  ];

  return (
    <div className={`${className} flex flex-col h-screen justify-between bg-[#023955] text-white rounded-r-sm`}>
      <div className="p-2  pl-6">
        <h1 className="text-lg font-bold">NTU RIDE PILOT</h1>
      </div>
      <ul className="flex-1 px-1 py-4 mt-2 space-y-2">
        {sidebarGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {group.heading && (
              <li className="flex items-center px-2 py-0.5">
                <div className="h-px w-5 bg-gray-400 mr-2"></div>
                <span className="text-xs uppercase tracking-wider text-gray-300 whitespace-nowrap">{group.heading}</span>
                <div className="h-px w-full bg-gray-400 ml-2"></div>
              </li>
            )}
            {group.items.map((item) => (
              <li
                key={item.label}
                className={`flex items-center space-x-3  p-2 mb-1 rounded-md cursor-pointer hover:bg-[#0686CB] hover:text-white ${activeItem === item.href ? 'bg-[#0686CB] text-white' : ''}`}
              >
                <button
                  type="button"
                  className="flex items-center space-x-3  w-full h-4 flex-nowrap"
                  onClick={() => onItemClick(item.href)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </div>
        ))}
      </ul>
      <div className="p-1">
        <div className="flex items-center justify-between bg-[#054C72] rounded-md p-1 cursor-pointer">
          <div className="flex items-center space-x-2">
            <span className=' bg-[#0686CB] p-3 rounded-full'><FaUser /></span>
            <div>
              <span className="block">Shakeel Anwar</span>
              <span className="text-sm text-gray-200">Admin</span>
            </div>
          </div>
          <FaChevronRight />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;