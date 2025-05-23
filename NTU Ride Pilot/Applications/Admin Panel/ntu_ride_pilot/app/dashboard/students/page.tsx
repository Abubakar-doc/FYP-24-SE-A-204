"use client"
import StudentsContent from '@/components/custom/StudentsContent/StudentsContent';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../dashboardLayout';

export default function StudentsPage() {
  const router = useRouter();

  return (
    <div>
      <DashboardLayout>
      <StudentsContent />
      </DashboardLayout>
    </div>
  );
}
