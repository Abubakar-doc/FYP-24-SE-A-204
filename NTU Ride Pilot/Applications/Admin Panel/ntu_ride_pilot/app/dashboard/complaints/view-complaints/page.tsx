"use client"

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import ViewComplaints from '@/components/custom/ViewComplaints/ViewComplaints';

export default function AddSessionPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/complaints');
  };

  return (
    <div>
        <DashboardLayout>
      <ViewComplaints onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
