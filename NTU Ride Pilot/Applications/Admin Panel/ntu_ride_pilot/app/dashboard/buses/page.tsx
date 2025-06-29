"use client"
import React from 'react'
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import BusesContent from '@/components/custom/BusesContent/BusesContent';

function page() {
  return (
    <DashboardLayout>
      <BusesContent/>
    </DashboardLayout>

  )
}

export default page