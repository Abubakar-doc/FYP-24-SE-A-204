"use client";
import Link from 'next/link';
import HeaderIcons from '../HeaderIcons/HeaderIcons';
import DeleteAllAnnouncement from './DeleteAllAnnouncement';

interface AnnouncementsHeaderProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  onDeleteAll: () => Promise<void>;
  deleteAllLoading: boolean;
}

const AnnouncementsHeader: React.FC<AnnouncementsHeaderProps> = ({
    searchInput,
    setSearchInput,
    onDeleteAll,
    deleteAllLoading
}) => {
    return (
        <div className="w-full h-32 bg-[#F5F5F5] p-4 rounded-md">
            {/* Header Icons Row */}
            <div className="flex justify-end mb-6 mr-4">
                <HeaderIcons />
            </div>

            {/* Main Header Section */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Announcements</h2>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            className='w-80 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300'
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            {/* Search Icon */}
                            {/* SVG code goes here */}
                        </button>
                    </div>
                    <DeleteAllAnnouncement onDeleteAll={onDeleteAll} loading={deleteAllLoading} />
                    <Link href="/dashboard/announcements/add-announcements">
                        <button
                            className="w-40 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
                        >
                            Create
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsHeader;
