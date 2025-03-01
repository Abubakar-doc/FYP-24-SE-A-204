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
import AddSessionForm from '@/components/custom/AddSessions/AddSessions';
import AddStudentForm from '@/components/custom/Students/AddStudentForm'; // Import the AddStudentForm

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
  const [showAddSessionForm, setShowAddSessionForm] = useState<boolean>(false); // New state
  const [showAddStudentForm, setShowAddStudentForm] = useState<boolean>(false); // New state for students

  const handleItemSelected = (itemValue: string) => {
    setSelectedItem(itemValue);
    setShowAddSessionForm(false); // Reset form state when sidebar item changes
    setShowAddStudentForm(false); // Reset student form state as well
  };

  const handleAddSessionClick = () => {
    setShowAddSessionForm(true);
  };

  const handleBackToSessions = () => {
    setShowAddSessionForm(false); // This will show the SessionsContent component again
    setSelectedItem('sessions'); // Make sure the sidebar item is correctly highlighted
  };

  const handleAddStudentClick = () => {
    setShowAddStudentForm(true);
  };

  const handleBackToStudents = () => {
    setShowAddStudentForm(false);
  };

  const renderContent = () => {
    switch (selectedItem) {
      case 'dashboard':
        return <DashboardContent />;
      case 'sessions':
        return showAddSessionForm ? (
          <AddSessionForm onBack={handleBackToSessions} />
        ) : (
          <SessionsContent onAddSessionClick={handleAddSessionClick} />
        );
      case 'students':
        return showAddStudentForm ? (
          <AddStudentForm onBack={handleBackToStudents} />
        ) : (
          <StudentsContent onAddStudent={handleAddStudentClick} />
        );
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
    <div className="flex flex-col h-screen ">

      <div className='flex'>
        <Sidebar onItemSelected={handleItemSelected} />
        <main className="flex-1 ">
          <button className='p-5 py-2 rounded-md bg-blue-500 hover:bg-blue-800' onClick={handleSignOut}>Sign Out</button>
          {renderContent()}
          {children} {/* Render additional protected pages here */}
        </main>
      </div>
    </div>
  );
}
