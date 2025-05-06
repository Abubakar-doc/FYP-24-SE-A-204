"use client"
import AddAnnouncementsForm from '@/components/custom/AddAnnouncements/AddAnnouncementsForm';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../DashboardLayout';

export default function AddSessionPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard/announcements');
  };

  return (
    <div>
        <DashboardLayout>
      <AddAnnouncementsForm onBack={handleBack} />
      </DashboardLayout>
    </div>
  );
}
