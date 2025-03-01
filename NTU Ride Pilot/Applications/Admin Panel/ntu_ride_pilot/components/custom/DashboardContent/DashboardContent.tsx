import React from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardContent: React.FC = () => {
  const chartData = {
    labels: ['7:00 AM', '2:10 PM', '4:40 PM', '7:30 PM'],
    datasets: [
      {
        label: 'Rides',
        data: [2, 4, 1, 5],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="p-4">
      {/* Ongoing Rides Section */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold text-blue-500">8</div>
            <div className="text-sm text-gray-500">Active Buses</div>
          </div>
          <button className="bg-blue-100 text-blue-500 rounded-full h-8 w-8 flex items-center justify-center">
            &gt;
          </button>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold text-blue-500">120</div>
            <div className="text-sm text-gray-500">Students Onboard</div>
          </div>
          <button className="bg-blue-100 text-blue-500 rounded-full h-8 w-8 flex items-center justify-center">
            &gt;
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center">
          {/* Student Icon - Replace with your preferred icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 01-9-5.197"
            />
          </svg>
          <div>
            <div className="text-xl font-semibold">0</div>
            <div className="text-sm text-gray-500">Student</div>
          </div>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center">
          {/* Driver Icon - Replace with your preferred icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <div>
            <div className="text-xl font-semibold">0</div>
            <div className="text-sm text-gray-500">Drivers</div>
          </div>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center">
          {/* Route Icon - Replace with your preferred icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-orange-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 4m8 16l-5.447-2.724A1 1 0 0115 16.382V5.618a1 1 0 011.447-.894L17 4m-4 16v-7.258A3.377 3.377 0 0112 6a3.379 3.379 0 01-3.376 3.376A3.378 3.378 0 015 12.742V20m4-16h4"
            />
          </svg>
          <div>
            <div className="text-xl font-semibold">0</div>
            <div className="text-sm text-gray-500">Routes</div>
          </div>
        </div>
        <div className="bg-white rounded-md shadow-sm p-4 flex items-center">
          {/* Total Rides Icon - Replace with your preferred icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-purple-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17l5 5l5-5M9 7l5-5l5 5"
            />
          </svg>
          <div>
            <div className="text-xl font-semibold">0</div>
            <div className="text-sm text-gray-500">Total Rides</div>
          </div>
        </div>
      </div>

      {/* Today's Ride Overview Section */}
      <div className="bg-white rounded-md shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Today's Ride Overview</h2>
          <button className="bg-blue-100 text-blue-500 rounded-full h-8 w-8 flex items-center justify-center">
            &gt;
          </button>
        </div>
        <Bar options={chartOptions} data={chartData} />
      </div>
    </div>
  );
};

export default DashboardContent;
