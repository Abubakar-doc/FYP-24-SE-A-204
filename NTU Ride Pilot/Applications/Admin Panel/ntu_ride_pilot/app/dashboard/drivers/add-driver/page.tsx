"use client"
import AddDriverForm from '@/components/custom/AddDrivers/AddDriverForm';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../dashboardLayout';

export default function AddSessionPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/drivers');
  };

  return (
    <div>
        <DashboardLayout>
      <AddDriverForm onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
