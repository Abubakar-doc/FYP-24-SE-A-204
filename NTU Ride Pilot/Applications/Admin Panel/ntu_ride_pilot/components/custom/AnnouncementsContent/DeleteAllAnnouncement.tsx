"use client";
import React, { useState } from 'react';

interface DeleteAllAnnouncementProps {
    onDeleteAll: () => Promise<void>;
    loading: boolean;
}

const DeleteAllAnnouncement: React.FC<DeleteAllAnnouncementProps> = ({ onDeleteAll, loading }) => {
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => setShowModal(true);

    const handleConfirm = async () => {
        setShowModal(false);
        await onDeleteAll();
    };

    return (
        <>
            <button
                className="w-40 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
                onClick={handleClick}
                disabled={loading}
            >
                Delete All
            </button>
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                        <div className="mb-6 text-lg font-semibold text-gray-800 text-center">
                            Are you sure you want to delete <span className="text-red-600">all announcements</span>?
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                                onClick={() => setShowModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? "Deleting..." : "Ok"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DeleteAllAnnouncement;
