"use client"
import React from 'react'
import DashboardLayout from '@/app/dashboard/DashboardLayout';
import AnnouncementsContent from '@/components/custom/AnnouncementsContent/AnnouncementsContent';

function page() {
  return (
    <DashboardLayout>
      <AnnouncementsContent/>
    </DashboardLayout>

  )
}

export default page;