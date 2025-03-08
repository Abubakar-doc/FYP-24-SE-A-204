"use client"
import React from 'react'
import DashboardLayout from '../DashboardLayout';
import SessionsContent from '@/components/custom/SessionsContent/SessionsContent';

function page() {
  return (
    <DashboardLayout>
      <SessionsContent/>
    </DashboardLayout>

  )
}

export default page