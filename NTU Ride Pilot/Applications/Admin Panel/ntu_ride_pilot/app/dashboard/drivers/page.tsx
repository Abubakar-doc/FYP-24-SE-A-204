"use client"
import React from 'react'
import DashboardLayout from '../dashboardLayout';
import DriversContent from '@/components/custom/DriversContent/DriversContent';

function page() {
  return (
    <DashboardLayout>
      <DriversContent/>
    </DashboardLayout>

  )
}

export default page