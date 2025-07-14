"use client";

import Sidebar from '@/components/custom/sidebar/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState(pathname);

  const handleSidebarItemClick = (href: string) => {
    setActiveItem(href);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/signin'); // Redirect to sign-in page after logout
    } catch (error) {
      console.error('Failed to logout:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex h-full">
        <Sidebar
          activeItem={activeItem}
          onItemClick={handleSidebarItemClick}
          onLogout={handleLogout} // Pass logout handler here
          className="w-60 flex-shrink-0 overflow-hidden"
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
