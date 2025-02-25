"use client"
//import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ProtectedRoute from "@/app/ProtectedRoute";
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
import { useState } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Admin Dashboard",
//   description: "Protected Admin Dashboard",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProtectedRoute>
          <div className="flex h-screen bg-gray-500">
            <Sidebar onItemSelected={handleItemSelected} />
            <main className="flex-1 p-4">
              {renderContent()}
              {children} {/* Render additional protected pages here */}
            </main>
          </div>
        </ProtectedRoute>
      </body>
    </html>
  );
}
