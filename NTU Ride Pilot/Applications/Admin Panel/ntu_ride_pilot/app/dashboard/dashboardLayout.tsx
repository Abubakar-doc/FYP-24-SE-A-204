"use client"
import Sidebar from '@/components/custom/sidebar/Sidebar';
import DashboardContent from '@/components/custom/DashboardContent/DashboardContent';
import SessionsContent from '@/components/custom/SessionsContent/SessionsContent';
import DriversContent from '@/components/custom/Drivers/Drivers';
import RoutesContent from '@/components/custom/route/Route';
import BusStopsContent from '@/components/custom/busStop/BusStop';
import BusesContent from '@/components/custom/Buses/Buses';
import AnnouncementsContent from '@/components/custom/Announcements/Announcements';
import ComplaintsContent from '@/components/custom/Complaints/Complaints';
import RidesContent from '@/components/custom/Rides/Rides';
import ReportsContent from '@/components/custom/Reports/Reports';
import StudentsContent from '@/components/custom/Students/Students';
import { useState } from 'react';
import Image from 'next/image';

export default function DashboardLayout({
  children,
  user,
  handleSignOut,
}: Readonly<{
  children: React.ReactNode;
  user: any;
  handleSignOut: () => void;
}>) {
  const [selectedItem, setSelectedItem] = useState<string>('dashboard');

  const handleItemSelected = (itemValue: string) => {
    setSelectedItem(itemValue);
  };

  const renderContent = () => {
    switch (selectedItem) {
      case 'dashboard':
        return <DashboardContent />;
      case 'sessions':
        return <SessionsContent />;
      case 'students':
        return <StudentsContent />;
      case 'drivers':
        return <DriversContent />;
      case 'routes':
        return <RoutesContent />;
      case 'busStops':
        return <BusStopsContent />;
      case 'buses':
        return <BusesContent />;
      case 'announcements':
        return <AnnouncementsContent />;
      case 'complaints':
        return <ComplaintsContent />;
      case 'rides':
        return <RidesContent />;
      case 'reports':
        return <ReportsContent />;
      default:
        return <DashboardContent />; // Or an error/default component
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-500">
        <div className='bg-white p-2 flex justify-between items-center'> {/* Header Section */}
          <div>
            <Image src="/images/National_Textile_University_Logo.png" alt="NTU Logo" className='ml-5 cursor-pointer' width={40} height={40} />
          </div>
          {user && <p>Welcome, {user.email}!</p>}
          <button className='p-5 py-2 rounded-md bg-blue-500 hover:bg-blue-800' onClick={handleSignOut}>Sign Out</button>
           
        </div>
      <div className='flex'>
        <Sidebar onItemSelected={handleItemSelected} />
        <main className="flex-1 p-4">
          {renderContent()}
          {children} {/* Render additional protected pages here */}
        </main>
      </div>
    </div>
  );
}
