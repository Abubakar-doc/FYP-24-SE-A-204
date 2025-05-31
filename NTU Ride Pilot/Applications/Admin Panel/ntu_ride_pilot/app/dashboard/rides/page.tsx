"use client"
import React from 'react'
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import RidesContent from '@/components/custom/RidesContent/RidesContent';

function page() {
  return (
    <DashboardLayout>
      <RidesContent/>
    </DashboardLayout>

  )
}

export default page;