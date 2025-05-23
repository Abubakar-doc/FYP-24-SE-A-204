"use client"
import AddSessionForm from '@/components/custom/AddSessions/AddSessions';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/dashboardLayout';

export default function AddSessionPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/sessions');
  };

  return (
    <div>
        <DashboardLayout>
      <AddSessionForm onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
