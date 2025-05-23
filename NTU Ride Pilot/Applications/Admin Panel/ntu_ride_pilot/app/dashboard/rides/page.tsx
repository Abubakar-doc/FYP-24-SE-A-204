"use client"
import React from 'react'
import DashboardLayout from '@/app/dashboard/dashboardLayout';
import RidesContent from '@/components/custom/RidesContent/RidesContent';

function page() {
  return (
    <DashboardLayout>
      <RidesContent/>
    </DashboardLayout>

  )
}

export default page;