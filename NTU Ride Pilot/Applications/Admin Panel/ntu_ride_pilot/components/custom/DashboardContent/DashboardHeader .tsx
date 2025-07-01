"use client";
import HeaderIcons from '../HeaderIcons/HeaderIcons';

interface DashboardHeaderProps {
    activeBuses: number;
    studentsOnboard: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeBuses, studentsOnboard }) => {
    return (
        <div className="w-full bg-[#F5F5F5] p-4 rounded-md mb-6 ">
            {/* Header Icons Row */}
            <div className="flex justify-end mb-6 mr-4">
                <HeaderIcons />
            </div>

            {/* Heading on its own line */}
            <h2 className="text-2xl font-semibold mb-6">Ongoing Rides</h2>

            {/* Cards on a separate line */}
            <div className="flex items-center gap-12">
                {/* Active Buses Card */}
                <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center px-10 py-4 min-w-[47%]">
                    <span className="text-3xl font-bold text-blue-600">{activeBuses}</span>
                    <span className="text-md font-medium text-blue-600 mt-1">Active Buses</span>
                </div>
                {/* Students Onboard Card */}
                <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center px-10 py-4 min-w-[47%]">
                    <span className="text-3xl font-bold text-blue-600">{studentsOnboard}</span>
                    <span className="text-md font-medium text-blue-600 mt-1">Students Onboard</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;
