"use client"
import React from 'react'
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import ComplaintsContent from '@/components/custom/ComplaintsContent/ComplaintsContent';

function page() {
  return (
    <DashboardLayout>
      <ComplaintsContent/>
    </DashboardLayout>

  )
}

export default page