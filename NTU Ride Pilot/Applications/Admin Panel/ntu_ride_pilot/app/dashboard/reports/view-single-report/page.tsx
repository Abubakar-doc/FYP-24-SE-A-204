// File: app/dashboard/view-single-report/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/app/dashboard/DashboardLayout";
import SingleReportContent from "@/components/custom/SingleReportContent/SingleReportContent";

export default function ViewSingleReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");

  const handleBack = () => {
    router.push("/dashboard/view-reports");
  };

  if (!reportId) {
    // Show message or redirect if no id
    return (
      <DashboardLayout>
        <div className="p-4 text-center text-red-600 font-semibold">
          No report ID specified.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SingleReportContent reportId={reportId} onBack={handleBack} />
    </DashboardLayout>
  );
}
