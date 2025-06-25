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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Initial dummy static data for other stats (except students, drivers, buses, rides.completed, routes which will be dynamic)
const initialStats = {
  students: {
    total: 0,
    active: 0,
    inactive: 0,
  },
  transport: {
    drivers: 0,  // will be updated dynamically
    buses: 0,    // will be updated dynamically
  },
  rides: {
    completed: 0,  // will be updated dynamically
    routes: 0,     // will be updated dynamically
  },
};

const ridesChartData = {
  labels: ['Route A', 'Route B', 'Route C', 'Route D', 'Route E'],
  datasets: [
    {
      label: 'Rides Completed',
      data: [120, 80, 60, 100, 60],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
      ],
      borderRadius: 6,
      barThickness: 32,
    },
  ],
};

const ridesChartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 20 },
    },
  },
};

// Define prop types for StatCard
interface StatCardProps {
  icon: ReactNode;
  color: string;
  value: number;
  label: string;
}

// Card Component
const StatCard: React.FC<StatCardProps> = ({ icon, color, value, label }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 flex items-center gap-4 border-t-4 ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-500">{label}</div>
    </div>
  </div>
);

const DashboardContent: React.FC = () => {
  const [stats, setStats] = useState(initialStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        // Fetch Students
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

        // Fetch Drivers
        const userRolesDocRef = doc(firestore, 'users', 'user_roles');
        const driversCollectionRef = collection(userRolesDocRef, 'drivers');
        const driversSnapshot = await getDocs(driversCollectionRef);
        const totalDrivers = driversSnapshot.size;

        // Fetch Buses
        const busesCollectionRef = collection(firestore, 'buses');
        const busesSnapshot = await getDocs(busesCollectionRef);
        const totalBuses = busesSnapshot.size;

        // Fetch Completed Rides
        const ridesCollectionRef = collection(firestore, 'rides');
        const ridesSnapshot = await getDocs(ridesCollectionRef);
        let completedRides = 0;
        ridesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.ride_status === 'completed') completedRides += 1;
        });

        // Fetch Routes
        const routesCollectionRef = collection(firestore, 'routes');
        const routesSnapshot = await getDocs(routesCollectionRef);
        const totalRoutes = routesSnapshot.size;

        // Update all stats at once
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
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <LoadingIndicator fullscreen message="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Students Stats */}
      <h2 className="text-lg font-semibold mb-2 text-blue-800">Student Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<span role="img" aria-label="students">🎓</span>}
          color="border-blue-400"
          value={stats.students.total}
          label="Total Registered Students"
        />
        <StatCard
          icon={<span role="img" aria-label="active">🟢</span>}
          color="border-green-400"
          value={stats.students.active}
          label="Active Bus Card Students"
        />
        <StatCard
          icon={<span role="img" aria-label="inactive">🔴</span>}
          color="border-red-400"
          value={stats.students.inactive}
          label="Inactive Bus Card Students"
        />
      </div>

      {/* Transport Stats */}
      <h2 className="text-lg font-semibold mb-2 text-blue-800">Transport Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<span role="img" aria-label="drivers">🧑‍✈️</span>}
          color="border-indigo-400"
          value={stats.transport.drivers}
          label="Total Drivers"
        />
        <StatCard
          icon={<span role="img" aria-label="buses">🚌</span>}
          color="border-yellow-400"
          value={stats.transport.buses}
          label="Total Buses"
        />
      </div>

      {/* Rides Stats */}
      <h2 className="text-lg font-semibold mb-2 text-blue-800">Rides Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<span role="img" aria-label="rides">✅</span>}
          color="border-purple-400"
          value={stats.rides.completed}
          label="Rides Completed"
        />
        <StatCard
          icon={<span role="img" aria-label="routes">🗺️</span>}
          color="border-pink-400"
          value={stats.rides.routes}
          label="Routes Defined"
        />
      </div>

      {/* Rides Bar Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Rides Per Route</h3>
        </div>
        <Bar options={ridesChartOptions} data={ridesChartData} />
      </div>
    </div>
  );
};

export default DashboardContent;
