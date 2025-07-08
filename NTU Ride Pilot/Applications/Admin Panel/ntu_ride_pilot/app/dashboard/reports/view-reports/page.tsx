"use client"

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import ViewReports from '@/components/custom/ViewReports/ViewReports';

export default function AddSessionPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/reports');
  };

  return (
    <div>
        <DashboardLayout>
      <ViewReports onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
