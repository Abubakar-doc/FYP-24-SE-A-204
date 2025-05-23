"use client"
import React from 'react'
import DashboardLayout from '../dashboardLayout';
import BusesContent from '@/components/custom/BusesContent/BusesContent';

function page() {
  return (
    <DashboardLayout>
      <BusesContent/>
    </DashboardLayout>

  )
}

export default page