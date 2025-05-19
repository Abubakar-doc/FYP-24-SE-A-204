// components/StudentDeleteButton.tsx
import { useState } from 'react';
import { firestore } from "@/lib/firebase";
import { doc, deleteDoc, updateDoc, arrayRemove, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';

type StudentDeleteButtonProps = {
    rollNo: string;
    onDelete: () => void;
};

const StudentDeleteButton = ({ rollNo, onDelete }: StudentDeleteButtonProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        
        try {
            // Get student document first to get email
            const studentDocRef = doc(firestore, 'users', 'user_roles', 'students', rollNo);
            const studentDoc = await getDoc(studentDocRef);
            
            if (!studentDoc.exists()) {
                throw new Error('Student document not found');
            }

            const studentData = studentDoc.data();
            const studentEmail = studentData?.email;

            // 1. Delete student document
            await deleteDoc(studentDocRef);

            // 2. Remove from all sessions
            const sessionsQuery = collection(firestore, 'sessions');
            const sessionsSnapshot = await getDocs(sessionsQuery);

            const sessionUpdates = sessionsSnapshot.docs
                .filter(doc => doc.data().roll_no?.includes(rollNo))
                .map(doc => updateDoc(doc.ref, { roll_no: arrayRemove(rollNo) }));
            
            await Promise.all(sessionUpdates);

            // 3. Delete bus card document
            const busCardsQuery = query(
                collection(firestore, 'bus_cards'),
                where('roll_no', '==', rollNo)
            );
            const busCardsSnapshot = await getDocs(busCardsQuery);
            
            const busCardDeletions = busCardsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(busCardDeletions);

            // 4. Delete user from authentication if email exists
            if (studentEmail) {
                try {
                    const response = await fetch('/api/delete-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: studentEmail }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete auth user');
                    }
                } catch (authError) {
                    console.error("Error deleting user from authentication:", authError);
                    // Continue even if auth deletion fails
                    setError(`Student data deleted but auth account deletion failed: ${(authError as Error).message}`);
                }
            }

            onDelete();
        } catch (error) {
            console.error("Error deleting student:", error);
            setError(`Failed to delete student: ${(error as Error).message}`);
        } finally {
            setIsDeleting(false);
            if (!error) {
                setShowConfirm(false);
            }
        }
    };

    return (
        <>
            <button
                className='text-white font-bold rounded-lg bg-slate-500 hover:bg-slate-700 px-4 py-2'
                onClick={() => {
                    setError(null);
                    setShowConfirm(true);
                }}
            >
                Delete
            </button>
           
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                        <p>Are you sure you want to delete student {rollNo}?</p>
                        <p className="text-red-500 text-sm mt-2">
                            This will permanently delete all student data including bus card and account.
                        </p>
                        
                        {error && (
                            <div className="mt-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 mt-4">
                            <button
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                onClick={() => {
                                    setError(null);
                                    setShowConfirm(false);
                                }}
                                disabled={isDeleting}
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