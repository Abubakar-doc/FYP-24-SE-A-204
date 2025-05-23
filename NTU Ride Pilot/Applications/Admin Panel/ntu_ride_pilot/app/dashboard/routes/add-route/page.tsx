"use client"
import AddRouteForm from '@/components/custom/AddRoutes/AddRouteForm';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../dashboardLayout';

export default function AddSessionPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/routes');
  };

  return (
    <div>
        <DashboardLayout>
      <AddRouteForm onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
