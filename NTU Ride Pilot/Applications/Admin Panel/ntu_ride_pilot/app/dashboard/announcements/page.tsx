"use client"
import React from 'react'
import DashboardLayout from '../DashboardLayout';
import AnnouncementsContent from '@/components/custom/AnnouncementsContent/AnnouncementsContent';

function page() {
  return (
    <DashboardLayout>
      <AnnouncementsContent/>
    </DashboardLayout>

  )
}

export default page;