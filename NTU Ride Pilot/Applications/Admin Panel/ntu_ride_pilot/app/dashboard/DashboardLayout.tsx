"use client"
import Sidebar from '@/components/custom/sidebar/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
// import 'mapbox-gl/dist/mapbox-gl.css';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSidebarItemClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex h-full">
        <Sidebar
          activeItem={pathname}
          onItemClick={handleSidebarItemClick}
          className="w-60 flex-shrink-0 overflow-hidden"
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}