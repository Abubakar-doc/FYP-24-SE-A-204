// components/StudentDeleteButton.tsx
import { useState } from 'react';
import { firestore } from "@/lib/firebase";
import { doc, deleteDoc, updateDoc, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

type StudentDeleteButtonProps = {
    rollNo: string;
    onDelete: () => void;
};

const StudentDeleteButton = ({ rollNo, onDelete }: StudentDeleteButtonProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            // Delete student document
            await deleteDoc(doc(firestore, 'users', 'user_roles', 'students', rollNo));

            // Remove from all sessions
            const sessionsQuery = collection(firestore, 'sessions');
            const sessionsSnapshot = await getDocs(sessionsQuery);

            sessionsSnapshot.forEach(async (sessionDoc) => {
                if (sessionDoc.data().roll_no?.includes(rollNo)) {
                    await updateDoc(sessionDoc.ref, {
                        roll_no: arrayRemove(rollNo)
                    });
                }
            });

            onDelete();
        } catch (error) {
            console.error("Error deleting student:", error);
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <>

            <button
             className='text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2'
             onClick={() => setShowConfirm(true)} >
             Delete
            </button>
           
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p>Are you sure you want to delete student {rollNo}?</p>
                        <div className="flex justify-end gap-4 mt-4">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                onClick={() => setShowConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentDeleteButton;
