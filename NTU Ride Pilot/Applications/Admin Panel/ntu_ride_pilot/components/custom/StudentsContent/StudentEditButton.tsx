// components/StudentEditButton.tsx
import Link from 'next/link';
import { Pencil } from 'lucide-react';

type StudentEditButtonProps = {
  rollNo: string;
};

const StudentEditButton = ({ rollNo }: StudentEditButtonProps) => (
  <Link href={`/dashboard/students/add-student?formType=editForm&studentId=${rollNo}`}>
    <button className='text-white font-bold bg-blue-500 hover:bg-blue-700 rounded-lg px-4 py-2'>Edit</button>
  </Link>
);

export default StudentEditButton;
