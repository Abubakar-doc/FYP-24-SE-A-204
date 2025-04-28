"use client"
import AddBusForm from '@/components/custom/AddBuses/AddBusForm';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../DashboardLayout';

export default function AddSessionPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/buses');
  };

  return (
    <div>
        <DashboardLayout>
      <AddBusForm onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
