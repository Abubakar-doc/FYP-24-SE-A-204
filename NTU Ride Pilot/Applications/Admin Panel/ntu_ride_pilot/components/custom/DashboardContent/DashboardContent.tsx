import React, { ReactNode, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';


import {
  collection,
  getDocs,
  doc,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';


import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import DashboardHeader from './DashboardHeader ';


// React Icons
import { MdPerson, MdAltRoute } from 'react-icons/md';


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const initialStats = {
  students: {
    total: 0,
    active: 0,
    inactive: 0,
  },
  transport: {
    drivers: 0,
    buses: 0,
  },
  rides: {
    completed: 0,
    routes: 0,
  },
};


interface StatCardProps {
  icon: ReactNode;
  color: string;
  value: number;
  label: string;
  iconBg?: string;
}


// StatCard: fully transparent, no bg, no shadow, no border, no rounded
const StatCard: React.FC<StatCardProps> = ({ icon, color, value, label, iconBg }) => (
  <div className={`p-6 flex items-center gap-2`}>
    <div className={`flex items-center justify-center rounded-lg ${iconBg ? iconBg : 'bg-blue-100'} w-14 h-14`}>
      <span className="text-2xl rounded-lg p-2">{icon}</span>
    </div>
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  </div>
);


const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });


const formatWeek = (start: Date, end: Date) =>
  `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;


const formatMonth = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });


const DashboardContent: React.FC = () => {
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(true);


  const [ridesData, setRidesData] = useState<{ created_at: Date }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [barChartData, setBarChartData] = useState<any>({
    labels: [],
    datasets: [],
  });


  // Ongoing rides stats
  const [activeBuses, setActiveBuses] = useState(0);
  const [studentsOnboard, setStudentsOnboard] = useState(0);


  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // Students
        const studentsCollectionRef = collection(
          firestore,
          'users',
          'user_roles',
          'students'
        );
        const studentsSnapshot = await getDocs(studentsCollectionRef);


        let totalStudents = 0;
        let activeStudents = 0;
        let inactiveStudents = 0;


        studentsSnapshot.forEach(doc => {
          totalStudents += 1;
          const data = doc.data();
          const status = data.bus_card_status as string | undefined;
          if (status === 'Active') activeStudents += 1;
          else if (status === 'Inactive') inactiveStudents += 1;
        });


        // Drivers
        const userRolesDocRef = doc(firestore, 'users', 'user_roles');
        const driversCollectionRef = collection(userRolesDocRef, 'drivers');
        const driversSnapshot = await getDocs(driversCollectionRef);
        const totalDrivers = driversSnapshot.size;


        // Buses
        const busesCollectionRef = collection(firestore, 'buses');
        const busesSnapshot = await getDocs(busesCollectionRef);
        const totalBuses = busesSnapshot.size;


        // Rides (for stats and for ongoing rides)
        const ridesCollectionRef = collection(firestore, 'rides');
        const ridesSnapshot = await getDocs(ridesCollectionRef);
        let completedRides = 0;
        let ridesArr: { created_at: Date }[] = [];


        // For ongoing rides
        let ongoingActiveBuses = 0;
        let allOnboardStudents: any[] = [];


        ridesSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          // For completed rides stats
          if (data.ride_status === 'completed') {
            completedRides += 1;
            if (data.created_at && data.created_at.toDate) {
              ridesArr.push({ created_at: data.created_at.toDate() });
            }
          }
          // For ongoing rides stats
          if (data.ride_status === 'inProgress') {
            ongoingActiveBuses += 1;
            const offlineOnBoard = Array.isArray(data.offlineOnBoard) ? data.offlineOnBoard : [];
            const onlineOnBoard = Array.isArray(data.onlineOnBoard) ? data.onlineOnBoard : [];
            allOnboardStudents = allOnboardStudents.concat(offlineOnBoard, onlineOnBoard);
          }
        });
        // Routes
        const routesCollectionRef = collection(firestore, 'routes');
        const routesSnapshot = await getDocs(routesCollectionRef);
        const totalRoutes = routesSnapshot.size;


        setStats({
          students: {
            total: totalStudents,
            active: activeStudents,
            inactive: inactiveStudents,
          },
          transport: {
            drivers: totalDrivers,
            buses: totalBuses,
          },
          rides: {
            completed: completedRides,
            routes: totalRoutes,
          },
        });
        setRidesData(ridesArr);


        // Update ongoing rides stats
        setActiveBuses(ongoingActiveBuses);
        setStudentsOnboard(allOnboardStudents.length);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllStats();
  }, []);


  useEffect(() => {
    if (!ridesData.length) {
      setBarChartData({
        labels: [],
        datasets: [],
      });
      return;
    }
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];


    if (selectedCategory === 'weekly') {
      labels = [];
      data = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        labels.push(formatDate(day));
        const ridesCount = ridesData.filter(ride => {
          const rideDate = ride.created_at;
          return (
            rideDate.getFullYear() === day.getFullYear() &&
            rideDate.getMonth() === day.getMonth() &&
            rideDate.getDate() === day.getDate()
          );
        }).length;
        data.push(ridesCount);
      }
    } else if (selectedCategory === 'monthly') {
      labels = [];
      data = [];
      for (let i = 3; i >= 0; i--) {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() - i * 7);
        const startOfWeek = new Date(endOfWeek);
        startOfWeek.setDate(endOfWeek.getDate() - 6);


        labels.push(formatWeek(startOfWeek, endOfWeek));
        const ridesCount = ridesData.filter(ride => {
          const rideDate = ride.created_at;
          return rideDate >= startOfWeek && rideDate <= endOfWeek;
        }).length;
        data.push(ridesCount);
      }
    } else if (selectedCategory === 'yearly') {
      labels = [];
      data = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(formatMonth(monthDate));
        const ridesCount = ridesData.filter(ride => {
          const rideDate = ride.created_at;
          return (
            rideDate.getFullYear() === monthDate.getFullYear() &&
            rideDate.getMonth() === monthDate.getMonth()
          );
        }).length;
        data.push(ridesCount);
      }
    }
    setBarChartData({
      labels,
      datasets: [
        {
          label: 'Rides Completed',
          data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(100, 181, 246, 0.8)',
            'rgba(255, 138, 101, 0.8)',
            'rgba(174, 213, 129, 0.8)',
            'rgba(244, 143, 177, 0.8)',
            'rgba(255, 241, 118, 0.8)',
            'rgba(129, 212, 250, 0.8)',
          ].slice(0, labels.length),
          borderRadius: 8,
          barThickness: 32,
        },
      ],
    });
  }, [ridesData, selectedCategory]);
  const ridesChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: '#222',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#888',
        borderWidth: 1,
        padding: 12,
        caretSize: 8,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max:
          selectedCategory === 'weekly'
            ? 20
            : selectedCategory === 'monthly'
              ? 140
              : 600,
        ticks: {
          stepSize:
            selectedCategory === 'weekly'
              ? 4
              : selectedCategory === 'monthly'
                ? 28
                : 120,
        },
        grid: { color: '#e0e7ef' },
      },
      x: {
        grid: { display: false },
      },
    },
  };
  return (
    <div className="flex h-screen bg-white w-full overflow-x-hidden"> {/* Added overflow-x-hidden here */}
      {/* MAIN CONTENT COLUMN */}
      <div className="flex flex-col flex-1 h-screen relative">
        {/* Loading overlay - covers only the dashboard content, not sidebar */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <LoadingIndicator message="Loading dashboard data..." />
          </div>
        )}


        {/* HEADER: sticky at top, does not scroll */}
        <div className="flex-shrink-0 sticky top-0 z-20 bg-white">
          <div className="rounded-lg mb-2">
            <DashboardHeader activeBuses={activeBuses} studentsOnboard={studentsOnboard} />
          </div>
        </div>
        {/* BODY: fills remaining height, scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto"> {/* Added flex-1 min-h-0 overflow-y-auto here */}
          <div className="bg-white rounded-lg p-4">


            {/* STATISTICS MAIN CONTAINER */}
            <div className='bg-[#F5F5F5] rounded-md p-2 mb-8'>
              <h2 className="text-lg font-semibold mb-1 ml-5 text-blue-800">Statistics</h2>
              <div className="flex flex-row flex-wrap gap-28 mb-2 overflow-x-hidden">
                <StatCard
                  icon={<MdPerson />}
                  color="border-blue-400"
                  label="Students"
                  value={stats.students.total}
                  iconBg="bg-green-500"
                />
                <StatCard
                  icon={<MdPerson />}
                  color="border-indigo-400"
                  label="Drivers"
                  value={stats.transport.drivers}
                  iconBg="bg-purple-500"
                />
                <StatCard
                  icon={<MdAltRoute />}
                  color="border-pink-400"
                  label="Routes"
                  value={stats.rides.routes}
                  iconBg="bg-orange-500"
                />
                <StatCard
                  icon={<MdPerson />}
                  color="border-purple-400"
                  label="Total Rides"
                  value={stats.rides.completed}
                  iconBg="bg-blue-500"
                />
              </div>
            </div>


            {/* Rides Bar Chart */}
            <div className="bg-[#F5F5F5] rounded-xl shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Rides Completed</h3>
                <select
                  className="w-56 px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                >
                  <option value="weekly">Last 7 Days (Weekly)</option>
                  <option value="monthly">Last 4 Weeks (Monthly)</option>
                  <option value="yearly">Last 12 Months (Yearly)</option>
                </select>
              </div>
              <Bar options={ridesChartOptions} data={barChartData} />
            </div>


          </div>
        </div>
        {/* END BODY */}
      </div>
      {/* END MAIN CONTENT */}
    </div>
  );
};


export default DashboardContent;
