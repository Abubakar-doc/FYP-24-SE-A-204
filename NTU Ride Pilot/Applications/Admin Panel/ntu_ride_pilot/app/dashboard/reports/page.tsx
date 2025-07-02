"use client"
import React from 'react'
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import ReportsContent from '@/components/custom/ReportsContent/ReportsContent';

function page() {
  return (
    <DashboardLayout>
      <ReportsContent />
    </DashboardLayout>

  )
}

export default page