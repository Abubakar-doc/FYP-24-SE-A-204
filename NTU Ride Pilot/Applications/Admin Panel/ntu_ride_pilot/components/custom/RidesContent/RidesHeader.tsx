"use client";
import { useEffect, useState } from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';
import RidesHeaderRow from './RidesHeaderRow';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator'; // Import loading component
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

interface RideData {
  ride_id: string;
  route_id: string;
  name: string;
}

const RidesHeader: React.FC = () => {
  const [routeOptions, setRouteOptions] = useState<RideData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(true);
      try {
        const ridesRef = collection(firestore, "rides");
        const ridesQuery = query(
          ridesRef,
          where("ride_status", "in", ["idle", "inProgress"])
        );
        const ridesSnapshot = await getDocs(ridesQuery);

        const routeIdSet = new Set<string>();
        const rideDataMap = new Map<string, string>();

        // First pass to collect route IDs and ride IDs
        ridesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.route_id) {
            routeIdSet.add(data.route_id);
            rideDataMap.set(data.route_id, doc.id);
          }
        });

        const routeIds = Array.from(routeIdSet);
        const routeOptionsArr: RideData[] = [];

        // Second pass to get route names
        for (const route_id of routeIds) {
          const routeDocRef = collection(firestore, "routes");
          const routeQuery = query(routeDocRef, where("__name__", "==", route_id));
          const routeSnapshot = await getDocs(routeQuery);

          routeSnapshot.forEach(routeDoc => {
            const routeData = routeDoc.data();
            if (routeData.name) {
              routeOptionsArr.push({
                ride_id: rideDataMap.get(route_id) || '',
                route_id,
                name: routeData.name
              });
            }
          });
        }
        setRouteOptions(routeOptionsArr);
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRouteOptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-[#F5F5F5] p-4 rounded-md flex items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="w-full h-32 bg-[#F5F5F5] p-4 rounded-md">
      <div className="flex justify-end mb-4 mr-4">
        <HeaderIcons />
      </div>
      <RidesHeaderRow routeOptions={routeOptions} />
    </div>
  );
};

export default RidesHeader;
