"use client"
import StudentsContent from '@/components/custom/StudentsContent/StudentsContent';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../DashboardLayout';

export default function StudentsPage() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // Implement search logic here
  };

  const handleFilter = (filterValue: string) => {
    console.log('Filter value:', filterValue);
    // Implement filter logic here
  };

  const handleAddStudent = () => {
    router.push('/dashboard/students/add-student');
  };

  return (
    <div>
      <DashboardLayout>
      <StudentsContent />
      </DashboardLayout>
    </div>
  );
}
