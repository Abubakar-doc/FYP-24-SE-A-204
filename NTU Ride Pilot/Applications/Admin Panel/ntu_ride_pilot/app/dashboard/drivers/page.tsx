"use client"
import React from 'react'
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import DriversContent from '@/components/custom/DriversContent/DriversContent';

function page() {
  return (
    <DashboardLayout>
      <DriversContent/>
    </DashboardLayout>

  )
}

export default page