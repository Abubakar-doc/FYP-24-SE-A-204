"use client"
import Sidebar from '@/components/custom/sidebar/Sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen">
      <div className="flex h-full">
        <Sidebar activeItem={pathname} className="w-60 flex-shrink-0 overflow-hidden" />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
