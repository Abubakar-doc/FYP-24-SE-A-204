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
}

const StatCard: React.FC<StatCardProps> = ({ icon, color, value, label }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 flex items-center gap-4 border-t-4 ${color}`}>
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-500">{label}</div>
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

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
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

        const userRolesDocRef = doc(firestore, 'users', 'user_roles');
        const driversCollectionRef = collection(userRolesDocRef, 'drivers');
        const driversSnapshot = await getDocs(driversCollectionRef);
        const totalDrivers = driversSnapshot.size;

        const busesCollectionRef = collection(firestore, 'buses');
        const busesSnapshot = await getDocs(busesCollectionRef);
        const totalBuses = busesSnapshot.size;

        const ridesCollectionRef = collection(firestore, 'rides');
        const ridesSnapshot = await getDocs(ridesCollectionRef);
        let completedRides = 0;
        let ridesArr: { created_at: Date }[] = [];
        ridesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.ride_status === 'completed') {
            completedRides += 1;
            if (data.created_at && data.created_at.toDate) {
              ridesArr.push({ created_at: data.created_at.toDate() });
            }
          }
        });

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
  );
};

export default DashboardContent;
