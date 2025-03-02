"use client"
import AddStudentForm from '@/components/custom/Students/AddStudentForm';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/dashboard/DashboardLayout';

export default function AddStudentPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/students');
  };

  return (
    <div>
        <DashboardLayout>
      <AddStudentForm onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
