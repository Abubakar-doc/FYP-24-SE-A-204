"use client";
import { useEffect, useState } from 'react';
import HeaderIcons from '../HeaderIcons/HeaderIcons';
import RidesHeaderRow from './RidesHeaderRow';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

interface RideData {
  ride_id: string;
  route_id: string;
  name: string; // route name
  busName: string; // bus_id from ride doc
}

const RidesHeader: React.FC = () => {
  const [rideOptions, setRideOptions] = useState<RideData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const ridesRef = collection(firestore, "rides");
    // Query rides with ride_status either "idle" or "inProgress"
    const ridesQuery = query(
      ridesRef,
      where("ride_status", "in", ["idle", "inProgress"])
    );

    // Real-time listener for rides with status idle or inProgress
    const unsubscribe = onSnapshot(ridesQuery, async (snapshot) => {
      const rideOptionsArr: RideData[] = [];

      // For each ride document, get route name and prepare options
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!data.route_id) continue;

        try {
          const routeDocRef = collection(firestore, "routes");
          const routeQuery = query(routeDocRef, where("__name__", "==", data.route_id));
          const routeSnapshot = await getDocs(routeQuery);

          routeSnapshot.forEach(routeDoc => {
            const routeData = routeDoc.data();
            if (routeData.name) {
              rideOptionsArr.push({
                ride_id: docSnap.id,
                route_id: data.route_id,
                name: routeData.name,
                busName: data.bus_id || "", // bus_id used as bus name
              });
            }
          });
        } catch (error) {
          console.error(`Error fetching route ${data.route_id}:`, error);
        }
      }

      setRideOptions(rideOptionsArr);
      if (isLoading) setIsLoading(false);
    }, (error) => {
      console.error("Error listening to rides:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoading]);

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
      <RidesHeaderRow routeOptions={rideOptions} />
    </div>
  );
};

export default RidesHeader;
