"use client"

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import RoutesContent from '@/components/custom/RoutesContent/RoutesContent';

export default function RoutesPage() {
  const router = useRouter();

  return (
    <div>
      <DashboardLayout>
      <RoutesContent />
      </DashboardLayout>
    </div>
  );
}
